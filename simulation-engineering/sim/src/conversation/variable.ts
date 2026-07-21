import type { RawVariable, RawVariableGate } from '../content/types';
import type { ChangeRecorder } from './history';

/** Port of Runtime/Properties/VariableGate.cs */
export class VariableGate {
  readonly targetId: string;
  readonly operand: '<' | '<=' | '>' | '>=';
  readonly trigger: number;
  readonly repeat: boolean;
  /** Whether evaluation continues after the gate jump. */
  readonly returns: boolean;
  private disabled = false;

  constructor(
    raw: RawVariableGate,
    private recorder: ChangeRecorder,
  ) {
    this.targetId = raw.target.toLowerCase();
    this.operand = raw.operand;
    this.trigger = raw.trigger;
    this.repeat = raw.repeat ?? false;
    this.returns = raw.return ?? false;
  }

  /** Threshold-crossing check, transliterated from VariableGate.PassesThreshold. */
  passesThreshold(oldValue: number, newValue: number): boolean {
    if (this.disabled) return false;
    const canStartEqual = this.operand === '<' || this.operand === '>';
    const less = this.operand === '<' || this.operand === '<=';
    const equal = this.operand === '<=' || this.operand === '>=';

    const wasEqual = oldValue === this.trigger;
    const wasHigher = oldValue > this.trigger;
    const wasLower = oldValue < this.trigger;
    const isLower = newValue < this.trigger;
    const isHigher = newValue > this.trigger;
    const isEqual = newValue === this.trigger;

    const equalityCheck = isEqual && equal;
    if (less) {
      return (wasHigher || (canStartEqual && wasEqual)) && (isLower || equalityCheck);
    }
    return (wasLower || (canStartEqual && wasEqual)) && (isHigher || equalityCheck);
  }

  trigger_(): void {
    if (!this.disabled && !this.repeat) {
      const restore = () => {
        this.disabled = false;
      };
      this.recorder.record('gate_' + this.targetId, 'disabled', false, true, restore);
      this.disabled = true;
    }
  }
}

/** Port of Runtime/Properties/Variable.cs */
export class Variable {
  readonly id: string;
  readonly lowerId: string;
  readonly name: string;
  value: number;
  readonly min: number;
  readonly max: number;
  text: string;
  readonly defaultText: string;
  readonly resetText: boolean;
  readonly meter: boolean;
  readonly tracked: boolean;
  readonly importStartingValue: boolean;
  readonly exportEndingValue: boolean;
  readonly gates: VariableGate[];

  constructor(
    raw: RawVariable,
    text: string,
    private recorder: ChangeRecorder,
  ) {
    this.id = raw.id;
    this.lowerId = raw.id.toLowerCase();
    this.name = raw.name ?? raw.id;
    this.value = raw.value ?? 0;
    let min = raw.min ?? 0;
    let max = raw.max ?? 0;
    if (min === 0 && max === 0) {
      min = Number.MIN_SAFE_INTEGER;
      max = Number.MAX_SAFE_INTEGER;
    }
    this.min = min;
    this.max = max;
    this.text = text;
    this.defaultText = text;
    this.resetText = raw.reset_text ?? raw['reset-text'] ?? false;
    this.meter = raw.meter ?? false;
    this.tracked = raw.tracked ?? false;
    this.importStartingValue = raw.import_starting_value ?? false;
    this.exportEndingValue = raw.export_ending_value ?? false;
    this.gates = (raw.gates ?? []).map((g) => new VariableGate(g, recorder));
  }

  /** Clamps, journals, and returns the first gate whose threshold was crossed. */
  update(value: number): VariableGate | null {
    if (value < this.min) value = this.min;
    else if (value > this.max) value = this.max;

    const oldValue = this.value;
    this.recorder.record(this.id, 'value', oldValue, value, () => {
      this.value = oldValue;
    });

    let triggered: VariableGate | null = null;
    for (const gate of this.gates) {
      if (gate.passesThreshold(this.value, value)) {
        gate.trigger_();
        triggered = gate;
        break;
      }
    }
    this.value = value;
    return triggered;
  }

  setText(text: string): void {
    const oldText = this.text;
    this.recorder.record(this.id, 'text', oldText, text, () => {
      this.text = oldText;
    });
    this.text = text;
  }
}
