import { parseExpression, type ExpressionAst } from './parser';

/**
 * Mirrors RpnParser's IEvaluationData: the conversation supplies identifier
 * values and domain functions (Played, Offered, ...). Ids arrive lowercased.
 * Return undefined for unknown names — the evaluator throws, matching the
 * C# "Unknown identifier/function" errors.
 */
export interface EvaluationData {
  evaluateIdentifier(id: string): number | undefined;
  evaluateFunction(name: string, args: FunctionArg[]): number | undefined;
}

/** A function argument: its numeric value plus, when the argument was a bare
 *  identifier, that identifier (ConversationLogic dispatches on it). */
export interface FunctionArg {
  value: number;
  fieldName?: string;
}

const truthy = (n: number) => n !== 0;
const bool = (b: boolean) => (b ? 1 : 0);

export function evaluateExpression(ast: ExpressionAst, data: EvaluationData): number {
  return evalNode(ast, data);
}

function evalNode(ast: ExpressionAst, data: EvaluationData): number {
  switch (ast.kind) {
    case 'number':
      return ast.value;
    case 'string': {
      // Numeric strings act as numbers (RpnOperand semantics); other strings
      // only participate in equality, which evalBinary handles via NaN.
      const n = Number(ast.value);
      return Number.isNaN(n) ? NaN : n;
    }
    case 'identifier': {
      const id = ast.name.toLowerCase();
      if (id === 'pi') return Math.PI;
      const value = data.evaluateIdentifier(id);
      if (value === undefined) throw new Error(`Unknown identifier: ${ast.name}`);
      return value;
    }
    case 'unary': {
      const v = evalNode(ast.operand, data);
      switch (ast.op) {
        case '-':
          return -v;
        case '+':
          return v;
        case '!':
          return bool(!truthy(v));
      }
      break;
    }
    case 'binary':
      return evalBinary(ast.op, evalNode(ast.left, data), evalNode(ast.right, data));
    case 'ternary':
      return truthy(evalNode(ast.condition, data))
        ? evalNode(ast.whenTrue, data)
        : evalNode(ast.whenFalse, data);
    case 'call':
      return evalCall(ast, data);
  }
  throw new Error('Unreachable expression node');
}

function evalBinary(op: string, l: number, r: number): number {
  switch (op) {
    case '+':
      return l + r;
    case '-':
      return l - r;
    case '*':
      return l * r;
    case '/':
      return l / r;
    case '//':
      return Math.trunc(l / r);
    case '%':
      return l % r;
    case '**':
      return Math.pow(l, r);
    case '==':
      return bool(l === r);
    case '!=':
      return bool(l !== r);
    case '<':
      return bool(l < r);
    case '<=':
      return bool(l <= r);
    case '>':
      return bool(l > r);
    case '>=':
      return bool(l >= r);
    case '&&':
      return bool(truthy(l) && truthy(r));
    case '||':
      return bool(truthy(l) || truthy(r));
    case '&':
      return Math.floor(l) & Math.floor(r);
    case '|':
      return Math.floor(l) | Math.floor(r);
    case '^':
      return Math.floor(l) ^ Math.floor(r);
  }
  throw new Error(`Unsupported operator: ${op}`);
}

function evalCall(ast: ExpressionAst & { kind: 'call' }, data: EvaluationData): number {
  const { name } = ast;
  const args: FunctionArg[] = ast.args.map((arg) => ({
    value: evalNode(arg, data),
    fieldName: arg.kind === 'identifier' ? arg.name.toLowerCase() : undefined,
  }));

  // Built-ins from ExpressionEvaluator.EvalFunction (case-sensitive in C#).
  switch (name) {
    case 'Min':
      requireArgs(name, args, 2);
      return Math.min(args[0]!.value, args[1]!.value);
    case 'Max':
      requireArgs(name, args, 2);
      return Math.max(args[0]!.value, args[1]!.value);
    case 'Approx':
    case 'Approximately': {
      if (args.length !== 2 && args.length !== 3) {
        throw new Error(`Incorrect number of arguments passed to function: ${name}`);
      }
      const tolerance = args.length === 3 ? args[2]!.value : 0.05;
      return bool(Math.abs(args[0]!.value - args[1]!.value) <= tolerance);
    }
  }

  const result = data.evaluateFunction(name, args);
  if (result === undefined) throw new Error(`Unknown function: ${name}`);
  return result;
}

function requireArgs(name: string, args: FunctionArg[], count: number): void {
  if (args.length !== count) {
    throw new Error(`Incorrect number of arguments passed to function: ${name}`);
  }
}

/**
 * Mirrors Konverse Expression.cs: a possibly-empty condition string.
 * Empty/missing expressions evaluate to 1; "met" means result > 0.01.
 */
export class CompiledExpression {
  readonly source: string | undefined;
  private ast: ExpressionAst | null;

  constructor(expression: string | undefined | null) {
    this.source = expression ?? undefined;
    this.ast = expression && expression.trim() !== '' ? parseExpression(expression) : null;
  }

  evaluate(data: EvaluationData): number {
    if (!this.ast) return 1;
    return evaluateExpression(this.ast, data);
  }

  isMet(data: EvaluationData): boolean {
    return this.evaluate(data) > 0.01;
  }
}
