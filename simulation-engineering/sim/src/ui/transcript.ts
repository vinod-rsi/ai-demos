import type { Conversation } from '../conversation/engine';
import { cleanText } from './panel';

/** Toggleable conversation transcript built from the engine's history. */
export class TranscriptPanel {
  constructor(
    private rootEl: HTMLElement,
    private contentEl: HTMLElement,
    private characterNames: Map<string, string>,
  ) {}

  get visible(): boolean {
    return this.rootEl.classList.contains('visible');
  }

  toggle(convo: Conversation): boolean {
    if (this.visible) {
      this.rootEl.classList.remove('visible');
      return false;
    }
    this.render(convo);
    this.rootEl.classList.add('visible');
    return true;
  }

  render(convo: Conversation): void {
    this.contentEl.innerHTML = '';
    const intro = convo.getIntroEventQueue();
    if (intro.length) this.renderTurn('Introduction', intro, convo);

    for (const turn of convo.getTranscriptTurns()) {
      if (turn.events.length === 0) continue;
      let label = 'Activity';
      if (turn.nodeId) {
        const node = convo.getNode(turn.nodeId);
        const title = node ? cleanText(node.title(convo.evaluationData)) : '';
        label = `You: ${title || turn.nodeId}`;
      }
      this.renderTurn(label, turn.events, convo);
    }
    const outro = convo.getOutroEventQueue();
    if (outro.length) this.renderTurn('Conclusion', outro, convo);
  }

  private renderTurn(
    label: string,
    events: readonly import('../conversation/events').RuntimeEvent[],
    _convo: Conversation,
  ): void {
    const turnEl = document.createElement('div');
    turnEl.className = 'transcript-turn';
    const head = document.createElement('h4');
    head.textContent = label;
    turnEl.appendChild(head);

    for (const evt of events) {
      let line: string | null = null;
      if (evt.type === 'dialogue' || evt.type === 'thought') {
        const name = evt.characterId
          ? (this.characterNames.get(evt.characterId) ?? '')
          : '';
        const text = cleanText(evt.text);
        if (text) line = name ? `${name}: ${text}` : text;
      } else if (evt.type === 'coach') {
        const text = cleanText(evt.replacementText ?? evt.text);
        if (text) line = `Coach: ${text}`;
      }
      if (line) {
        const p = document.createElement('p');
        p.textContent = line;
        if (evt.type === 'thought') p.classList.add('thought-line');
        turnEl.appendChild(p);
      }
    }
    if (turnEl.children.length > 1) this.contentEl.appendChild(turnEl);
  }
}
