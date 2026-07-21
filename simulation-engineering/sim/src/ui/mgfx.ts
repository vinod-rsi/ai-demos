import type { DialogueEvent, PassthroughEvent } from '../conversation/events';
import { cleanText } from './panel';
import { asset } from '../base';

export interface MgfxScreen {
  kind: 'title' | 'rebecca' | 'rhea' | 'complete' | 'generic';
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string | null;
}

const MGFX_PREFIX = 'MGFX:';
const SPRITE_BASE = asset('unity/mgfx/MGFX_Sprites');

export function parseMgfxNotes(notes: string | undefined): MgfxScreen | null {
  if (!notes?.trim().startsWith(MGFX_PREFIX)) return null;
  const lines = notes
    .replace(MGFX_PREFIX, '')
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);
  if (lines.length === 0) return null;

  const [first = '', second = '', ...rest] = lines;
  const all = lines.join(' ').toLowerCase();
  if (all.includes('completed this simulation')) {
    return {
      kind: 'complete',
      eyebrow: 'Complete',
      title: first,
      subtitle: '',
      body: [second, ...rest].join(' '),
      imageUrl: `${SPRITE_BASE}/shared-sprites/pharm_icon_medical_chat.png`,
    };
  }
  if (all.includes('rhea davis')) {
    return {
      kind: 'rhea',
      eyebrow: 'Patient Story',
      title: first,
      subtitle: second,
      body: rest.join(' '),
      imageUrl: `${SPRITE_BASE}/pharm_rhea_lg.png`,
    };
  }
  if (all.includes('rebecca')) {
    return {
      kind: 'rebecca',
      eyebrow: 'Conversation',
      title: first,
      subtitle: '',
      body: [second, ...rest].join(' '),
      imageUrl: `${SPRITE_BASE}/pharm_rebecca_lg.png`,
    };
  }
  return {
    kind: 'title',
    eyebrow: first,
    title: second,
    subtitle: '',
    body: rest.join(' '),
    imageUrl: `${SPRITE_BASE}/shared-sprites/pharm_icon_med_profile.png`,
  };
}

export function eventMgfxScreen(evt: DialogueEvent | PassthroughEvent): MgfxScreen | null {
  if (evt.type === 'dialogue') return parseMgfxNotes(evt.notes);
  if (evt.type === 'mgfx') return parseMgfxNotes(evt.notes ?? evt.raw.notes);
  return null;
}

export class MgfxOverlay {
  private resolver: (() => void) | null = null;

  constructor(
    private rootEl: HTMLElement,
    private eyebrowEl: HTMLElement,
    private titleEl: HTMLElement,
    private subtitleEl: HTMLElement,
    private bodyEl: HTMLElement,
    private imageEl: HTMLImageElement,
    continueButton: HTMLElement,
  ) {
    continueButton.addEventListener('click', () => this.dismiss());
  }

  show(screen: MgfxScreen): Promise<void> {
    this.rootEl.dataset.kind = screen.kind;
    this.eyebrowEl.textContent = screen.eyebrow;
    this.titleEl.textContent = screen.title;
    this.subtitleEl.textContent = screen.subtitle;
    this.subtitleEl.hidden = screen.subtitle.length === 0;
    this.bodyEl.textContent = screen.body;
    this.bodyEl.hidden = screen.body.length === 0;
    if (screen.imageUrl) {
      this.imageEl.src = screen.imageUrl;
      this.imageEl.hidden = false;
    } else {
      this.imageEl.removeAttribute('src');
      this.imageEl.hidden = true;
    }
    this.rootEl.classList.add('visible');
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  dismiss(): void {
    this.rootEl.classList.remove('visible');
    this.resolver?.();
    this.resolver = null;
  }

  get visible(): boolean {
    return this.rootEl.classList.contains('visible');
  }
}
