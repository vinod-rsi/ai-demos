import type { RawMilestone } from '../content/types';
import type { ChangeRecorder } from './history';

/** Milestone states, ordinal values matching Milestone.MilestoneState in C#. */
export const MILESTONE_STATES = ['upcoming', 'inprogress', 'completed', 'failed', 'skipped'] as const;
export type MilestoneState = (typeof MILESTONE_STATES)[number];

export class Milestone {
  readonly id: string;
  readonly lowerId: string;
  state: MilestoneState = 'upcoming';
  text: string;

  constructor(
    raw: RawMilestone,
    text: string,
    private recorder: ChangeRecorder,
  ) {
    this.id = raw.id;
    this.lowerId = raw.id.toLowerCase();
    this.text = text;
  }

  get stateOrdinal(): number {
    return MILESTONE_STATES.indexOf(this.state);
  }

  setState(state: MilestoneState): void {
    const old = this.state;
    this.recorder.record(this.id, 'state', old, state, () => {
      this.state = old;
    });
    this.state = state;
  }

  setText(text: string): void {
    const old = this.text;
    this.recorder.record(this.id, 'text', old, text, () => {
      this.text = old;
    });
    this.text = text;
  }
}
