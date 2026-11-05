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

  it('does not invent words for a silent recording', async () => {
    const speech = new SpeechService({
      get: () => undefined,
    } as unknown as ConfigService);
    const wav = Buffer.alloc(44 + 3200);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(36 + 3200, 4);
    wav.write('WAVE', 8);
    wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(16000, 24);
    wav.writeUInt32LE(32000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(3200, 40);

    await expect(speech.transcribe(wav)).resolves.toBe('');
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
