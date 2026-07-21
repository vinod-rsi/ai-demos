import type { LipSyncDriver } from './director';
import type { AudioPlayback } from '../audio/audio-service';

/** Viseme pose names understood by Stage.setSpeaking (VISEME_FRAMES keys). */
export type MouthShape = 'AH' | 'MBP' | 'OO' | 'FV';

/**
 * Crude formant proxy: classify a 5–10 ms audio frame into a mouth pose from
 * RMS loudness and zero-crossing rate (zcr = crossings/samples, so a pure
 * tone at frequency f gives ≈ 2f/sampleRate).
 *
 * - fricatives (s/f/sh) are noise-like → very high zcr → narrow FV
 * - nasal murmurs / plosive closures (m/b/p) are quiet and low-pitched
 *   → low rms → closed MBP
 * - dark rounded vowels (oo/oh) concentrate energy in low harmonics
 *   → very low zcr → narrow OO
 * - everything else voiced → open AH
 *
 * Thresholds are tuned for 44.1/48 kHz speech and pinned by unit tests.
 */
export function classifyMouthShape(rms: number, zcr: number): MouthShape {
  if (zcr > 0.18) return 'FV';
  if (rms < 0.06) return 'MBP';
  if (zcr < 0.045) return 'OO';
  return 'AH';
}

/**
 * Amplitude + zero-crossing lip-sync: samples the playing clip's waveform,
 * maps RMS loudness to a 0..1 mouth-open level, and picks a viseme pose per
 * frame via classifyMouthShape. Still a stopgap
 * against offline per-WAV viseme tracks (MIGRATION_HARD_PARTS.md §5/risk 3),
 * but distinguishes "ooo"/"mmm"/fricatives from open vowels.
 */
export class AmplitudeLipSync implements LipSyncDriver {
  private raf = 0;
  private shape: MouthShape = 'AH';
  private pendingShape: MouthShape = 'AH';
  private pendingSince = 0;

  constructor(private setLevel: (level: number, shape: MouthShape) => void) {}

  start(clipId: string, _text: string, audio: AudioPlayback | null): void {
    this.stop();
    if (!audio) {
      // Silent/markered lines: a gentle fixed level for non-"empty" clips.
      this.setLevel(clipId === 'empty' ? 0 : 0.4, 'AH');
      return;
    }
    const samples = new Uint8Array(256);
    const tick = () => {
      audio.getByteTimeDomainData(samples);
      let sum = 0;
      let crossings = 0;
      let prev = 0;
      for (let i = 0; i < samples.length; i++) {
        const v = (samples[i]! - 128) / 128;
        sum += v * v;
        if (i > 0 && v * prev < 0) crossings++;
        prev = v;
      }
      const rms = Math.sqrt(sum / samples.length);
      const zcr = crossings / samples.length;
      this.setLevel(Math.min(1, rms * 6), this.debounce(classifyMouthShape(rms, zcr)));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Only switch pose once the classifier has agreed for ~2 frames (≈33 ms),
   *  so single noisy analyser frames don't make the mouth flicker. */
  private debounce(next: MouthShape): MouthShape {
    if (next === this.shape) {
      this.pendingSince = 0;
    } else if (next === this.pendingShape) {
      if (++this.pendingSince >= 2) {
        this.shape = next;
        this.pendingSince = 0;
      }
    } else {
      this.pendingShape = next;
      this.pendingSince = 1;
    }
    return this.shape;
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.setLevel(0, 'AH');
    this.shape = 'AH';
    this.pendingSince = 0;
  }
}
