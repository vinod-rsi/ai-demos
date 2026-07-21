import type { ConversationProject, RawEvent, RawNode } from './types';
import { KNOWN_EVENT_TYPES, SUPPORTED_EVENT_TYPES, resolveEventAudio } from './types';
import { parseExpression, walkExpression, type ExpressionAst } from '../conversation/expression/parser';

export interface MissingRef {
  kind: string;
  sourceId: string;
  ref: string;
}

export interface ExpressionIssue {
  sourceId: string;
  expression: string;
  error: string;
}

export interface ValidationReport {
  conversationId: string;
  counts: {
    nodes: number;
    events: number;
    variables: number;
    tags: number;
    tactics: number;
    shots: number;
    characters: number;
    coachStyles: number;
    activities: number;
    milestones: number;
    localizationKeys: number;
  };
  eventTypeCounts: Record<string, number>;
  /** Event types absent from the Unity parser registry entirely. */
  unknownEventTypes: { nodeId: string; eventId: string; type: string }[];
  /** Event types Unity knows but this port doesn't act on yet. */
  unimplementedEventTypes: { nodeId: string; eventId: string; type: string }[];
  missingRefs: MissingRef[];
  expressionErrors: ExpressionIssue[];
  /** `!identifier` — the Unity RPN engine silently DROPS this negation;
   *  the TS port applies it. Flagged so divergence is visible. */
  negatedIdentifiers: ExpressionIssue[];
  /** guid_field keys referenced but absent from LocalizationSource (the
   *  inline JSON fallback text is used — informational). */
  missingLocalization: { sourceId: string; key: string }[];
  audio: {
    referenced: string[];
    missing: string[];
    unused: string[];
  };
}

const NODE_STATUS_FUNCTIONS = new Set([
  'played', 'offered', 'selected', 'active', 'allowed', 'closed', 'visible',
  'duration', 'camefrom', 'comingfrom', 'jumpingfrom', 'turnsago',
  'upcoming', 'inprogress', 'completed', 'failed', 'skipped', 'value',
]);
const BUILTIN_FUNCTIONS = new Set(['Min', 'Max', 'Approx', 'Approximately']);
const BUILTIN_IDENTIFIERS = new Set(['true', 'false', 'pi', 'pathtime', 'seattime']);

