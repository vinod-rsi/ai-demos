import type { RuntimeEvent } from './events';

/**
 * Port of KonverseSource/Runtime/History. Every state mutation is journaled
 * into the current turn; undo re-applies journals in reverse. C# stores
 * (element, field, oldValue) and dispatches to Element.UndoChange — here each
 * change carries its own undo closure, which is equivalent.
 */
export interface HistoryChange {
  elementId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  undo(): void;
}

export class HistoryTurn {
  private changes: HistoryChange[] = [];
  readonly events: RuntimeEvent[];
  readonly nodeId: string | null;
  readonly activity: boolean;

  constructor(nodeId: string | null = null, events: RuntimeEvent[] = [], activity = false) {
    this.nodeId = nodeId;
    this.events = events;
    this.activity = activity;
  }

  addChange(change: HistoryChange): void {
    this.changes.push(change);
  }

  undo(): void {
    for (let i = this.changes.length - 1; i >= 0; i--) {
      this.changes[i]!.undo();
    }
  }

  describe(): string {
    return this.changes
      .map((c) => `[${c.elementId}] ${c.field}: ${c.oldValue} -> ${c.newValue}`)
      .join('\n');
  }
}

export class HistoryManager {
  readonly turns: HistoryTurn[] = [];
  currentTurn = new HistoryTurn();

  /** Number of learner selections (activity turns don't count). */
  get turnNumber(): number {
    return this.turns.filter((t) => !t.activity).length;
  }

  addChange(change: HistoryChange): void {
    this.currentTurn.addChange(change);
  }

  recordSelection(nodeId: string, events: RuntimeEvent[]): void {
    this.turns.push(this.currentTurn);
    this.currentTurn = new HistoryTurn(nodeId, events, false);
  }

  recordActivity(events: RuntimeEvent[]): void {
    this.turns.push(this.currentTurn);
    this.currentTurn = new HistoryTurn(null, events, true);
  }

  getLastSelected(): HistoryTurn | null {
    if (!this.currentTurn.activity && this.currentTurn.nodeId) return this.currentTurn;
    for (let i = this.turns.length - 1; i >= 0; i--) {
      if (!this.turns[i]!.activity) return this.turns[i]!;
    }
    return null;
  }

  /**
   * Undoes back through any activity turns until one learner selection has
   * been reverted; returns the events of the restored turn.
   */
  undo(): RuntimeEvent[] {
    if (this.turnNumber === 0) return [];
    let found = false;
    const restored: RuntimeEvent[] = [];
    while (!found && this.turns.length > 0) {
      if (!this.currentTurn.activity) found = true;
      this.currentTurn = this.turns[this.turns.length - 1]!;
      this.currentTurn.undo();
      this.turns.pop();
      restored.unshift(...this.currentTurn.events);
    }
    if (!found) this.currentTurn = new HistoryTurn();
    return restored;
  }
}

/** Shared by all runtime elements so mutations get journaled (or skipped while initializing). */
export interface ChangeRecorder {
  record(elementId: string, field: string, oldValue: unknown, newValue: unknown, undo: () => void): void;
}
