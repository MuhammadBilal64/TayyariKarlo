import { parseEvaluation } from './parse-evaluation';

describe('parseEvaluation', () => {
  it('reads a rubric and a follow-up', () => {
    const result = parseEvaluation(
      '{"score":48,"feedback":"Misses the trade-off.","dimensions":{"correctness":55,"depth":40,"tradeoffs":20,"clarity":70},"followUp":"What consistency would you give up?"}',
    );

    expect(result.score).toBe(48);
    expect(result.followUp).toBe('What consistency would you give up?');
    expect(result.dimensions.tradeoffs).toBe(20);
  });

  it('rejects a response that is not a rubric', () => {
    expect(() => parseEvaluation('nice answer, maybe 60')).toThrow(
      'No JSON object',
    );
  });

  it('drops a follow-up that is too short to ask', () => {
    const result = parseEvaluation(
      '{"score":80,"feedback":"Solid.","dimensions":{"correctness":80,"depth":80,"tradeoffs":80,"clarity":80},"followUp":"Why?"}',
    );

    expect(result.followUp).toBeNull();
  });
});
