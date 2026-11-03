import { ServiceUnavailableException } from '@nestjs/common';
import type {
  AnswerEvaluation,
  InterviewLlmContext,
  InterviewSummary,
  LlmClient,
} from './llm.types';
import { extractJsonObject, parseEvaluation } from './parse-evaluation';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type OpenAiCompatibleConfig = {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  apiKey?: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class OpenAiCompatibleLlmClient implements LlmClient {
  readonly provider = 'ollama' as const;

  constructor(private readonly config: OpenAiCompatibleConfig) {}

  async generateQuestion(
    ctx: InterviewLlmContext,
    orderIndex: number,
  ): Promise<string> {
    const prior = ctx.previousTurns
      .map(
        (t) =>
          `Q${t.orderIndex + 1}: ${t.questionText}\nA: ${t.answerText ?? '(unanswered)'}`,
      )
      .join('\n\n');

    const content = await this.chat([
      {
        role: 'system',
        content:
          'You are a working technical interviewer. Reply with ONLY the next interview question as plain text. One question. Do not repeat a prior question. No preamble, no numbering, no JSON.',
      },
      {
        role: 'user',
        content: [
          `Role: ${ctx.role}`,
          `Experience: ${ctx.experienceLevel}`,
          `Tech stack: ${ctx.techStack.join(', ')}`,
          `Question ${orderIndex + 1} of ${ctx.questionCount}.`,
          prior ? `Prior turns:\n${prior}` : 'No prior turns.',
          'Ask one focused technical or behavioral interview question.',
        ].join('\n'),
      },
    ]);

    const question = content.trim();
    if (!question) {
      throw new ServiceUnavailableException('LLM returned an empty question');
    }
    return question;
  }

  async evaluateAnswer(
    ctx: InterviewLlmContext,
    questionText: string,
    answerText: string,
  ): Promise<AnswerEvaluation> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: [
          'You are a working technical interviewer who just listened to a spoken answer.',
          'Judge the technical content. Do not reward length, confidence, or filler.',
          'Respond with ONLY JSON:',
          '{"score":0-100,"feedback":"3-5 sentences","dimensions":{"correctness":0-100,"depth":0-100,"tradeoffs":0-100,"clarity":0-100},"followUp":null}',
          'feedback is spoken to the candidate before the next question. Interpret what they actually said, what held up, and what was missing or wrong. Refer to their claims. Do not use a stock template.',
          'followUp must be null. The round is a fixed set of questions.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `Role: ${ctx.role} (${ctx.experienceLevel})`,
          `Tech: ${ctx.techStack.join(', ')}`,
          `Question: ${questionText}`,
          `Candidate answer: ${answerText}`,
        ].join('\n'),
      },
    ];

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const content = await this.chat(messages);
      try {
        return parseEvaluation(content);
      } catch (error) {
        lastError = error;
        messages.push({ role: 'assistant', content });
        messages.push({
          role: 'user',
          content:
            'That was not valid JSON. Reply again with ONLY the JSON object.',
        });
      }
    }

    throw new ServiceUnavailableException(
      lastError instanceof Error
        ? `Interview judge returned invalid JSON: ${lastError.message}`
        : 'Interview judge returned invalid JSON',
    );
  }

  async summarize(ctx: InterviewLlmContext): Promise<InterviewSummary> {
    const transcript = ctx.previousTurns
      .map(
        (t) =>
          `Q${t.orderIndex + 1}: ${t.questionText}\nA: ${t.answerText ?? ''}\nScore: ${t.score ?? 'n/a'}\nFeedback: ${t.feedback ?? ''}`,
      )
      .join('\n\n');

    const content = await this.chat([
      {
        role: 'system',
        content:
          'You debrief a technical interview. Respond with ONLY JSON: {"overallScore":0-100,"overallFeedback":"strengths, gaps, and what to study next in 3-5 sentences"}.',
      },
      {
        role: 'user',
        content: [
          `Role: ${ctx.role} (${ctx.experienceLevel})`,
          `Tech: ${ctx.techStack.join(', ')}`,
          transcript,
        ].join('\n'),
      },
    ]);

    try {
      const parsed = extractJsonObject(content) as {
        overallScore?: unknown;
        overallFeedback?: unknown;
      };
      if (
        typeof parsed.overallFeedback !== 'string' ||
        !parsed.overallFeedback.trim() ||
        typeof parsed.overallScore !== 'number'
      ) {
        throw new Error('Incomplete debrief JSON');
      }
      return {
        overallFeedback: parsed.overallFeedback.trim(),
        overallScore: clampScore(parsed.overallScore),
      };
    } catch {
      const scored = ctx.previousTurns.filter((t) => t.score !== null);
      if (scored.length === 0) {
        throw new ServiceUnavailableException(
          'Interview debrief was not valid JSON',
        );
      }
      const overallScore = Math.round(
        scored.reduce((sum, t) => sum + (t.score ?? 0), 0) / scored.length,
      );
      return {
        overallScore,
        overallFeedback: `Round complete for ${ctx.role}. Average of the judged answers is ${overallScore}/100. Review each rubric for what to study next.`,
      };
    }
  }

  private async chat(messages: ChatMessage[]): Promise<string> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey || 'ollama'}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.4,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          `LLM request failed (${response.status})`,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new ServiceUnavailableException('LLM returned no content');
      }
      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'LLM provider unreachable or timed out. Is Ollama running?',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
