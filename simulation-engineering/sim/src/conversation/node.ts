import type { RawLinkage, RawNode, LinkageType } from '../content/types';
import { CompiledExpression, type EvaluationData } from './expression/evaluator';
import type { ChangeRecorder } from './history';
import type { RuntimeEvent } from './events';
import type { Localization } from '../content/localization';

export interface ConditionalTitle {
  condition: CompiledExpression;
  text: string;
}

export interface ConditionalTactic {
  condition: CompiledExpression;
  tacticId: string | null;
  tacticOrder?: number;
}

export class Linkage {
  readonly targetId: string;
  readonly linkageType: LinkageType;
  readonly condition: CompiledExpression;

  constructor(raw: RawLinkage) {
    this.targetId = raw.id.toLowerCase();
    this.linkageType = raw.type;
    this.condition = new CompiledExpression(raw.condition);
  }

  get onOffered(): boolean {
    return (
      this.linkageType === 'offeredclose' ||
      this.linkageType === 'offereddisallow' ||
      this.linkageType === 'offereddeactivate'
    );
  }
}

export interface NodeLifetime {
  trigger: 'active' | 'offered';
  duration: number;
  action: 'deactivate' | 'close';
}

/** Port of Runtime/Node.cs — a node's static definition plus mutable state. */
export class ConvNode {
  readonly id: string;
  readonly lowerId: string;
  readonly allowVisibility: boolean;
  readonly repeatable: boolean;
  readonly inaccessible: boolean;
  readonly cutscene?: string;
  readonly defaultTitle: string;
  readonly conditionalTitles: ConditionalTitle[];
  readonly defaultTacticId: string | null;
  readonly conditionalTactics: ConditionalTactic[];
  readonly defaultTacticOrder: number;
  readonly duration: number;
  readonly lifetime: NodeLifetime | null;
  readonly tagIds: string[];
  readonly linkages: Linkage[];
  readonly events: RuntimeEvent[];
  readonly behaviorIndex: number;
  readonly menuType: number;

  played = false;
  offered = false;
  selected = false;
  active = false;
  allowed = true;
  closed = false;
  lastPlayed = -1;
  lifetimeRemaining = 0;

  constructor(
    raw: RawNode,
    events: RuntimeEvent[],
    loc: Localization,
    private recorder: ChangeRecorder,
  ) {
    this.id = raw.id;
    this.lowerId = raw.id.toLowerCase();
    this.allowVisibility = raw.allow_visibility ?? false;
    this.repeatable = raw.repeatable ?? false;
    this.inaccessible = raw.inaccessible ?? false;
    this.cutscene = raw.cutscene;
    this.defaultTitle = loc.resolve(raw.localization_guid, 'title', raw.title);
    this.conditionalTitles = (raw.conditional_titles ?? []).map((c) => ({
      condition: new CompiledExpression(c.condition),
      text: loc.resolve(c.localization_guid, 'text', c.text),
    }));
    this.defaultTacticId = raw.tactic ? raw.tactic.toLowerCase() : null;
    this.conditionalTactics = (raw.conditional_tactics ?? []).map((c) => ({
      condition: new CompiledExpression(c.condition),
      tacticId: c.tactic ? c.tactic.toLowerCase() : null,
      tacticOrder: c.tactic_order,
    }));
    this.defaultTacticOrder = raw.tactic_order ?? 0;
    this.duration = raw.duration ?? 0;

    if (raw.lifetime !== undefined) {
      const lt =
        typeof raw.lifetime === 'number'
          ? { duration: raw.lifetime }
          : raw.lifetime;
      const duration = lt.duration ?? 0;
      this.lifetime =
        duration > 0
          ? {
              trigger: (typeof raw.lifetime === 'object' ? raw.lifetime.type : undefined) ?? 'active',
              duration,
              action: (typeof raw.lifetime === 'object' ? raw.lifetime.action : undefined) ?? 'deactivate',
            }
          : null;
    } else {
      this.lifetime = null;
    }
    this.lifetimeRemaining = this.lifetime?.duration ?? 0;

    this.tagIds = (raw.tags ?? []).map((t) => t.toLowerCase());
    this.linkages = (raw.linkages ?? []).map((l) => new Linkage(l));
    this.events = events;
    this.behaviorIndex = raw.behavior_id ?? -1;
    this.menuType = raw.behavior_menu_type ?? 0;
  }