export function validateProject(
  project: ConversationProject,
  audioFiles: string[] = [],
): ValidationReport {
  const nodeIds = new Set(project.nodes.map((n) => n.id.toLowerCase()));
  const tagIds = new Set(project.tags.map((t) => t.id.toLowerCase()));
  const variableIds = new Set(project.variables.map((v) => v.id.toLowerCase()));
  const milestoneIds = new Set(project.milestones.map((m) => m.id.toLowerCase()));
  const tacticIds = new Set(project.tactics.map((t) => t.id.toLowerCase()));
  const shotIds = new Set(project.shots.map((s) => s.id.toLowerCase()));
  const characterIds = new Set(project.characters.map((c) => c.id.toLowerCase()));
  const coachStyleIds = new Set(project.coachStyles.map((c) => c.id.toLowerCase()));
  const activityIds = new Set(project.activities.map((a) => a.id.toLowerCase()));

  const report: ValidationReport = {
    conversationId: project.conversation.id,
    counts: {
      nodes: project.nodes.length,
      events: 0,
      variables: project.variables.length,
      tags: project.tags.length,
      tactics: project.tactics.length,
      shots: project.shots.length,
      characters: project.characters.length,
      coachStyles: project.coachStyles.length,
      activities: project.activities.length,
      milestones: project.milestones.length,
      localizationKeys: Object.keys(project.localization).length,
    },
    eventTypeCounts: {},
    unknownEventTypes: [],
    unimplementedEventTypes: [],
    missingRefs: [],
    expressionErrors: [],
    negatedIdentifiers: [],
    missingLocalization: [],
    audio: { referenced: [], missing: [], unused: [] },
  };

  const missingRef = (kind: string, sourceId: string, ref: string) =>
    report.missingRefs.push({ kind, sourceId, ref });

  const checkNodeOrTag = (kind: string, sourceId: string, ref: string | undefined | null) => {
    if (!ref) return;
    const lower = ref.toLowerCase();
    if (!nodeIds.has(lower) && !tagIds.has(lower)) missingRef(kind, sourceId, ref);
  };

  const checkExpression = (sourceId: string, expression: string | undefined) => {
    if (!expression || expression.trim() === '') return;
    let ast: ExpressionAst;
    try {
      ast = parseExpression(expression);
    } catch (err) {
      report.expressionErrors.push({ sourceId, expression, error: String(err) });
      return;
    }
    walkExpression(ast, (node) => {
      if (node.kind === 'identifier') {
        const id = node.name.toLowerCase();
        if (BUILTIN_IDENTIFIERS.has(id)) return;
        if (id.startsWith('var_') && !variableIds.has(id)) missingRef('expression-variable', sourceId, node.name);
        else if (id.startsWith('mile_') && !milestoneIds.has(id)) missingRef('expression-milestone', sourceId, node.name);
        else if (id.startsWith('node_') && !nodeIds.has(id)) missingRef('expression-node', sourceId, node.name);
        else if (id.startsWith('tag_') && !tagIds.has(id)) missingRef('expression-tag', sourceId, node.name);
        else if (!/^(var_|mile_|node_|tag_)/.test(id)) {
          report.expressionErrors.push({ sourceId, expression, error: `Unknown identifier: ${node.name}` });
        }
      }
      if (node.kind === 'call') {
        if (!BUILTIN_FUNCTIONS.has(node.name) && !NODE_STATUS_FUNCTIONS.has(node.name.toLowerCase())) {
          report.expressionErrors.push({ sourceId, expression, error: `Unknown function: ${node.name}` });
        }
      }
      if (node.kind === 'unary' && node.op === '!' && node.operand.kind === 'identifier') {
        report.negatedIdentifiers.push({
          sourceId,
          expression,
          error: 'C# RPN parser silently ignores "!" on bare identifiers; TS port applies it',
        });
      }
    });
  };

  const checkLocalization = (sourceId: string, guid: string | undefined, field: string, inline: string | undefined) => {
    if (!guid) return;
    // Only meaningful when there IS text to localize.
    if (inline === undefined || inline === '') return;
    const key = `${guid}_${field}`;
    if (!(key in project.localization)) {
      report.missingLocalization.push({ sourceId, key });
    }
  };

  // ---- conversation-level refs ----
  const conv = project.conversation;
  if (conv.intro && !nodeIds.has(conv.intro.toLowerCase())) missingRef('intro', conv.id, conv.intro);
  if (conv.outro && !nodeIds.has(conv.outro.toLowerCase())) missingRef('outro', conv.id, conv.outro);
  if (conv.update && !nodeIds.has(conv.update.toLowerCase())) missingRef('update', conv.id, conv.update);
  if (conv.starting_tag && !tagIds.has(conv.starting_tag.toLowerCase())) {
    missingRef('starting_tag', conv.id, conv.starting_tag);
  }

  // ---- variables / gates ----
  for (const variable of project.variables) {
    for (const gate of variable.gates ?? []) {
      if (!nodeIds.has(gate.target.toLowerCase())) missingRef('gate-target', variable.id, gate.target);
    }
  }

  // ---- activities ----
  for (const activity of project.activities) {
    if (activity.node && !nodeIds.has(activity.node.toLowerCase())) {
      missingRef('activity-node', activity.id, activity.node);
    }
    for (const map of activity.variables ?? []) {
      if (!variableIds.has(map.variable.toLowerCase())) {
        missingRef('activity-variable', activity.id, map.variable);
      }
    }
  }

  // ---- nodes / events ----
  const referencedAudio = new Set<string>();
  for (const node of project.nodes) {
    for (const tag of node.tags ?? []) {
      if (!tagIds.has(tag.toLowerCase())) missingRef('node-tag', node.id, tag);
    }
    if (node.tactic && !tacticIds.has(node.tactic.toLowerCase())) {
      missingRef('node-tactic', node.id, node.tactic);
    }
    checkLocalization(node.id, node.localization_guid, 'title', node.title);

    for (const linkage of node.linkages ?? []) {
      checkNodeOrTag('linkage-target', node.id, linkage.id);
      checkExpression(`${node.id}/linkage:${linkage.id}`, linkage.condition);
    }
    for (const ct of node.conditional_titles ?? []) checkExpression(`${node.id}/conditional_title`, ct.condition);
    for (const ct of node.conditional_tactics ?? []) {
      checkExpression(`${node.id}/conditional_tactic`, ct.condition);
      if (ct.tactic && !tacticIds.has(ct.tactic.toLowerCase())) missingRef('conditional-tactic', node.id, ct.tactic);
    }

    for (const evt of node.events ?? []) {
      report.counts.events++;
      report.eventTypeCounts[evt.type] = (report.eventTypeCounts[evt.type] ?? 0) + 1;
      if (!(KNOWN_EVENT_TYPES as readonly string[]).includes(evt.type)) {
        report.unknownEventTypes.push({ nodeId: node.id, eventId: evt.id, type: evt.type });
      } else if (!SUPPORTED_EVENT_TYPES.has(evt.type)) {
        report.unimplementedEventTypes.push({ nodeId: node.id, eventId: evt.id, type: evt.type });
      }
      checkExpression(`${node.id}/${evt.id}`, evt.condition);
      validateEventRefs(node, evt);
    }
  }

  function validateEventRefs(node: RawNode, evt: RawEvent): void {
    const src = `${node.id}/${evt.id}`;
    switch (evt.type) {
      case 'dialogue':
      case 'thought': {
        if (evt.character && !characterIds.has(evt.character.toLowerCase())) missingRef('event-character', src, evt.character);
        if (evt.shot && !shotIds.has(evt.shot.toLowerCase())) missingRef('event-shot', src, evt.shot);
        const audio = resolveEventAudio(node, evt);
        if (audio && audio !== 'empty') referencedAudio.add(audio);
        checkLocalization(src, evt.localization_guid, 'text', evt.text);
        break;
      }
      case 'jump':
        if (!evt.target) missingRef('jump-target', src, '(none)');
        else if (!nodeIds.has(evt.target.toLowerCase())) missingRef('jump-target', src, evt.target);
        break;
      case 'variable':
        if (!evt.variable || !variableIds.has(evt.variable.toLowerCase())) {
          missingRef('event-variable', src, evt.variable ?? '(none)');
        }
        checkExpression(src, evt.expression);
        break;
      case 'variabletext':
        if (!evt.variable || !variableIds.has(evt.variable.toLowerCase())) {
          missingRef('event-variable', src, evt.variable ?? '(none)');
        }
        checkLocalization(src, evt.localization_guid, 'text', evt.text);
        break;
      case 'coach':
        if (evt.style && !coachStyleIds.has(evt.style.toLowerCase())) missingRef('coach-style', src, evt.style);
        checkLocalization(src, evt.localization_guid, 'text', evt.text);
        break;
      case 'activity':
        if (!evt.activity || !activityIds.has(evt.activity.toLowerCase())) {
          missingRef('event-activity', src, evt.activity ?? '(none)');
        }
        break;
      case 'shot':
      case 'defaultshot':
        if (evt.shot && !shotIds.has(evt.shot.toLowerCase())) missingRef('event-shot', src, evt.shot);
        break;
      case 'milestone':
      case 'milestonetext':
        if (evt.milestone && !milestoneIds.has(evt.milestone.toLowerCase())) {
          missingRef('event-milestone', src, evt.milestone);
        }
        break;
    }
  }

  // ---- audio cross-check ----
  const wavs = new Set(
    audioFiles.filter((f) => f.toLowerCase().endsWith('.wav')).map((f) => f.replace(/\.wav$/i, '')),
  );
  report.audio.referenced = [...referencedAudio].sort();
  report.audio.missing = [...referencedAudio].filter((a) => !wavs.has(a)).sort();
  report.audio.unused = [...wavs].filter((w) => !referencedAudio.has(w)).sort();

  return report;
}

/** True when the report contains nothing that would break playback. */
export function isHealthy(report: ValidationReport): boolean {
  return (
    report.unknownEventTypes.length === 0 &&
    report.missingRefs.length === 0 &&
    report.expressionErrors.length === 0 &&
    report.audio.missing.length === 0
  );
}
