import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SETUP =
  'Local speech is not set up. Install whisper.cpp and Piper, set WHISPER_BIN, WHISPER_MODEL, PIPER_BIN, and PIPER_MODEL, or type your answer.';

@Injectable()
export class SpeechService {
  constructor(private readonly config: ConfigService) {}

  async transcribe(audio: Buffer): Promise<string> {
    const bin = this.required('WHISPER_BIN');
    const model = this.required('WHISPER_MODEL');
    const timeoutMs = Number(
      this.config.get<string>('WHISPER_TIMEOUT_MS') ?? 60_000,
    );
    const dir = await mkdtemp(join(tmpdir(), 'tayyari-stt-'));
    try {
      const wavPath = join(dir, 'answer.wav');
      const outBase = join(dir, 'answer');
      await writeFile(wavPath, audio);
      await this.run(
        bin,
        [
          '-m',
          model,
          '-f',
          wavPath,
          '-l',
          'en',
          '-otxt',
          '-of',
          outBase,
          '-np',
        ],
        timeoutMs,
      );
      const transcript = await readFile(`${outBase}.txt`, 'utf8');
      return cleanTranscript(transcript);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  async synthesize(text: string): Promise<Buffer> {
    const bin = this.required('PIPER_BIN');
    const model = this.required('PIPER_MODEL');
    const timeoutMs = Number(
      this.config.get<string>('PIPER_TIMEOUT_MS') ?? 30_000,
    );
    const dir = await mkdtemp(join(tmpdir(), 'tayyari-tts-'));
    try {
      const wavPath = join(dir, `${randomUUID()}.wav`);
      await this.run(
        bin,
        ['--model', model, '--output_file', wavPath],
        timeoutMs,
        text,
      );
      return await readFile(wavPath);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  private required(key: string): string {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(SETUP);
    }
    return value;
  }

  private run(
    bin: string,
    args: string[],
    timeoutMs: number,
    stdin?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, { windowsHide: true });
      const timer = setTimeout(() => {
        child.kill();
        reject(new ServiceUnavailableException('Speech timed out'));
      }, timeoutMs);

      child.on('error', () => {
        clearTimeout(timer);
        reject(new ServiceUnavailableException(SETUP));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
          return;
        }
        reject(new ServiceUnavailableException(SETUP));
      });

      child.stdin.end(stdin ?? '');
    });
  }
}

function cleanTranscript(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) => line && !/^\[(BLANK_AUDIO|silence|inaudible)\]$/i.test(line),
    )
    .join(' ')
    .trim();
}
