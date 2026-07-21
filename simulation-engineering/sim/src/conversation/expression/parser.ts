import { tokenize, type Token } from './lexer';

/**
 * Recursive-descent parser producing an AST with the same operator
 * precedence as RpnParser.MathParser. Notable quirks preserved from the C#
 * implementation:
 *   - `&&` and `||` share ONE precedence level (left-associative), unlike
 *     most languages.
 *   - `|`, `^`, `&` share one level; all comparisons share one level.
 *   - `=` means equality; `<>` means not-equal.
 *   - `**` is right-associative.
 */

export type ExpressionAst =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'identifier'; name: string }
  | { kind: 'unary'; op: '!' | '-' | '+'; operand: ExpressionAst }
  | { kind: 'binary'; op: string; left: ExpressionAst; right: ExpressionAst }
  | { kind: 'ternary'; condition: ExpressionAst; whenTrue: ExpressionAst; whenFalse: ExpressionAst }
  | { kind: 'call'; name: string; args: ExpressionAst[] };

/** Binary precedence tiers, lowest first (from MathParser's precedence table). */
const BINARY_TIERS: string[][] = [
  ['||', '&&'],
  ['|', '^', '&'],
  ['==', '!=', '<', '<=', '>', '>='],
  ['+', '-'],
  ['*', '/', '//', '%'],
];

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private source: string,
  ) {}

  parse(): ExpressionAst {
    const ast = this.parseTernary();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token "${this.peek()!.text}" in expression: ${this.source}`);
    }
    return ast;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private take(): Token {
    const tok = this.tokens[this.pos++];
    if (!tok) throw new Error(`Unexpected end of expression: ${this.source}`);
    return tok;
  }

  private parseTernary(): ExpressionAst {
    const condition = this.parseBinary(0);
    if (this.peek()?.kind !== 'question') return condition;
    this.take();
    const whenTrue = this.parseTernary();
    if (this.peek()?.kind !== 'colon') {
      throw new Error(`Missing ":" in conditional expression: ${this.source}`);
    }
    this.take();
    const whenFalse = this.parseTernary();
    return { kind: 'ternary', condition, whenTrue, whenFalse };
  }

  private parseBinary(tier: number): ExpressionAst {
    if (tier >= BINARY_TIERS.length) return this.parseExponent();
    const ops = BINARY_TIERS[tier]!;
    let left = this.parseBinary(tier + 1);
    while (true) {
      const tok = this.peek();
      if (tok?.kind !== 'operator' || !ops.includes(tok.text)) break;
      this.take();
      const right = this.parseBinary(tier + 1);
      left = { kind: 'binary', op: tok.text, left, right };
    }
    return left;
  }

  /** `**` binds tighter than * / and is right-associative. */
  private parseExponent(): ExpressionAst {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok?.kind === 'operator' && tok.text === '**') {
      this.take();
      return { kind: 'binary', op: '**', left: base, right: this.parseExponent() };
    }
    return base;
  }

  private parseUnary(): ExpressionAst {
    const tok = this.peek();
    if (tok?.kind === 'operator' && (tok.text === '!' || tok.text === '-' || tok.text === '+')) {
      this.take();
      return { kind: 'unary', op: tok.text, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionAst {
    const tok = this.take();
    switch (tok.kind) {
      case 'number':
        return { kind: 'number', value: tok.value! };
      case 'string':
        return { kind: 'string', value: tok.text };
      case 'lparen': {
        const inner = this.parseTernary();
        const close = this.take();
        if (close.kind !== 'rparen') {
          throw new Error(`Unmatched parentheses in expression: ${this.source}`);
        }
        return inner;
      }
      case 'identifier': {
        if (this.peek()?.kind === 'lparen') {
          this.take();
          const args: ExpressionAst[] = [];
          if (this.peek()?.kind !== 'rparen') {
            args.push(this.parseTernary());
            while (this.peek()?.kind === 'comma') {
              this.take();
              args.push(this.parseTernary());
            }
          }
          const close = this.take();
          if (close.kind !== 'rparen') {
            throw new Error(`Unmatched parentheses in call to ${tok.text}: ${this.source}`);
          }
          return { kind: 'call', name: tok.text, args };
        }
        return { kind: 'identifier', name: tok.text };
      }
      default:
        throw new Error(`Unexpected token "${tok.text}" in expression: ${this.source}`);
    }
  }
}

export function parseExpression(expression: string): ExpressionAst {
  return new Parser(tokenize(expression), expression).parse();
}

/** Walks an AST, visiting every sub-expression. Used by the validator. */
export function walkExpression(ast: ExpressionAst, visit: (node: ExpressionAst) => void): void {
  visit(ast);
  switch (ast.kind) {
    case 'unary':
      walkExpression(ast.operand, visit);
      break;
    case 'binary':
      walkExpression(ast.left, visit);
      walkExpression(ast.right, visit);
      break;
    case 'ternary':
      walkExpression(ast.condition, visit);
      walkExpression(ast.whenTrue, visit);
      walkExpression(ast.whenFalse, visit);
      break;
    case 'call':
      for (const arg of ast.args) walkExpression(arg, visit);
      break;
  }
}
