export type LlmProviderName = 'mock' | 'ollama';

export type InterviewLlmContext = {
  role: string;
  techStack: string[];
  experienceLevel: string;
  questionCount: number;
  previousTurns: Array<{
    orderIndex: number;
    questionText: string;
    answerText: string | null;
    feedback: string | null;
    score: number | null;
  }>;
};

export type RubricDimensions = {
  correctness: number;
  depth: number;
  tradeoffs: number;
  clarity: number;
};

export type AnswerEvaluation = {
  feedback: string;
  score: number;
  dimensions: RubricDimensions;
  followUp: string | null;
};

export type InterviewSummary = {
  overallFeedback: string;
  overallScore: number;
};

export interface LlmClient {
  readonly provider: LlmProviderName;
  generateQuestion(
    ctx: InterviewLlmContext,
    orderIndex: number,
  ): Promise<string>;
  evaluateAnswer(
    ctx: InterviewLlmContext,
    questionText: string,
    answerText: string,
  ): Promise<AnswerEvaluation>;
  summarize(ctx: InterviewLlmContext): Promise<InterviewSummary>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');
