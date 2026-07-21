import {
  resolveEventAudio,
  type ConversationProject,
  type RawCharacter,
  type RawCoachStyle,
  type RawShot,
  type RawTactic,
} from '../content/types';
import { Localization } from '../content/localization';
import { ConvNode } from './node';
import { Variable } from './variable';
import { Milestone } from './milestone';
import { HistoryManager, type ChangeRecorder } from './history';
import { ConversationLogic } from './logic';
import { createRuntimeEvent, type ActivityEvent, type RuntimeEvent } from './events';

export interface Behavior {
  id: string;
  title: string;
  /** Sprite/menu index hint (behavior_id in JSON, -1 when unset). */
  index: number;
  select(): void;
}

export interface TacticContainer {
  tacticId: string | null;
  name: string;
  metadata: Record<string, string>;
  behaviors: Behavior[];
}

/**
 * Port of Runtime/Conversation.cs — the engine facade the app drives.
 */
export class Conversation {
  readonly name: string;
  readonly version: string;
  readonly localization: Localization;
  readonly nodes: ConvNode[] = [];
  readonly variables: Variable[] = [];
  readonly milestones: Milestone[] = [];
  readonly tactics: RawTactic[];
  readonly shots: RawShot[];
  readonly characters: RawCharacter[];
  readonly coachStyles: RawCoachStyle[];
  readonly defaultTacticColor: { r: number; g: number; b: number };

  /** Event ids whose raw type the engine couldn't construct (validation). */
  readonly unsupportedEvents: { nodeId: string; eventId: string; type: string }[] = [];

  private nodesByLowerId = new Map<string, ConvNode>();
  private variablesByLowerId = new Map<string, Variable>();
  private milestonesByLowerId = new Map<string, Milestone>();
  private tagLowerIds = new Set<string>();
  private tacticIndexByLowerId = new Map<string, number>();

  private history = new HistoryManager();
  private logic: ConversationLogic;
  private introNode: ConvNode | null = null;
  private outroNode: ConvNode | null = null;
  updateNode: ConvNode | null = null;
  private startingTagId: string | null;

  private initializing = true;
  completed = false;
  success = false;
  totalDuration = 0;
  seatTime = 0;
  defaultBehaviorShotId: string | undefined;
  canUndoOverride: boolean | undefined;
  private disableUndo: boolean;

  private introEventQueue: RuntimeEvent[] = [];
  private outroEventQueue: RuntimeEvent[] = [];
  private eventQueue: RuntimeEvent[] = [];
  private selectedPath: string[] = [];
  private debugPath: string[] = [];
  private pendingOverrides = new Map<string, number>();

  readonly recorder: ChangeRecorder;

  constructor(project: ConversationProject) {
    const conv = project.conversation;
    this.localization = new Localization(project.localization);
    this.name = this.localization.resolve(conv.localization_guid, 'name', conv.name);
    this.version = conv.version ?? '';
    this.disableUndo = conv.disable_undo ?? false;
    this.defaultTacticColor = {
      r: conv.default_tactic_color_r ?? 0,
      g: conv.default_tactic_color_g ?? 0,
      b: conv.default_tactic_color_b ?? 0,
    };

    this.recorder = {
      record: (elementId, field, oldValue, newValue, undo) => {
        if (this.initializing) return;
        this.history.addChange({ elementId, field, oldValue, newValue, undo });
      },
    };

    for (const raw of project.variables) {
      const text = this.localization.resolve(raw.localization_guid, 'text', raw.text);
      const variable = new Variable(raw, text, this.recorder);
      this.variables.push(variable);
      this.variablesByLowerId.set(variable.lowerId, variable);
    }

    for (const raw of project.milestones) {
      const text = this.localization.resolve(raw.localization_guid, 'text', raw.text);
      const milestone = new Milestone(raw, text, this.recorder);
      this.milestones.push(milestone);
      this.milestonesByLowerId.set(milestone.lowerId, milestone);
    }

    for (const tag of project.tags) this.tagLowerIds.add(tag.id.toLowerCase());

    this.tactics = project.tactics;
    project.tactics.forEach((t, i) => this.tacticIndexByLowerId.set(t.id.toLowerCase(), i));
    this.shots = project.shots;
    this.characters = project.characters;
    this.coachStyles = project.coachStyles;

    const activitiesByLowerId = new Map(project.activities.map((a) => [a.id.toLowerCase(), a]));

    for (const rawNode of project.nodes) {
      const events: RuntimeEvent[] = [];
      for (const rawEvent of rawNode.events ?? []) {
        const evt = createRuntimeEvent(rawEvent, this.localization);
        if (!evt) {
          this.unsupportedEvents.push({ nodeId: rawNode.id, eventId: rawEvent.id, type: rawEvent.type });
          continue;
        }
        if (evt.type === 'activity') {
          const activity = activitiesByLowerId.get(evt.activityId);
          if (!activity) throw new Error(`[${evt.id}] Unable to find activity: ${evt.activityId}`);
          evt.activity = activity;
        }
        if (evt.type === 'dialogue' || evt.type === 'thought') {
          evt.audio = resolveEventAudio(rawNode, rawEvent);
        }
        events.push(evt);
      }
      const node = new ConvNode(rawNode, events, this.localization, this.recorder);
      this.nodes.push(node);
      this.nodesByLowerId.set(node.lowerId, node);
    }

    const requireNode = (id: string | null | undefined, label: string): ConvNode | null => {
      if (!id) return null;
      const node = this.getNode(id);
      if (!node) throw new Error(`${label} node is missing: ${id}`);
      return node;
    };
    this.introNode = requireNode(conv.intro, 'Intro');
    this.outroNode = requireNode(conv.outro, 'Outro');
    this.updateNode = requireNode(conv.update, 'Update');
    this.startingTagId = conv.starting_tag ?? null;

    this.logic = new ConversationLogic(this);
  }

