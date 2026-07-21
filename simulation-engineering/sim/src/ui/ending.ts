import type { Conversation } from '../conversation/engine';

/** Strips TMP rich-text tags but preserves paragraph breaks. */
export function richTextToParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/**
 * Ending screen: the dashboard nodes (node_db_step*) fill the var_db_*
 * variables with conditional feedback text during the final turn; this
 * renders every non-empty one, in Variables.json order, as the results page.
 */
export function renderEndingScreen(container: HTMLElement, convo: Conversation): void {
  container.innerHTML = '';
  const heading = document.createElement('h2');
  heading.textContent = 'Feedback';
  heading.style.cssText = 'font-size:16px;letter-spacing:0.06em;color:var(--accent);';
  container.appendChild(heading);

  for (const variable of convo.variables) {
    if (!variable.lowerId.startsWith('var_db_')) continue;
    const text = variable.text?.trim();
    if (!text) continue;
    for (const paragraph of richTextToParagraphs(text)) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      p.style.cssText = 'font-size:13.5px;line-height:1.55;margin:8px 0;';
      container.appendChild(p);
    }
  }
}
