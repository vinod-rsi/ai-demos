import type { Conversation } from '../conversation/engine';

/**
 * Running score from the course's tag/weight scheme: choice nodes carry one
 * of tag_Target/Fair/Neutral/Weak/Poor and the weights live in
 * var_WEIGHT_* (Target=10 ... Poor=0). Unity computes this in its
 * transcript/scoring layer, not in Konverse — same here.
 */
const SCORE_TAGS = ['target', 'fair', 'neutral', 'weak', 'poor'] as const;

export class ScoreTracker {
  raw = 0;
  /** Best possible for the scored choices made so far. */
  possible = 0;
  scoredSelections = 0;

  constructor(private convo: Conversation) {}

  private weight(name: string): number {
    return this.convo.getVariable(`var_weight_${name}`)?.value ?? 0;
  }

  /** Call after each learner selection. */
  recordSelection(nodeId: string): void {
    const node = this.convo.getNode(nodeId);
    if (!node) return;
    for (const tag of SCORE_TAGS) {
      if (node.hasTag(`tag_${tag}`)) {
        this.raw += this.weight(tag);
        this.possible += this.weight('target');
        this.scoredSelections++;
        return;
      }
    }
  }

  get percent(): number {
    return this.possible > 0 ? Math.round((this.raw / this.possible) * 100) : 0;
  }

  describe(): string {
    if (this.scoredSelections === 0) return 'score: no scored choices yet';
    return `score: ${this.raw} / ${this.possible} (${this.percent}%) over ${this.scoredSelections} scored choices`;
  }
}
