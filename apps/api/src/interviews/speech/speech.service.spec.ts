import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechService } from './speech.service';

describe('SpeechService', () => {
  it('explains setup when whisper is not configured', async () => {
    const speech = new SpeechService({
      get: () => undefined,
    } as unknown as ConfigService);

    await expect(speech.transcribe(Buffer.from('RIFF'))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('explains setup when piper is not configured', async () => {
    const speech = new SpeechService({
      get: () => '',
    } as unknown as ConfigService);

    await expect(speech.synthesize('Hello')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
