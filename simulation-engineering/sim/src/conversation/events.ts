import type { RawActivity, RawEvent } from '../content/types';
import { CompiledExpression } from './expression/evaluator';
import type { Localization } from '../content/localization';
import type { MilestoneState } from './milestone';

/**
 * Runtime node events — the union the UI consumes. Mirrors
 * KonverseSource/Runtime/Events. Localized text is resolved at build time.
 */

interface BaseEvent {
  id: string;
  condition: CompiledExpression;
  notes?: string;
  metadata?: Record<string, string>;
}

export interface CutsceneEvent extends BaseEvent {
  type: 'cutscene';
  cutsceneId: string;
  nodeId: string;
}

export interface DialogueEvent extends BaseEvent {
  type: 'dialogue';
  /** Audio clip id ("empty" means silence). */
  audio?: string;
  text: string;
  characterId?: string;
  shotId?: string;
  variableId?: string;
}

export interface ThoughtEvent extends BaseEvent {
  type: 'thought';
  audio?: string;
  text: string;
  characterId?: string;
  shotId?: string;
}

export interface CoachEvent extends BaseEvent {
  type: 'coach';
  styleId?: string;
  text: string;
  /** Text after $value()/$text()/time substitution, set during evaluation. */
  replacementText?: string;
}

export interface JumpEvent extends BaseEvent {
  type: 'jump';
  targetId: string;
  returns: boolean;
}

export interface VariableEvent extends BaseEvent {
  type: 'variable';
  variableId: string;
  expression: CompiledExpression;
  modifier: 'assign' | 'increment';
}

export interface VariableChangeEvent extends BaseEvent {
  type: 'variablechange';
  variableId: string;
  oldValue: number;
  newValue: number;
}

export interface VariableTextEvent extends BaseEvent {
  type: 'variabletext';
  variableId: string;
  text: string;
}

export interface MilestoneEvent extends BaseEvent {
  type: 'milestone';
  milestoneId: string;
  state: MilestoneState;
}

export interface MilestoneTextEvent extends BaseEvent {
  type: 'milestonetext';
  milestoneId: string;
  text: string;
}

export interface MilestoneChangeEvent extends BaseEvent {
  type: 'milestonechange';
  milestoneId: string;
  oldState: MilestoneState;
  newState: MilestoneState;
}

export interface ActivityResultMap {
  /** Variable id the activity writes. */
  id: string;
  previousValue: number;
  result?: number;
  correctValues: number[];
  min: number;
  max: number;
  initialValue: number;
}

export interface ActivityEvent extends BaseEvent {
  type: 'activity';
  activityId: string;
  activity: RawActivity;
  resultMaps: ActivityResultMap[];
}

export interface EndConversationEvent extends BaseEvent {
  type: 'endconversation';
  success: boolean;
}

export interface ShotEvent extends BaseEvent {
  type: 'shot';
  shotId?: string;
}

export interface DefaultShotEvent extends BaseEvent {
  type: 'defaultshot';
  shotId?: string;
}

export interface DelayLifetimeEvent extends BaseEvent {
  type: 'delaylifetime';
}

export interface ToggleUndoButtonEvent extends BaseEvent {
  type: 'toggleundobutton';
  value: boolean;
}

/** mgfx / idle / generic / questionnaire — passed through to the queue untouched. */
export interface PassthroughEvent extends BaseEvent {
  type: 'mgfx' | 'idle' | 'generic' | 'questionnaire';
  raw: RawEvent;
}

export type RuntimeEvent =
  | CutsceneEvent
  | DialogueEvent
  | ThoughtEvent
  | CoachEvent
  | JumpEvent
  | VariableEvent
  | VariableChangeEvent
  | VariableTextEvent
  | MilestoneEvent
  | MilestoneTextEvent
  | MilestoneChangeEvent
  | ActivityEvent
  | EndConversationEvent
  | ShotEvent
  | DefaultShotEvent
  | DelayLifetimeEvent
  | ToggleUndoButtonEvent
  | PassthroughEvent;

/** Builds a runtime event from raw JSON; returns null for unknown types
 *  (the validator reports them; C# would throw "Unsupported event type"). */
export function createRuntimeEvent(raw: RawEvent, loc: Localization): RuntimeEvent | null {
  const base: BaseEvent = {
    id: raw.id,
    condition: new CompiledExpression(raw.condition),
    notes: raw.notes,
    metadata: raw.metadata,
  };
  const guid = raw.localization_guid;

  switch (raw.type) {
    case 'dialogue':
      return {
        ...base,
        type: 'dialogue',
        audio: raw.audio,
        text: loc.resolve(guid, 'text', raw.text),
        characterId: raw.character?.toLowerCase(),
        shotId: raw.shot?.toLowerCase(),
        variableId: raw.variable?.toLowerCase(),
      };
    case 'thought':
      return {
        ...base,
        type: 'thought',
        audio: raw.audio,
        text: loc.resolve(guid, 'text', raw.text),
        characterId: raw.character?.toLowerCase(),
        shotId: raw.shot?.toLowerCase(),
      };
    case 'coach':
      return {
        ...base,
        type: 'coach',
        styleId: raw.style?.toLowerCase(),
        text: loc.resolve(guid, 'text', raw.text),
      };
    case 'jump':
      if (!raw.target) throw new Error(`Jump event ${raw.id} has no target`);
      return { ...base, type: 'jump', targetId: raw.target.toLowerCase(), returns: raw.return ?? false };
    case 'variable':
      if (!raw.variable) throw new Error(`Variable event ${raw.id} has no variable`);
      return {
        ...base,
        type: 'variable',
        variableId: raw.variable.toLowerCase(),
        expression: new CompiledExpression(raw.expression),
        modifier: raw.modifier ?? 'assign',
      };
    case 'variabletext':
      if (!raw.variable) throw new Error(`Variabletext event ${raw.id} has no variable`);
      return {
        ...base,
        type: 'variabletext',
        variableId: raw.variable.toLowerCase(),
        text: loc.resolve(guid, 'text', raw.text),
      };
    case 'milestone':
      return {
        ...base,
        type: 'milestone',
        milestoneId: (raw.milestone ?? raw.variable ?? '').toLowerCase(),
        state: (raw.state as MilestoneState) ?? 'completed',
      };
    case 'milestonetext':
      return {
        ...base,
        type: 'milestonetext',
        milestoneId: (raw.milestone ?? raw.variable ?? '').toLowerCase(),
        text: loc.resolve(guid, 'text', raw.text),
      };
    case 'activity':
      if (!raw.activity) throw new Error(`Activity event ${raw.id} has no activity`);
      return {
        ...base,
        type: 'activity',
        activityId: raw.activity.toLowerCase(),
        activity: undefined as unknown as RawActivity, // resolved by engine init
        resultMaps: [],
      };
    case 'endconversation':
      return { ...base, type: 'endconversation', success: raw.success ?? false };
    case 'shot':
      return { ...base, type: 'shot', shotId: raw.shot?.toLowerCase() };
    case 'defaultshot':
      return { ...base, type: 'defaultshot', shotId: raw.shot?.toLowerCase() };
    case 'delaylifetime':
      return { ...base, type: 'delaylifetime' };
    case 'toggleundobutton':
      return { ...base, type: 'toggleundobutton', value: raw.value ?? false };
    case 'mgfx':
    case 'idle':
    case 'generic':
    case 'questionnaire':
      return { ...base, type: raw.type, raw };
    default:
      return null;
  }
}
