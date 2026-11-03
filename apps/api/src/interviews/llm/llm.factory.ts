import { ConfigService } from '@nestjs/config';
import type { LlmClient } from './llm.types';
import { MockLlmClient } from './mock-llm.client';
import { OpenAiCompatibleLlmClient } from './openai-compatible-llm.client';

export function createLlmClient(config: ConfigService): LlmClient {
  const provider = (config.get<string>('LLM_PROVIDER') ?? 'mock')
    .trim()
    .toLowerCase();

  if (provider === 'ollama') {
    return new OpenAiCompatibleLlmClient({
      baseUrl:
        config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434/v1',
      model: config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:7b-instruct',
      timeoutMs: Number(config.get<string>('LLM_TIMEOUT_MS') ?? 120_000),
      apiKey: config.get<string>('OLLAMA_API_KEY') ?? 'ollama',
    });
  }

  return new MockLlmClient();
}
