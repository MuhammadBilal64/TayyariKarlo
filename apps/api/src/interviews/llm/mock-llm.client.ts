import type {
  AnswerEvaluation,
  InterviewLlmContext,
  InterviewSummary,
  LlmClient,
} from './llm.types';

export class MockLlmClient implements LlmClient {
  readonly provider = 'mock' as const;

  async generateQuestion(
    ctx: InterviewLlmContext,
    orderIndex: number,
  ): Promise<string> {
    const tech = ctx.techStack[0] ?? 'your stack';
    const prompts = [
      `Practice mode: For a ${ctx.experienceLevel} ${ctx.role} role using ${tech}, explain a recent project and your contribution.`,
      `Practice mode: How would you design a simple REST API for ${tech}? Walk through resources and error handling.`,
      `Practice mode: Describe how you debug a production issue in a ${ctx.role} context.`,
      `Practice mode: What trade-offs would you consider when choosing ${tech} for this role?`,
      `Practice mode: Tell me about a time you improved performance or reliability in a system you worked on.`,
      `Practice mode: How do you collaborate with teammates when requirements are unclear?`,
      `Practice mode: What testing strategy would you use for a feature in ${tech}?`,
      `Practice mode: Explain a core concept from ${tech} you use weekly, in plain language.`,
      `Practice mode: How do you prioritize work when multiple stakeholders disagree?`,
      `Practice mode: What would you want to learn next to grow as a ${ctx.experienceLevel} ${ctx.role}?`,
    ];
    return prompts[orderIndex % prompts.length]!;
  }

  async evaluateAnswer(
    _ctx: InterviewLlmContext,
    _questionText: string,
    answerText: string,
  ): Promise<AnswerEvaluation> {
    const length = answerText.trim().length;
    const score =
      length < 40 ? 45 : length < 120 ? 65 : length < 280 ? 80 : 90;
    return {
      score,
      feedback: `Practice mode feedback: Your answer was ${length} characters. Aim for a clear structure (situation → action → result) and call out concrete trade-offs. Score ${score}/100.`,
    };
  }

  async summarize(ctx: InterviewLlmContext): Promise<InterviewSummary> {
    const scored = ctx.previousTurns.filter((t) => t.score !== null);
    const overallScore =
      scored.length === 0
        ? 60
        : Math.round(
            scored.reduce((sum, t) => sum + (t.score ?? 0), 0) / scored.length,
          );
    return {
      overallScore,
      overallFeedback: `Practice mode summary: Completed ${scored.length} of ${ctx.questionCount} questions for ${ctx.role}. Overall score ${overallScore}/100. This is scripted feedback (LLM_PROVIDER=mock)—run the API locally with Ollama for live model quality.`,
    };
  }
}
