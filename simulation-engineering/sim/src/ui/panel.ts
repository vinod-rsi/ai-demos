import type { TacticContainer } from '../conversation/engine';
import { asset } from '../base';

/** Strips Konverse text markup: [br...] timing markers and TMP rich-text tags. */
export function cleanText(text: string): string {
  return text
    .replace(/\[br[0-9.]*\]/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class SpeakerPanel {
  constructor(
    private nameEl: HTMLElement,
    private textEl: HTMLElement,
  ) {}

  show(speaker: string, text: string): void {
    this.nameEl.textContent = speaker;
    this.textEl.textContent = cleanText(text);
  }

  clear(): void {
    this.nameEl.textContent = '';
    this.textEl.textContent = '';
  }
}

/** Tactic metadata image id → sprite copied from Assets/.../Sprites/Tactics. */
const TACTIC_ICONS: Record<string, string> = {
  tactic_respond: asset('tactics/person_chat.png'),
  tactic_move_on: asset('tactics/leave.png'),
};

export function tacticIconUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  return TACTIC_ICONS[imageId] ?? null;
}

export class ChoicesPanel {
  private buttons: HTMLButtonElement[] = [];
  private focusIndex = -1;

  constructor(
    private container: HTMLElement,
    private onChoose: (behaviorId: string, select: () => void) => void,
  ) {}

  render(selection: TacticContainer[]): void {
    this.container.innerHTML = '';
    this.buttons = [];
    this.focusIndex = -1;
    for (const tactic of selection) {
      const group = document.createElement('div');
      group.className = 'tactic-group';
      if (tactic.name) {
        const heading = document.createElement('h3');
        const icon = tacticIconUrl(tactic.metadata['image']);
        if (icon) {
          const img = document.createElement('img');
          img.src = icon;
          img.alt = '';
          heading.appendChild(img);
        }
        heading.appendChild(document.createTextNode(tactic.name));
        group.appendChild(heading);
      }
      for (const behavior of tactic.behaviors) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.textContent = cleanText(behavior.title) || behavior.id;
        button.addEventListener('click', () => this.onChoose(behavior.id, behavior.select));
        group.appendChild(button);
        this.buttons.push(button);
      }
      this.container.appendChild(group);
    }
  }

  clear(): void {
    this.render([]);
  }

  /** Keyboard navigation (up/down/select commands). */
  moveFocus(delta: number): void {
    if (this.buttons.length === 0) return;
    this.focusIndex = (this.focusIndex + delta + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((b, i) => b.classList.toggle('kbd-focus', i === this.focusIndex));
    this.buttons[this.focusIndex]!.focus();
  }

  activateFocused(): void {
    if (this.focusIndex >= 0) this.buttons[this.focusIndex]?.click();
    else if (this.buttons.length === 1) this.buttons[0]!.click();
  }
}