  // ---- lookups ----

  getNode(id: string): ConvNode | null {
    return this.nodesByLowerId.get(id.toLowerCase()) ?? null;
  }
  getVariable(id: string): Variable | null {
    return this.variablesByLowerId.get(id.toLowerCase()) ?? null;
  }
  getMilestone(id: string): Milestone | null {
    return this.milestonesByLowerId.get(id.toLowerCase()) ?? null;
  }
  hasTag(id: string): boolean {
    return this.tagLowerIds.has(id.toLowerCase());
  }
  getTacticIndex(id: string | null): number {
    if (!id) return -1;
    return this.tacticIndexByLowerId.get(id) ?? -1;
  }

  get evaluationData(): ConversationLogic {
    return this.logic;
  }

  get turnNumber(): number {
    return this.history.turnNumber;
  }

  get canUndo(): boolean {
    if (this.canUndoOverride !== undefined && !this.canUndoOverride) return false;
    return !this.disableUndo && this.history.turnNumber > 0;
  }

  get pendingActivities(): boolean {
    return this.logic.activitiesPending;
  }

  get pendingActivityEvents(): readonly ActivityEvent[] {
    return this.logic.activityEventsToComplete;
  }

  get isInitializing(): boolean {
    return this.initializing;
  }

  // ---- lifecycle ----

  start(): void {
    this.logic.start(this.startingTagId);
    if (this.introNode) {
      this.addDebugNodeToPath(this.introNode, false);
      this.introEventQueue = this.logic.evaluateNode(this.introNode);
      this.logic.performOfferedLinkages();
    }
    this.initializing = false;
  }

  selectNode(node: ConvNode): void {
    if (this.initializing) {
      throw new Error('Trying to select a node without starting the conversation');
    }
    if (node.selected && !node.repeatable) {
      throw new Error('Trying to select a node which has already been selected');
    }
    if (!node.visible) {
      throw new Error('Trying to select a node which is not available');
    }
    if (this.logic.activitiesPending) {
      throw new Error('All activities need to be completed before selecting the next node');
    }

    const newSelectedPath = [...this.selectedPath];

    if (this.pendingOverrides.size > 0) {
      const overrides: Record<string, number> = {};
      for (const [id, value] of this.pendingOverrides) {
        this.setVariable(id, value);
        overrides[id] = value;
      }
      newSelectedPath.push(JSON.stringify({ override: overrides }));
      this.pendingOverrides.clear();
    }

    newSelectedPath.push(node.id);
    this.setSelectedPath(newSelectedPath);

    for (const variable of this.variables) {
      if (variable.resetText) variable.setText(variable.defaultText);
    }

    this.eventQueue = this.logic.selectNode(node);

    if (this.completed) this.evaluateOutro();

    this.history.recordSelection(node.id, this.eventQueue);
  }

  selectNodeById(id: string): void {
    const node = this.getNode(id);
    if (!node) throw new Error(`Node not found: ${id}`);
    this.selectNode(node);
  }

