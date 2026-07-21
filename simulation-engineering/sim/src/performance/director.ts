import type { CutsceneEvent, DialogueEvent } from '../conversation/events';
import type { Stage } from '../scene/stage';
import type { AudioPlayback } from '../audio/audio-service';

/**
 * Replacement seams for Gossamer (virtual humans) + Timeline (sequencing).
 *
 * In Unity, a CutsceneEvent selects a Timeline "node sequence" which drives
 * body animation, facial expression, camera shots, and lip-sync generated
 * from the WAV (AutoLipSyncKonverse). The interfaces below carve that into
 * independently implementable drivers; MinimalDirector wires the only parts
 * needed for the vertical slice (shot switching + a speaking flag).
 */

export interface BodyAnimationDriver {
  /** Play a named body gesture/animation, returns when started. */
  play(animationId: string): void;
  /** Resume the idle loop. */
  idle(): void;
}

export interface FacialExpressionDriver {
  setExpression(expressionId: string, weight: number): void;
  clear(): void;
}

export interface LipSyncDriver {
  /**
   * Begin lip-sync for a clip. `audio` is the live playback clock/analyser so
   * the driver can sample currentTime or waveform data; `text` keeps the [br]
   * timing markers from the dialogue data as a fallback alignment source.
   */
  start(clipId: string, text: string, audio: AudioPlayback | null): void;
  stop(): void;
}

export interface ShotDriver {
  setShot(shotId: string | undefined): void;
}

export interface PerformanceDirector {
  /** A Konverse cutscene event (one per node with dialogue). */
  beginCutscene(evt: CutsceneEvent): void;
  /** A character line is starting (audio may be null for silent lines). */
  beginLine(evt: DialogueEvent, audio: AudioPlayback | null): void;
  endLine(evt: DialogueEvent): void;
  /** Back to idle between turns. */
  idle(): void;
}

/** Minimal working path: drives the placeholder stage. Mouth levels come
 *  from the LipSyncDriver (see lipsync-amplitude.ts) via the audio hooks. */
export class MinimalDirector implements PerformanceDirector {
  constructor(private stage: Stage) {}

  beginCutscene(_evt: CutsceneEvent): void {
    // Future: look up the Timeline sequence named by evt.cutsceneId.
  }

  beginLine(evt: DialogueEvent, _audio: AudioPlayback | null): void {
    this.stage.setShot(evt.shotId);
    // Deterministic-but-varied gesture per line (Gossamer picks from takes).
    if (evt.audio && evt.audio !== 'empty') {
      let hash = 0;
      for (const ch of evt.id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
      const gestures = ['gesture-b', 'gesture-l', 'gesture-r', 'nod', 'tilt-l', 'tilt-r'];
      this.stage.playGesture(gestures[Math.abs(hash) % gestures.length]);
    }
  }

  endLine(_evt: DialogueEvent): void {}

  idle(): void {
    this.stage.setSpeaking(0);
  }
}
