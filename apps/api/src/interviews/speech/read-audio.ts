import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { MAX_AUDIO_BYTES } from './wav';

export async function readAudioBody(req: Request): Promise<Buffer> {
  const type = req.headers['content-type'] ?? '';
  if (
    type &&
    !type.includes('audio/wav') &&
    !type.includes('audio/x-wav') &&
    !type.includes('audio/wave')
  ) {
    throw new BadRequestException('Audio must be a WAV file');
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const piece = Buffer.from(asBytes(chunk));
    total += piece.length;
    if (total > MAX_AUDIO_BYTES) {
      throw new BadRequestException('Audio must be 8 MB or smaller');
    }
    chunks.push(piece);
  }
  return Buffer.concat(chunks);
}

function asBytes(chunk: unknown): Uint8Array {
  if (chunk instanceof Uint8Array) return chunk;
  if (typeof chunk === 'string') return Buffer.from(chunk);
  throw new BadRequestException('Audio must be a WAV file');
}
