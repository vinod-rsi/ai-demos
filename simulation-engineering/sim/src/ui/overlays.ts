import { cleanText } from './panel';

export interface CaptionSegment {
  atSeconds: number;
  text: string;
}

/**
 * Splits dialogue text on its authored [br<seconds>] timing markers into
 * caption segments. Consecutive markers (e.g. "[br4.492][br4.573]") produce
 * an empty chunk that is dropped; the LAST marker's time starts the next
 * segment.
 */
export function splitCaptionSegments(text: string): CaptionSegment[] {
  const marker = /\[br([0-9.]*)\]/g;
  const segments: CaptionSegment[] = [];
  let last = 0;
  let at = 0;
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text))) {
    const chunk = cleanText(text.slice(last, m.index));
    if (chunk) segments.push({ atSeconds: at, text: chunk });
    const parsed = Number.parseFloat(m[1] ?? '');
    if (!Number.isNaN(parsed)) at = parsed;
    last = marker.lastIndex;
  }
  const tail = cleanText(text.slice(last));
  if (tail) segments.push({ atSeconds: at, text: tail });
  return segments;
}

/** Bottom-of-stage captions with a visibility toggle and [br] timing. */
export class Captions {
  enabled = true;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private el: HTMLElement) {}

  show(text: string): void {
    this.display(cleanText(text));
  }

  /**
   * Shows the line segment-by-segment, advancing with the audio clock from
   * the playing clip. Falls back to the whole line when there is no playback
   * clock or no timing markers.
   */
  startTimed(text: string, audio: { readonly currentTime: number } | null): void {
    this.stopTimer();
    const segments = splitCaptionSegments(text);
    if (!audio || segments.length <= 1) {
      this.show(text);
      return;
    }
    let index = 0;
    this.display(segments[0]!.text);
    this.timer = setInterval(() => {
      const t = audio.currentTime;
      let next = index;
      while (next + 1 < segments.length && t >= segments[next + 1]!.atSeconds) next++;
      if (next !== index) {
        index = next;
        this.display(segments[index]!.text);
      }
    }, 250);
  }

  hide(): void {
    this.stopTimer();
    this.el.classList.remove('visible');
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) this.hide();
    return this.enabled;
  }

  private display(cleaned: string): void {
    this.el.textContent = cleaned;
    this.el.classList.toggle('visible', this.enabled && cleaned.length > 0);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/** Transient feedback toast (volume/mute/captions/score changes). */
export class Toast {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private el: HTMLElement) {}

  show(message: string, ms = 1600): void {
    this.el.textContent = message;
    this.el.classList.add('visible');
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('visible'), ms);
  }
}

/** Modal coach feedback overlay (coachstyle modal/scrim handling is minimal). */
export class CoachOverlay {
  private resolver: (() => void) | null = null;

  constructor(
    private overlayEl: HTMLElement,
    private textEl: HTMLElement,
    dismissButton: HTMLElement,
  ) {
    dismissButton.addEventListener('click', () => this.dismiss());
  }

  show(text: string): Promise<void> {
    this.textEl.textContent = cleanText(text);
    this.overlayEl.classList.add('visible');
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  dismiss(): void {
    this.overlayEl.classList.remove('visible');
    this.resolver?.();
    this.resolver = null;
  }

  get visible(): boolean {
    return this.overlayEl.classList.contains('visible');
  }
}

/** Minimal slider activity UI for the insulin dosage activities. */
export interface ActivityRequest {
  title: string;
  min: number;
  max: number;
  initial: number;
}

export class ActivityPanel {
  private resolver: ((value: number) => void) | null = null;

  constructor(
    private rootEl: HTMLElement,
    private titleEl: HTMLElement,
    private slider: HTMLInputElement,
    private valueEl: HTMLElement,
    submit: HTMLElement,
  ) {
    this.rootEl.classList.add('syringe');
    this.slider.addEventListener('input', () => {
      this.updateValue();
    });
    submit.addEventListener('click', () => {
      const value = Number(this.slider.value);
      this.rootEl.classList.remove('visible');
      this.resolver?.(value);
      this.resolver = null;
    });
  }

  ask(request: ActivityRequest): Promise<number> {
    this.titleEl.textContent = request.title;
    this.slider.min = String(request.min);
    this.slider.max = String(request.max);
    this.slider.value = String(request.initial);
    this.updateValue();
    this.rootEl.classList.add('visible');
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  private updateValue(): void {
    const value = Number(this.slider.value);
    const min = Number(this.slider.min);
    const max = Number(this.slider.max);
    const percent = max <= min ? 0 : ((value - min) / (max - min)) * 100;
    const clamped = Math.max(0, Math.min(100, percent));
    this.rootEl.style.setProperty('--dose-percent', `${clamped}%`);
    this.rootEl.style.setProperty('--dose-position', `${13 + clamped * 0.62}%`);
    this.valueEl.textContent = `${value} units`;
  }
}
