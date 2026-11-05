const TARGET_RATE = 16_000;

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const audio =
    sampleRate === TARGET_RATE
      ? samples
      : resample(samples, sampleRate, TARGET_RATE);
  const buffer = new ArrayBuffer(44 + audio.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + audio.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, audio.length * 2, true);

  let offset = 44;
  for (let index = 0; index < audio.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, audio[index] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  const length = Math.max(1, Math.round((samples.length * toRate) / fromRate));
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const position = (index * fromRate) / toRate;
    const left = Math.floor(position);
    const right = Math.min(left + 1, samples.length - 1);
    const weight = position - left;
    const a = samples[left] ?? 0;
    const b = samples[right] ?? a;
    output[index] = a + (b - a) * weight;
  }
  return output;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
