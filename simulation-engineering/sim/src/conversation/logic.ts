import type { EvaluationData, FunctionArg } from './expression/evaluator';
import type { ConvNode, Linkage } from './node';
import type {
  ActivityEvent,
  CutsceneEvent,
  RuntimeEvent,
  VariableChangeEvent,
  MilestoneChangeEvent,
} from './events';
import type { Conversation } from './engine';
import type { Variable } from './variable';
import { formatTimeSpan } from './time-format';
import type { MilestoneState } from './milestone';

const FIND_TEXT = /\$text\((.*?)\)/g;
const FIND_VALUE = /\$value\((.*?)\)/g;
const FORMAT_PATHTIME = /\$pathtime\((.*?)\)/g;
const FORMAT_SEATTIME = /\$seattime\((.*?)\)/g;
const FORMAT_GENERIC = /\$formattime\((.*?),(.*?)\)/g;

/**
 * Port of Runtime/ConversationLogic.cs — node evaluation, linkages,
 * activities, and the IEvaluationData identifier/function bridge.
 */
export class ConversationLogic implements EvaluationData {
  /** Nodes in the current recursive evaluation chain (CameFrom support). */
  private cameFromNodes: ConvNode[] = [];
  private lifetimeDelayed = false;
  readonly activityEventsToComplete: ActivityEvent[] = [];

  constructor(private root: Conversation) {}

  get activitiesPending(): boolean {
    return this.activityEventsToComplete.length > 0;
  }

  // ---- EvaluationData (ConversationLogic.EvaluateIdentifier/Function) ----

  evaluateIdentifier(id: string): number | undefined {
    if (id === 'true') return 1;
    if (id === 'false') return 0;
    if (id === 'pathtime') return this.root.totalDuration;
    if (id === 'seattime') return this.root.seatTime;
    if (id.startsWith('var_')) return this.root.getVariable(id)?.value;
    if (id.startsWith('mile_')) return this.root.getMilestone(id)?.stateOrdinal;
    if (id.startsWith('node_') || id.startsWith('tag_')) return 0;
    return undefined;
  }

  evaluateFunction(name: string, args: FunctionArg[]): number | undefined {
    if (args.length !== 1) {
      throw new Error(`Incorrect number of arguments passed to function: ${name} (${args.length})`);
    }
    const field = args[0]!.fieldName;
    if (!field) {
      throw new Error(`Function ${name} requires an identifier argument`);
    }
    const lowest = name.toLowerCase() === 'turnsago';

    if (field.startsWith('tag_')) {
      // Aggregate across all nodes carrying the tag: sum for most functions,
      // min of non-negative for turnsago.
      let result = lowest ? -1 : 0;
      for (const node of this.root.nodes) {
        if (!node.hasTag(field)) continue;
        const cur = this.nodeStatus(node, name);
        if (lowest) {
          if (result < 0) result = cur;
          else if (cur >= 0) result = Math.min(result, cur);
        } else {
          result += cur;
        }
      }
      return result;
    }
    if (field.startsWith('mile_')) {
      return this.milestoneStatus(field, name);
    }
    const node = this.root.getNode(field);
    if (!node) throw new Error(`Problem getting node status: ${field} ${name}`);
    return this.nodeStatus(node, name);
  }

  private nodeStatus(node: ConvNode, funcName: string): number {
    switch (funcName.toLowerCase()) {
      case 'played':
        return node.played ? 1 : 0;
      case 'offered':
        return node.offered ? 1 : 0;
      case 'selected':
        return node.selected ? 1 : 0;
      case 'active':
        return node.active ? 1 : 0;
      case 'allowed':
        return node.allowed ? 1 : 0;
      case 'closed':
        return node.closed ? 1 : 0;
      case 'visible':
        return node.visible ? 1 : 0;
      case 'duration':
        return node.duration;
      case 'camefrom':
      case 'comingfrom':
      case 'jumpingfrom':
        return this.cameFromNodes.includes(node) ? 1 : 0;
      case 'turnsago':
        if (node.lastPlayed === -1) return -1;
        return this.root.turnNumber - node.lastPlayed;
    }
    throw new Error(`Undefined function: ${funcName}`);
  }

