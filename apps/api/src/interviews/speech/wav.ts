import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';

export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 180;

export function assertWav(buffer: Buffer): void {
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new PayloadTooLargeException('Audio must be 8 MB or smaller');
  }
  if (buffer.length < 44 || !isWave(buffer)) {
    throw new BadRequestException('Audio must be a WAV file');
  }

  const format = readFormat(buffer);
  if (!format) {
    throw new BadRequestException('Audio must be a PCM WAV file');
  }

  const bytesPerSecond =
    format.sampleRate * format.channels * (format.bits / 8);
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    throw new BadRequestException('Audio must be a PCM WAV file');
  }

  if (format.dataBytes / bytesPerSecond > MAX_AUDIO_SECONDS) {
    throw new BadRequestException('Audio must be 3 minutes or shorter');
  }
}

function isWave(buffer: Buffer): boolean {
  return (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  );
}

function readFormat(buffer: Buffer): {
  sampleRate: number;
  channels: number;
  bits: number;
  dataBytes: number;
} | null {
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bits = 0;
  let dataBytes = 0;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ' && start + 16 <= buffer.length) {
      channels = buffer.readUInt16LE(start + 2);
      sampleRate = buffer.readUInt32LE(start + 4);
      bits = buffer.readUInt16LE(start + 14);
    } else if (id === 'data') {
      dataBytes = Math.min(size, Math.max(0, buffer.length - start));
      break;
    }
    const step = 8 + size + (size % 2);
    if (step <= 0) break;
    offset += step;
  }

  if (sampleRate <= 0 || channels <= 0 || bits <= 0 || dataBytes <= 0) {
    return null;
  }

  return { sampleRate, channels, bits, dataBytes };
}
