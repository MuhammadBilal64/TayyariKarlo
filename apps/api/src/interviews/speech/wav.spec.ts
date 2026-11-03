import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { assertWav, MAX_AUDIO_BYTES } from './wav';

function pcmWav(options: { sampleRate: number; dataBytes: number }): Buffer {
  const { sampleRate, dataBytes } = options;
  const channels = 1;
  const bits = 16;
  const blockAlign = channels * (bits / 8);
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bits, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

describe('assertWav', () => {
  it('accepts a short PCM wav', () => {
    expect(() =>
      assertWav(pcmWav({ sampleRate: 16000, dataBytes: 3200 })),
    ).not.toThrow();
  });

  it('rejects a non-wav payload', () => {
    expect(() => assertWav(Buffer.from('not-a-wav'))).toThrow(
      BadRequestException,
    );
  });

  it('rejects audio longer than 3 minutes', () => {
    const tooLong = pcmWav({
      sampleRate: 800,
      dataBytes: 800 * 2 * 181,
    });
    expect(() => assertWav(tooLong)).toThrow(BadRequestException);
  });

  it('rejects audio larger than 8 MB', () => {
    const oversized = Buffer.alloc(MAX_AUDIO_BYTES + 1);
    oversized.write('RIFF', 0);
    oversized.write('WAVE', 8);
    expect(() => assertWav(oversized)).toThrow(PayloadTooLargeException);
  });
});
