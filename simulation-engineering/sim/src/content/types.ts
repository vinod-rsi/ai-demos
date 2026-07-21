/**
 * Raw JSON schema of a Konverse conversation project, mirroring the Unity
 * parsers in Assets/Backpack/KonverseSource/Data/Parsers. Field names match
 * the JSON on disk exactly.
 */

export interface RawConversation {
  id: string;
  localization_guid?: string;
  name?: string;
  intro?: string | null;
  outro?: string | null;
  update?: string | null;
  starting_tag?: string | null;
  version?: string;
  disable_undo?: boolean;
  auto_dialogue_variables?: boolean;
  behavior_shot?: string | null;
  default_tactic_color_r?: number;
  default_tactic_color_g?: number;
  default_tactic_color_b?: number;
  behavior_menu?: unknown[];
}

/** Linkage types from LinkageHelper.cs */
export type LinkageType =
  | 'activate'
  | 'deactivate'
  | 'allow'
  | 'disallow'
  | 'close'
  | 'offereddeactivate'
  | 'offereddisallow'
  | 'offeredclose';

export interface RawLinkage {
  /** Target node id or tag id. */
  id: string;
  type: LinkageType;
  condition?: string;
}

export interface RawLifetime {
  type?: 'active' | 'offered';
  duration?: number;
  action?: 'deactivate' | 'close';
}

export interface RawConditionalString {
  condition?: string;
  text?: string;
  localization_guid?: string;
}

export interface RawConditionalTactic {
  condition?: string;
  tactic?: string;
  tactic_order?: number;
}

/** Event types registered in ElementParserFactory.GetEventParser. */
export const KNOWN_EVENT_TYPES = [
  'activity',
  'coach',
  'defaultshot',
  'delaylifetime',
  'dialogue',
  'endconversation',
  'generic',
  'idle',
  'jump',
  'mgfx',
  'questionnaire',
  'shot',
  'thought',
  'variable',
  'variabletext',
  'milestonetext',
  'milestone',
  'toggleundobutton',
] as const;
export type EventType = (typeof KNOWN_EVENT_TYPES)[number];

/** Event types the TS engine fully implements today. */
export const SUPPORTED_EVENT_TYPES: ReadonlySet<string> = new Set([
  'activity',
  'coach',
  'defaultshot',
  'delaylifetime',
  'dialogue',
  'endconversation',
  'jump',
  'mgfx',
  'shot',
  'thought',
  'variable',
  'variabletext',
  'milestonetext',
  'milestone',
  'toggleundobutton',
]);

export interface RawEvent {
  id: string;
  type: string;
  localization_guid?: string;
  condition?: string;
  notes?: string;
  metadata?: Record<string, string>;
  // dialogue / thought
  audio?: string;
  auto_assign_audio?: boolean;
  'auto-assign-audio'?: boolean;
  text?: string;
  character?: string;
  shot?: string;
  // variable / variabletext / dialogue auto-variable
  variable?: string;
  expression?: string;
  modifier?: 'assign' | 'increment';
  // jump
  target?: string;
  return?: boolean;
  // coach
  style?: string;
  // activity
  activity?: string;
  // endconversation
  success?: boolean;
  // milestone
  milestone?: string;
  state?: string | number;
  // toggleundobutton
  value?: boolean;
}

export interface RawNode {
  id: string;
  localization_guid?: string;
  allow_visibility?: boolean;
  repeatable?: boolean;
  behavior_menu_type?: number;
  inaccessible?: boolean;
  title?: string;
  technique?: string | null;
  cutscene?: string;
  tactic?: string | null;
  lifetime?: RawLifetime | number;
  tactic_order?: number;
  tags?: string[];
  linkages?: RawLinkage[];
  events?: RawEvent[];
  conditional_titles?: RawConditionalString[];
  conditional_tactics?: RawConditionalTactic[];
  behavior_id?: number;
  duration?: number;
}

export interface RawVariableGate {
  target: string;
  operand: '<' | '<=' | '>' | '>=';
  trigger: number;
  repeat?: boolean;
  return?: boolean;
}

export interface RawVariable {
  id: string;
  localization_guid?: string;
  name?: string;
  value?: number;
  min?: number;
  max?: number;
  text?: string;
  reset_text?: boolean;
  'reset-text'?: boolean;
  meter?: boolean;
  tracked?: boolean;
  import_starting_value?: boolean;
  export_ending_value?: boolean;
  reporting_success_threshold?: number;
  reporting_unit_type?: string;
  gates?: RawVariableGate[];
}

export interface RawTag {
  id: string;
  localization_guid?: string;
  name?: string;
}

export interface RawTactic {
  id: string;
  localization_guid?: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface RawShot {
  id: string;
  localization_guid?: string;
  name?: string;
  environment?: number;
  background?: number;
  camera?: number;
  'pc-model'?: number;
  'npc-models'?: number[];
}

export interface RawCharacter {
  id: string;
  localization_guid?: string;
  name?: string;
  npc?: boolean;
  npc_id?: number;
}

export interface RawCoachStyle {
  id: string;
  localization_guid?: string;
  name?: string;
  modal?: boolean;
  image?: string;
  scrim?: boolean;
}

export interface RawActivityVariableMap {
  variable: string;
  min?: number;
  max?: number;
  'initial-value'?: number;
  'inherit-value'?: boolean;
  'correct-values'?: number[];
  'incorrect-values'?: number[];
}

export interface RawActivity {
  id: string;
  localization_guid?: string;
  name?: string;
  type?: string;
  'activity-optional-name'?: string;
  'inherit-value'?: boolean;
  variables?: RawActivityVariableMap[];
  dialogue?: unknown[];
  /** Node auto-selected after the activity completes. */
  node?: string;
  /** true = assign results, false = add results (Activity.SetResultType). */
  'set-values'?: boolean;
}

export interface RawMilestone {
  id: string;
  localization_guid?: string;
  name?: string;
  text?: string;
}

/** Flat "<guid>_<field>" -> string map. */
export type LocalizationSource = Record<string, string>;

/**
 * Auto-assigned audio clip name (DialogueEventElement.GetAutoAssign):
 * node id without the "node_" prefix + a letter from the event's index among
 * the node's events of the same type ('a' for the first, 'b' second, ...).
 * Thought events insert "thought" before the letter.
 */
export function autoAssignClip(nodeId: string, precedingCount: number, thought = false): string {
  const letter = String.fromCharCode('a'.charCodeAt(0) + precedingCount);
  return nodeId.replace(/^node_/, '') + (thought ? 'thought' : '') + letter;
}

/** Resolves the audio clip for a dialogue/thought event within its node. */
export function resolveEventAudio(node: RawNode, evt: RawEvent): string | undefined {
  const auto = evt.auto_assign_audio ?? evt['auto-assign-audio'] ?? false;
  if (!auto) return evt.audio ?? undefined;
  let count = 0;
  for (const other of node.events ?? []) {
    if (other === evt) {
      return autoAssignClip(node.id, count, evt.type === 'thought');
    }
    if (other.type === evt.type) count++;
  }
  return evt.audio ?? undefined;
}

/** Everything loaded from ENGPH_DME_10_Logic, still in raw JSON shape. */
export interface ConversationProject {
  conversation: RawConversation;
  nodes: RawNode[];
  variables: RawVariable[];
  tags: RawTag[];
  tactics: RawTactic[];
  shots: RawShot[];
  characters: RawCharacter[];
  coachStyles: RawCoachStyle[];
  activities: RawActivity[];
  milestones: RawMilestone[];
  localization: LocalizationSource;
}