  private milestoneStatus(milestoneId: string, funcName: string): number {
    const milestone = this.root.getMilestone(milestoneId);
    if (!milestone) throw new Error(`Milestone not found: ${milestoneId}`);
    const fn = funcName.toLowerCase();
    if (fn === 'value') return milestone.stateOrdinal;
    const states: MilestoneState[] = ['upcoming', 'inprogress', 'completed', 'failed', 'skipped'];
    if ((states as string[]).includes(fn)) {
      return milestone.state === fn ? 1 : 0;
    }
    throw new Error(`Undefined function: ${funcName}`);
  }

  // ---- lifecycle ----

  start(startingTagId: string | null): void {
    if (!startingTagId) return;
    const tag = startingTagId.toLowerCase();
    for (const node of this.root.nodes) {
      if (node.hasTag(tag)) node.setActive(true);
    }
  }

  /** Port of ConversationLogic.SelectNode. */
  selectNode(node: ConvNode): RuntimeEvent[] {
    if (node.closed) {
      throw new Error('Trying to play the same node multiple times');
    }

    this.lifetimeDelayed = false;
    const expiring = this.root.nodes.filter((n) => n.willLoseLifetime());

    this.root.addDebugNodeToPath(node, true);
    node.select();
    const events = this.evaluateNode(node);

    if (this.root.updateNode) {
      this.root.addDebugNodeToPath(this.root.updateNode, false);
      events.push(...this.evaluateNode(this.root.updateNode));
    }

    if (!this.lifetimeDelayed) {
      for (const n of expiring) n.handleLifetime();
    }

    this.performOfferedLinkages();
    return events;
  }

  performOfferedLinkages(): void {
    const linkages: Linkage[] = [];
    for (const node of this.root.nodes) {
      if (!node.visible) continue;
      for (const linkage of node.linkages) {
        if (linkage.onOffered && linkage.condition.isMet(this)) {
          linkages.push(linkage);
        }
      }
    }
    this.performLinkages(linkages);
    for (const node of this.root.nodes) {
      if (node.visible) node.offer();
    }
  }

