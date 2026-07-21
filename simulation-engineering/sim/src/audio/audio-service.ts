/**
 * WAV dialogue playback. Clip ids come from dialogue events (explicit or
 * auto-assigned); files are served from the untouched Unity audio folder.
 * "empty" is the authored marker for a silent line.
 *
 * Unity exported this course's dialogue as 24-bit PCM WAV. Some browsers
 * reject that format through HTMLAudioElement, so this service decodes PCM WAV
 * bytes directly and plays them through WebAudio. The hook object exposes the
 * same timing/analyser signals the caption and lip-sync layers need.
 */
import { asset } from '../base';
export interface AudioPlayback {
  readonly currentTime: number;
  readonly duration: number;
  getByteTimeDomainData(samples: Uint8Array<ArrayBuffer>): void;
}

export interface AudioHooks {
  onClipStart?(clipId: string, text: string, playback: AudioPlayback | null): void;
  onClipEnd?(clipId: string): void;
}

interface DecodedPcm {
  sampleRate: number;
  channels: Float32Array<ArrayBuffer>[];
}

interface CurrentPlayback {
  source: AudioBufferSourceNode;
  gain: GainNode;
  decoded: DecodedPcm;
  duration: number;
  startedAtMs: number;
  pausedAtMs: number | null;
  pausedAccumMs: number;
  timer: ReturnType<typeof setTimeout> | null;
  stopped: boolean;
  finish: () => void;
}

export class AudioService {
  volume = 1;
  muted = false;
  private ctx: AudioContext | null = null;
  private cache = new Map<string, Promise<DecodedPcm>>();
  private current: CurrentPlayback | null = null;
  private paused = false;

  constructor(
    private baseUrl = asset('unity/audio'),
    private hooks: AudioHooks = {},
  ) {}

  urlFor(clipId: string): string {
    return `${this.baseUrl}/${clipId}.wav`;
  }

  /** Fetches and decodes a clip ahead of playback without touching WebAudio. */
  async prepare(clipId: string | undefined): Promise<void> {
    if (!clipId || clipId === 'empty') return;
    await this.loadDecoded(clipId);
  }

  /** Plays a clip to completion. Silent/missing clips resolve quickly. */
  async play(clipId: string | undefined, text = ''): Promise<void> {
    this.stop();
    if (!clipId || clipId === 'empty') {
      this.hooks.onClipStart?.(clipId ?? 'empty', text, null);
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          this.hooks.onClipEnd?.(clipId ?? 'empty');
          resolve();
        }, 400),
      );
      return;
    }

    let decoded: DecodedPcm;
    try {
      decoded = await this.loadDecoded(clipId);
    } catch (err) {
      console.warn(`[audio] failed to decode ${clipId}:`, err);
      this.hooks.onClipStart?.(clipId, text, null);
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          this.hooks.onClipEnd?.(clipId);
          resolve();
        }, 400),
      );
      return;
    }
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const buffer = this.createAudioBuffer(ctx, decoded);

    await new Promise<void>((resolve) => {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = this.muted ? 0 : this.volume;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(ctx.destination);

      const current: CurrentPlayback = {
        source,
        gain,
        decoded,
        duration: buffer.duration,
        startedAtMs: performance.now(),
        pausedAtMs: null,
        pausedAccumMs: 0,
        timer: null,
        stopped: false,
        finish: () => undefined,
      };
      this.current = current;
      const playback: AudioPlayback = {
        get currentTime() {
          return currentTime(current);
        },
        duration: buffer.duration,
        getByteTimeDomainData(samples: Uint8Array<ArrayBuffer>) {
          fillTimeDomainData(decoded, currentTime(current), samples);
        },
      };

      current.finish = () => {
        if (current.stopped) return;
        current.stopped = true;
        this.paused = false;
        if (current.timer) clearTimeout(current.timer);
        source.disconnect();
        gain.disconnect();
        if (this.current === current) this.current = null;
        this.hooks.onClipEnd?.(clipId);
        resolve();
      };
      source.onended = current.finish;

      this.hooks.onClipStart?.(clipId, text, playback);
      this.scheduleEnd(current);
      try {
        source.start();
      } catch {
        current.finish();
      }
    });
  }

  stop(): void {
    if (this.current) {
      this.current.stopped = true;
      if (this.current.timer) clearTimeout(this.current.timer);
      try {
        this.current.source.stop();
      } catch {
        // Already stopped.
      }
      this.current.source.disconnect();
      this.current.gain.disconnect();
      this.current = null;
      this.paused = false;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.current) this.current.gain.gain.value = this.muted ? 0 : this.volume;
  }

  changeVolume(delta: number): void {
    this.setVolume(this.volume + delta);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.current) this.current.gain.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  /** Returns the new paused state. */
  togglePlay(): boolean {
    if (!this.current || !this.ctx) return false;
    this.paused = !this.paused;
    if (this.paused) {
      this.current.pausedAtMs = performance.now();
      if (this.current.timer) clearTimeout(this.current.timer);
      void this.ctx.suspend();
    } else {
      if (this.current.pausedAtMs !== null) {
        this.current.pausedAccumMs += performance.now() - this.current.pausedAtMs;
        this.current.pausedAtMs = null;
      }
      this.scheduleEnd(this.current);
      void this.ctx.resume();
    }
    return this.paused;
  }

  private scheduleEnd(current: CurrentPlayback): void {
    if (current.timer) clearTimeout(current.timer);
    const remainingMs = Math.max(0, (current.duration - currentTime(current)) * 1000);
    current.timer = setTimeout(current.finish, remainingMs + 30);
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('WebAudio is not available in this browser.');
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  private loadDecoded(clipId: string): Promise<DecodedPcm> {
    let pending = this.cache.get(clipId);
    if (!pending) {
      pending = fetch(this.urlFor(clipId))
        .then((response) => {
          if (!response.ok) throw new Error(`Audio not found: ${clipId}`);
          return response.arrayBuffer();
        })
        .then((data) => decodePcmWav(data));
      this.cache.set(clipId, pending);
    }
    return pending;
  }

  private createAudioBuffer(ctx: AudioContext, decoded: DecodedPcm): AudioBuffer {
    const buffer = ctx.createBuffer(
      decoded.channels.length,
      decoded.channels[0]?.length ?? 0,
      decoded.sampleRate,
    );
    decoded.channels.forEach((channel, index) => buffer.copyToChannel(channel, index));
    return buffer;
  }
}