  finalizeActivities(): void {
    if (this.initializing) {
      throw new Error('Trying to finalize activities without starting the conversation');
    }
    if (!this.pendingActivities) return;
    if (!this.logic.allActivitiesCompleted()) {
      throw new Error("Trying to finalize activities before they're completed");
    }

    const selectionString = this.logic.getActivitiesSelectionString();
    this.setSelectedPath([...this.selectedPath, selectionString]);
    this.setDebugPath([...this.debugPath, selectionString]);

    this.eventQueue = this.logic.finalizeActivities();
    if (this.completed) this.evaluateOutro();
    this.history.recordActivity(this.eventQueue);
  }

  private evaluateOutro(): void {
    if (!this.outroNode) return;
    this.addDebugNodeToPath(this.outroNode, false);
    const outro = this.logic.evaluateNode(this.outroNode);
    const old = this.outroEventQueue;
    this.recorder.record('conversation', 'outro', old, outro, () => {
      this.outroEventQueue = old;
    });
    this.outroEventQueue = outro;
    this.logic.performOfferedLinkages();
  }

  undo(): void {
    if (!this.canUndo) return;
    this.eventQueue = [...this.history.undo()];
    this.logic.activityEventsToComplete.length = 0;
    if (this.turnNumber === 0 && this.introEventQueue.length > 0) {
      for (const evt of this.introEventQueue) {
        if (evt.type === 'activity') this.logic.activityEventsToComplete.push(evt);
      }
    }
  }

  complete(success: boolean): void {
    if (this.completed) return;
    const wasCompleted = this.completed;
    const wasSuccess = this.success;
    this.recorder.record('conversation', 'completed', wasCompleted, true, () => {
      this.completed = wasCompleted;
    });
    this.recorder.record('conversation', 'success', wasSuccess, success, () => {
      this.success = wasSuccess;
    });
    this.completed = true;
    this.success = success;
  }

  // ---- choice menu ----

  getBehaviorSelection(): TacticContainer[] {
    if (this.completed) return [];
    const data = this.logic;

    const validNodes = this.nodes.filter((n) => n.visible);
    validNodes.sort((a, b) => {
      const tacticA = a.tacticId(data);
      const tacticB = b.tacticId(data);
      if (tacticA === tacticB) {
        const orderA = a.tacticOrder(data);
        const orderB = b.tacticOrder(data);
        if (orderA === orderB) {
          return this.nodes.indexOf(a) - this.nodes.indexOf(b);
        }
        return orderA - orderB;
      }
      return this.getTacticIndex(tacticA) - this.getTacticIndex(tacticB);
    });

    const containers: TacticContainer[] = [];
    let lastTacticId: string | null | undefined;
    for (const node of validNodes) {
      const tacticId = node.tacticId(data);
      if (tacticId !== lastTacticId || containers.length === 0) {
        lastTacticId = tacticId;
        const tactic = tacticId
          ? this.tactics[this.getTacticIndex(tacticId)]
          : undefined;
        containers.push({
          tacticId: tacticId,
          name: tactic
            ? this.localization.resolve(tactic.localization_guid, 'name', tactic.name)
            : '',
          metadata: tactic?.metadata ?? {},
          behaviors: [],
        });
      }
      containers[containers.length - 1]!.behaviors.push({
        id: node.id,
        title: node.title(data),
        index: node.behaviorIndex,
        select: () => this.selectNode(node),
      });
    }
    return containers;
  }

  // ---- variables ----

  setVariable(id: string, value: number): void {
    this.getVariable(id)?.update(value);
  }

  addVariableOverride(id: string, value: number): void {
    this.pendingOverrides.set(id, value);
  }

  // ---- paths / suspend data ----

  addDebugNodeToPath(node: ConvNode, selected: boolean): void {
    this.setDebugPath([...this.debugPath, (selected ? '' : 'jump_') + node.id]);
  }

  private setSelectedPath(next: string[]): void {
    const old = this.selectedPath;
    this.recorder.record('conversation', 'selectpath', old, next, () => {
      this.selectedPath = old;
    });
    this.selectedPath = next;
  }

  private setDebugPath(next: string[]): void {
    const old = this.debugPath;
    this.recorder.record('conversation', 'debugpath', old, next, () => {
      this.debugPath = old;
    });
    this.debugPath = next;
  }

