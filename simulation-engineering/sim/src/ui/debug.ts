import type { Conversation } from '../conversation/engine';

/** Live debug pane: current node, variables, history path. */
export class DebugPanel {
  constructor(
    private contentEl: HTMLElement,
    private statusEl: HTMLElement,
  ) {}

  update(convo: Conversation, lastNodeId: string | null): void {
    const trackedVars = convo.variables
      .filter((v) => v.value !== 0 || v.meter)
      .map((v) => `${v.id}=${v.value}`)
      .join('  ');
    this.contentEl.textContent = [
      `node: ${lastNodeId ?? '(start)'}   turn: ${convo.turnNumber}   completed: ${convo.completed}`,
      `path: ${convo.getDebugPathString()}`,
      `vars: ${trackedVars || '(all zero)'}`,
    ].join('\n');
  }

  setStatus(parts: Record<string, string>): void {
    this.statusEl.innerHTML = '';
    for (const [label, value] of Object.entries(parts)) {
      const span = document.createElement('span');
      span.textContent = `${label}: ${value}`;
      this.statusEl.appendChild(span);
    }
  }
}
