import {
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AnswerEvaluation,
  InterviewLlmContext,
  InterviewSummary,
  LlmClient,
} from './llm.types';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type OpenAiCompatibleConfig = {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  apiKey?: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('No JSON object in model response');
  }
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
          'You are a technical interviewer. Reply with ONLY the next interview question as plain text. No preamble, no numbering labels, no JSON.',
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
    const content = await this.chat([
      {
        role: 'system',
        content:
          'You evaluate interview answers. Respond with ONLY JSON: {"score":0-100,"feedback":"2-4 sentences"}.',
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
    ]);

    try {
      const parsed = extractJsonObject(content) as {
        score?: unknown;
        feedback?: unknown;
      };
      const feedback =
        typeof parsed.feedback === 'string' && parsed.feedback.trim()
          ? parsed.feedback.trim()
          : content.trim();
      return { feedback, score: clampScore(Number(parsed.score)) };
    } catch {
      return {
        score: 60,
        feedback: contentFallback(answerText),
      };
    }
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
          'You summarize a mock interview. Respond with ONLY JSON: {"overallScore":0-100,"overallFeedback":"3-5 sentences"}.',
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
      const overallFeedback =
        typeof parsed.overallFeedback === 'string' &&
        parsed.overallFeedback.trim()
          ? parsed.overallFeedback.trim()
          : content.trim();
      return {
        overallFeedback,
        overallScore: clampScore(Number(parsed.overallScore)),
      };
    } catch {
      const scored = ctx.previousTurns.filter((t) => t.score !== null);
      const overallScore =
        scored.length === 0
          ? 60
          : Math.round(
              scored.reduce((sum, t) => sum + (t.score ?? 0), 0) /
                scored.length,
            );
      return {
        overallScore,
        overallFeedback: `Interview complete for ${ctx.role}. Average turn score ${overallScore}/100. Review each turn’s feedback for concrete next steps.`,
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

function contentFallback(answerText: string): string {
  return `Could not parse structured model feedback. Your answer length was ${answerText.trim().length} characters. Rephrase with situation, approach, and trade-offs.`;
}