  getSelectedPathString(): string {
    return this.selectedPath.join(',');
  }

  getDebugPathString(): string {
    return this.debugPath.join(',');
  }

  /**
   * Port of Conversation.SelectPath(string): replays a previously recorded
   * path — node selections, {"override":{...}} variable overrides, and
   * {"activity_x":{...}} activity results — to restore a session.
   */
  selectPath(path: string): void {
    const { replaced, replacements } = replaceActivities(path);
    const items = replaced.replace(/\s/g, '').split(',').filter(Boolean);

    for (const item of items) {
      if (item.toLowerCase().startsWith('act_')) {
        const json = replacements.get(item)!;
        const data = JSON.parse(json) as Record<string, unknown>;

        if ('override' in data) {
          const overrides = data['override'] as Record<string, number>;
          for (const [variableId, value] of Object.entries(overrides)) {
            this.setVariable(variableId, Math.trunc(value));
          }
          this.setSelectedPath([...this.selectedPath, json]);
          this.setDebugPath([...this.debugPath, json]);
        } else {
          for (const evt of this.logic.activityEventsToComplete) {
            const activityData = data[evt.activityId] as Record<string, number> | undefined;
            if (!activityData) continue;
            for (const map of evt.resultMaps) {
              map.result = map.id in activityData ? activityData[map.id]! : map.previousValue;
            }
          }
        }
        this.finalizeActivities();
      } else if (item.toLowerCase().startsWith('jump_') || item.startsWith('-->')) {
        continue;
      } else {
        this.selectBehaviorInPath(item);
      }
    }
  }

  private selectBehaviorInPath(id: string): void {
    const lower = id.toLowerCase();
    for (const tactic of this.getBehaviorSelection()) {
      for (const behavior of tactic.behaviors) {
        if (behavior.id.toLowerCase() === lower) {
          behavior.select();
          return;
        }
      }
    }
    throw new Error(`Behavior in path is not available: ${id}`);
  }

  // ---- queues / transcript ----

  getEventQueue(): readonly RuntimeEvent[] {
    return this.eventQueue;
  }
  getIntroEventQueue(): readonly RuntimeEvent[] {
    return this.introEventQueue;
  }
  getOutroEventQueue(): readonly RuntimeEvent[] {
    return this.outroEventQueue;
  }

  getTranscript(): RuntimeEvent[][] {
    return this.getTranscriptTurns().map((t) => t.events);
  }

  /** Turn-by-turn transcript including which node the learner chose. */
  getTranscriptTurns(): { nodeId: string | null; activity: boolean; events: RuntimeEvent[] }[] {
    const ret = this.history.turns.map((t) => ({
      nodeId: t.nodeId,
      activity: t.activity,
      events: [...t.events],
    }));
    ret.push({
      nodeId: this.history.currentTurn.nodeId,
      activity: this.history.currentTurn.activity,
      events: [...this.history.currentTurn.events],
    });
    return ret;
  }

  addToTotalDuration(duration: number): void {
    if (duration === 0) return;
    const old = this.totalDuration;
    this.recorder.record('conversation', 'totalduration', old, old + duration, () => {
      this.totalDuration = old;
    });
    this.totalDuration += duration;
  }

  setDefaultBehaviorShot(shotId: string | undefined): void {
    const old = this.defaultBehaviorShotId;
    this.recorder.record('conversation', 'behaviorshot', old, shotId, () => {
      this.defaultBehaviorShotId = old;
    });
    this.defaultBehaviorShotId = shotId;
  }

  getVariableDump(): string {
    return this.variables
      .map((v) => `[Variable: Id=${v.id}, Value=${v.value}, Text=${v.text}]`)
      .join('\n');
  }
}

/**
 * Port of Conversation.ReplaceActivities: swaps balanced {...} JSON segments
 * for act_N placeholders so the path can be comma-split safely.
 */
export function replaceActivities(path: string): {
  replaced: string;
  replacements: Map<string, string>;
} {
  const replacements = new Map<string, string>();
  let replaced = '';
  let depth = 0;
  let start = -1;
  let counter = 0;

  for (let i = 0; i < path.length; i++) {
    const ch = path[i]!;
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        const id = `act_${++counter}`;
        replacements.set(id, path.slice(start, i + 1));
        replaced += id;
        start = -1;
        continue;
      }
    } else if (depth === 0) {
      replaced += ch;
    }
  }
  return { replaced, replacements };
}