  /** Port of ConversationLogic.EvaluateNode — the recursive heart. */
  evaluateNode(node: ConvNode): RuntimeEvent[] {
    const cameFromThis = this.cameFromNodes.length === 0;
    this.cameFromNodes.push(node);
    node.play(this.root.turnNumber);
    this.root.addToTotalDuration(node.duration);

    // Conditions are all evaluated before any linkage is applied.
    const applicable = node.linkages.filter((l) => !l.onOffered && l.condition.isMet(this));
    this.performLinkages(applicable);

    let addedCutsceneEvent = false;
    const events: RuntimeEvent[] = [];

    outer: for (const evt of node.events) {
      if (evt.condition.isMet(this)) {
        // Inject a cutscene event before the first dialogue/mgfx so the
        // performance layer can play the right sequence.
        if ((evt.type === 'dialogue' || evt.type === 'mgfx') && !addedCutsceneEvent) {
          addedCutsceneEvent = true;
          const cutscene: CutsceneEvent = {
            id: `${node.id}_cutscene`,
            type: 'cutscene',
            cutsceneId: node.cutscene && node.cutscene !== '' ? node.cutscene : node.id,
            nodeId: node.id,
            condition: evt.condition,
          };
          events.push(cutscene, evt);
          continue;
        }

        events.push(evt);

        switch (evt.type) {
          case 'jump': {
            const target = this.root.getNode(evt.targetId);
            if (!target) throw new Error(`[${node.id}] Jump target not found: ${evt.targetId}`);
            if (target === node) throw new Error(`[${node.id}] Trying to jump to itself`);
            this.root.addDebugNodeToPath(target, false);
            events.push(...this.evaluateNode(target));
            if (!evt.returns) break outer;
            continue;
          }
          case 'variable': {
            const variable = this.root.getVariable(evt.variableId);
            if (!variable) throw new Error(`[${evt.id}] Unable to find target variable: ${evt.variableId}`);
            const oldValue = variable.value;
            const modifier = Math.trunc(evt.expression.evaluate(this));
            const newValue = evt.modifier === 'increment' ? variable.value + modifier : modifier;
            const gate = variable.update(newValue);
            const change: VariableChangeEvent = {
              id: evt.id,
              type: 'variablechange',
              variableId: variable.id,
              oldValue,
              newValue: variable.value,
              condition: evt.condition,
            };
            events.push(change);
            if (gate) {
              const target = this.root.getNode(gate.targetId);
              if (!target) throw new Error(`Gate target not found: ${gate.targetId}`);
              this.root.addDebugNodeToPath(target, false);
              events.push(...this.evaluateNode(target));
              if (!gate.returns) break outer;
            }
            continue;
          }
          case 'milestone': {
            const milestone = this.root.getMilestone(evt.milestoneId);
            if (milestone) {
              const oldState = milestone.state;
              milestone.setState(evt.state);
              const change: MilestoneChangeEvent = {
                id: evt.id,
                type: 'milestonechange',
                milestoneId: milestone.id,
                oldState,
                newState: evt.state,
                condition: evt.condition,
              };
              events.push(change);
            }
            continue;
          }
          case 'coach': {
            evt.replacementText = this.substituteText(evt.text, node.id, evt.id);
            continue;
          }
          case 'variabletext': {
            const variable = this.root.getVariable(evt.variableId);
            if (variable) {
              variable.setText(this.substituteText(evt.text, node.id, evt.id));
            }
            continue;
          }
          case 'milestonetext': {
            const milestone = this.root.getMilestone(evt.milestoneId);
            if (milestone) {
              milestone.setText(this.substituteText(evt.text, node.id, evt.id));
            }
            continue;
          }
          case 'activity': {
            this.initializeActivityResults(evt);
            this.activityEventsToComplete.push(evt);
            break;
          }
          case 'delaylifetime':
            this.lifetimeDelayed = true;
            continue;
          case 'endconversation':
            this.root.complete(evt.success);
            continue;
          case 'toggleundobutton':
            this.root.canUndoOverride = evt.value;
            continue;
        }
      }
      // C# quirk: defaultshot applies even when its condition is NOT met.
      if (evt.type === 'defaultshot') {
        this.root.setDefaultBehaviorShot(evt.shotId);
      }
    }

    if (cameFromThis) this.cameFromNodes = [];
    return events;
  }

  private performLinkages(linkages: Linkage[]): void {
    for (const linkage of linkages) {
      const node = this.root.getNode(linkage.targetId);
      if (node) {
        this.performLinkage(linkage, node);
      } else if (this.root.hasTag(linkage.targetId)) {
        for (const tagged of this.root.nodes) {
          if (tagged.hasTag(linkage.targetId)) this.performLinkage(linkage, tagged);
        }
      } else {
        throw new Error(`[linkage] Unable to find target node or tag: ${linkage.targetId}`);
      }
    }
  }

  private performLinkage(linkage: Linkage, node: ConvNode): void {
    switch (linkage.linkageType) {
      case 'activate':
        node.setActive(true);
        break;
      case 'deactivate':
      case 'offereddeactivate':
        node.setActive(false);
        break;
      case 'allow':
        node.setAllowed(true);
        break;
      case 'disallow':
      case 'offereddisallow':
        node.setAllowed(false);
        break;
      case 'close':
      case 'offeredclose':
        node.close();
        break;
    }
  }

  // ---- activities ----