function currentTime(current: CurrentPlayback): number {
  const now = current.pausedAtMs ?? performance.now();
  const elapsed = (now - current.startedAtMs - current.pausedAccumMs) / 1000;
  return Math.min(current.duration, Math.max(0, elapsed));
}

function fillTimeDomainData(
  decoded: DecodedPcm,
  seconds: number,
  samples: Uint8Array<ArrayBuffer>,
): void {
  const start = Math.floor(seconds * decoded.sampleRate);
  const channels = decoded.channels;
  const channelCount = channels.length || 1;
  for (let i = 0; i < samples.length; i++) {
    const frame = start + i;
    let sample = 0;
    for (const channel of channels) sample += channel[frame] ?? 0;
    sample /= channelCount;
    samples[i] = Math.max(0, Math.min(255, Math.round(sample * 128 + 128)));
  }
}

function chunkName(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function decodePcmWav(data: ArrayBuffer): DecodedPcm {
  const view = new DataView(data);
  if (chunkName(view, 0) !== 'RIFF' || chunkName(view, 8) !== 'WAVE') {
    throw new Error('Unsupported audio file: expected RIFF/WAVE.');
  }

  let audioFormat = 0;
  let channelCount = 0;
  let sampleRate = 0;
  let blockAlign = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  for (let offset = 12; offset + 8 <= view.byteLength; ) {
    const id = chunkName(view, offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      audioFormat = view.getUint16(body, true);
      channelCount = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      blockAlign = view.getUint16(body + 12, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === 'data') {
      dataOffset = body;
      dataSize = size;
    }
    offset = body + size + (size % 2);
  }

  if (!dataOffset || !dataSize || !channelCount || !sampleRate || !blockAlign) {
    throw new Error('Unsupported audio file: missing WAV format or data chunk.');
  }
  if (audioFormat !== 1 && !(audioFormat === 3 && bitsPerSample === 32)) {
    throw new Error(`Unsupported WAV encoding: format ${audioFormat}.`);
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameCount = Math.floor(dataSize / blockAlign);
  const channels: Float32Array<ArrayBuffer>[] = Array.from(
    { length: channelCount },
    () => new Float32Array(frameCount),
  );

  for (let frame = 0; frame < frameCount; frame++) {
    const frameOffset = dataOffset + frame * blockAlign;
    for (let channel = 0; channel < channelCount; channel++) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      channels[channel]![frame] = readSample(view, sampleOffset, bitsPerSample, audioFormat);
    }
  }

  return { sampleRate, channels };
}

function readSample(
  view: DataView,
  offset: number,
  bitsPerSample: number,
  audioFormat: number,
): number {
  if (audioFormat === 3 && bitsPerSample === 32) return view.getFloat32(offset, true);
  switch (bitsPerSample) {
    case 8:
      return (view.getUint8(offset) - 128) / 128;
    case 16:
      return view.getInt16(offset, true) / 32768;
    case 24: {
      let value =
        view.getUint8(offset) |
        (view.getUint8(offset + 1) << 8) |
        (view.getUint8(offset + 2) << 16);
      if (value & 0x800000) value |= 0xff000000;
      return value / 8388608;
    }
    case 32:
      return view.getInt32(offset, true) / 2147483648;
    default:
      throw new Error(`Unsupported PCM bit depth: ${bitsPerSample}.`);
  }
}