  get autoExpire(): boolean {
    return this.lifetime !== null;
  }

  get visible(): boolean {
    return (
      this.active &&
      this.allowed &&
      !this.closed &&
      (!this.played || this.repeatable) &&
      this.allowVisibility &&
      (!this.autoExpire || this.lifetimeRemaining > 0)
    );
  }

  title(data: EvaluationData): string {
    for (const ct of this.conditionalTitles) {
      if (ct.condition.isMet(data)) return ct.text;
    }
    return this.defaultTitle;
  }

  tacticId(data: EvaluationData): string | null {
    for (const ct of this.conditionalTactics) {
      if (ct.condition.isMet(data)) return ct.tacticId;
    }
    return this.defaultTacticId;
  }

  tacticOrder(data: EvaluationData): number {
    for (const ct of this.conditionalTactics) {
      if (ct.condition.isMet(data)) {
        return ct.tacticOrder ?? this.defaultTacticOrder;
      }
    }
    return this.defaultTacticOrder;
  }

  hasTag(tagId: string): boolean {
    return this.tagIds.includes(tagId);
  }

  play(turnNumber: number): void {
    const oldLastPlayed = this.lastPlayed;
    this.recorder.record(this.id, 'lastplayed', oldLastPlayed, turnNumber, () => {
      this.lastPlayed = oldLastPlayed;
    });
    this.lastPlayed = turnNumber;
    if (this.played && !this.repeatable) return;
    if (!this.played) {
      this.recorder.record(this.id, 'played', false, true, () => {
        this.played = false;
      });
      this.played = true;
    }
  }

  offer(): void {
    if (this.offered) return;
    this.recorder.record(this.id, 'offered', false, true, () => {
      this.offered = false;
    });
    this.offered = true;
  }

  select(): void {
    if ((this.selected && !this.repeatable) || this.closed) return;
    if (!this.selected) {
      this.recorder.record(this.id, 'selected', false, true, () => {
        this.selected = false;
      });
      this.selected = true;
    }
  }

  setActive(active: boolean): void {
    if (this.active !== active) {
      const old = this.active;
      this.recorder.record(this.id, 'available', old, active, () => {
        this.active = old;
      });
    }
    this.active = active;
    if (this.active && this.autoExpire) {
      const full = this.lifetime!.duration;
      if (this.lifetimeRemaining !== full) {
        const old = this.lifetimeRemaining;
        this.recorder.record(this.id, 'lifetime', old, full, () => {
          this.lifetimeRemaining = old;
        });
      }
      this.lifetimeRemaining = full;
    }
  }

  setAllowed(allowed: boolean): void {
    if (this.allowed !== allowed) {
      const old = this.allowed;
      this.recorder.record(this.id, 'allowed', old, allowed, () => {
        this.allowed = old;
      });
    }
    this.allowed = allowed;
  }

  close(): void {
    if (!this.closed) {
      this.recorder.record(this.id, 'closed', false, true, () => {
        this.closed = false;
      });
    }
    this.closed = true;
  }

  willLoseLifetime(): boolean {
    if (this.autoExpire && this.lifetimeRemaining > 0) {
      return this.lifetime!.trigger === 'active' ? this.active : this.visible;
    }
    return false;
  }

  handleLifetime(): void {
    if (!this.willLoseLifetime()) return;
    const last = this.lifetimeRemaining;
    let next = last - 1;
    if (next <= 0) {
      next = 0;
    }
    this.lifetimeRemaining = next;
    if (next === 0) {
      if (this.lifetime!.action === 'deactivate') this.setActive(false);
      else this.close();
    }
    this.recorder.record(this.id, 'lifetime', last, next, () => {
      this.lifetimeRemaining = last;
    });
  }
}