  private initializeActivityResults(evt: ActivityEvent): void {
    evt.resultMaps = (evt.activity.variables ?? []).map((map) => {
      const variable = this.root.getVariable(map.variable);
      if (!variable) throw new Error(`[${evt.id}] Activity variable not found: ${map.variable}`);
      const inherit = map['inherit-value'] ?? false;
      const initial = map['initial-value'] ?? 0;
      return {
        id: variable.lowerId,
        previousValue: inherit ? variable.value : initial,
        result: undefined,
        correctValues: map['correct-values'] ?? [],
        min: map.min ?? 0,
        max: map.max ?? 0,
        initialValue: initial,
      };
    });
  }

  allActivitiesCompleted(): boolean {
    return this.activityEventsToComplete.every((evt) =>
      evt.resultMaps.every((m) => m.result !== undefined),
    );
  }

  getActivitiesSelectionString(): string {
    const ret: Record<string, Record<string, number>> = {};
    for (const evt of this.activityEventsToComplete) {
      const results: Record<string, number> = {};
      for (const map of evt.resultMaps) {
        if (map.result !== undefined && map.result !== map.previousValue) {
          results[map.id] = map.result;
        }
      }
      ret[evt.activityId] = results;
    }
    return JSON.stringify(ret);
  }

  /** Port of ConversationLogic.FinalizeActivities. */
  finalizeActivities(): RuntimeEvent[] {
    const events: RuntimeEvent[] = [];
    if (this.activityEventsToComplete.length === 0) return events;

    const pending = [...this.activityEventsToComplete];
    this.activityEventsToComplete.length = 0;

    for (const evt of pending) {
      const assign = (evt.activity['set-values'] ?? false) === true;
      for (const map of evt.resultMaps) {
        const variable = this.root.getVariable(map.id);
        if (!variable) continue;
        const result = map.result ?? map.previousValue;
        const oldValue = variable.value;
        const gate = assign ? variable.update(result) : variable.update(variable.value + result);
        const change: VariableChangeEvent = {
          id: evt.id,
          type: 'variablechange',
          variableId: variable.id,
          oldValue,
          newValue: variable.value,
          condition: evt.condition,
        };
        events.push(change);
        if (gate) {
          const target = this.root.getNode(gate.targetId);
          if (!target) throw new Error(`Gate target not found: ${gate.targetId}`);
          this.root.addDebugNodeToPath(target, false);
          events.push(...this.evaluateNode(target));
        }
      }
      const resetMaps = () => this.initializeActivityResults(evt);
      this.root.recorder.record(evt.id, 'results', '1', '0', resetMaps);

      const autoNode = evt.activity.node ? this.root.getNode(evt.activity.node) : null;
      if (autoNode) {
        this.root.addDebugNodeToPath(autoNode, false);
        events.push(...this.evaluateNode(autoNode));
      }
    }

    this.performOfferedLinkages();
    return events;
  }

  // ---- text substitution ($text/$value/$pathtime/$seattime/$formattime) ----

  substituteText(text: string, nodeId: string, eventId: string): string {
    if (!text) return text;
    const varText = (id: string): string => {
      const variable = this.requireVariable(id, nodeId, eventId);
      return variable.text;
    };
    const varValue = (id: string): string => {
      const variable = this.requireVariable(id, nodeId, eventId);
      return String(variable.value);
    };
    return text
      .replace(FIND_TEXT, (_, id: string) => varText(id))
      .replace(FIND_VALUE, (_, id: string) => varValue(id))
      .replace(FORMAT_PATHTIME, (_, fmt: string) => formatTimeSpan(fmt, this.root.totalDuration))
      .replace(FORMAT_SEATTIME, (_, fmt: string) => formatTimeSpan(fmt, this.root.seatTime))
      .replace(FORMAT_GENERIC, (_, fmt: string, value: string) => {
        const parsed = Number.parseFloat(value.trim());
        return Number.isNaN(parsed) ? '' : formatTimeSpan(fmt.trim(), parsed);
      });
  }

  private requireVariable(id: string, nodeId: string, eventId: string): Variable {
    const variable = this.root.getVariable(id.trim().toLowerCase());
    if (!variable) {
      throw new Error(`[${nodeId}] Could not find variable: ${id} parsed in the text of event: ${eventId}`);
    }
    return variable;
  }
}
