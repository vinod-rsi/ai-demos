/**
 * Tokenizer for Konverse infix expressions, matching the token set of
 * RpnParser.MathParser: numbers, string literals, identifiers (which may
 * contain digits, underscores and dots, e.g. node_a00_1), operators,
 * parentheses, commas, and ?: conditionals.
 */

export type TokenKind =
  | 'number'
  | 'string'
  | 'identifier'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'question'
  | 'colon';

export interface Token {
  kind: TokenKind;
  text: string;
  value?: number;
}

const TWO_CHAR_OPS = new Set(['||', '&&', '==', '!=', '<=', '>=', '<>', '//', '**']);
const ONE_CHAR_OPS = new Set(['+', '-', '*', '/', '%', '<', '>', '=', '!', '|', '&', '^']);

export function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expression.length;

  while (i < n) {
    const ch = expression[i]!;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen', text: ch });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', text: ch });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma', text: ch });
      i++;
      continue;
    }
    if (ch === '?') {
      tokens.push({ kind: 'question', text: ch });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ kind: 'colon', text: ch });
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let text = '';
      while (j < n) {
        if (expression[j] === quote) {
          if (expression[j + 1] === quote) {
            text += quote; // doubled delimiter escapes itself
            j += 2;
            continue;
          }
          break;
        }
        text += expression[j];
        j++;
      }
      if (j >= n) throw new Error(`Unterminated string literal in: ${expression}`);
      tokens.push({ kind: 'string', text });
      i = j + 1;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(expression[j]!)) j++;
      const text = expression.slice(i, j);
      const value = Number(text);
      if (Number.isNaN(value)) throw new Error(`Invalid number "${text}" in: ${expression}`);
      tokens.push({ kind: 'number', text, value });
      i = j;
      continue;
    }

    if (/[A-Za-z_#]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_.#]/.test(expression[j]!)) j++;
      tokens.push({ kind: 'identifier', text: expression.slice(i, j) });
      i = j;
      continue;
    }

    const two = expression.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ kind: 'operator', text: two === '<>' ? '!=' : two });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(ch)) {
      // bare '=' is equality in this grammar
      tokens.push({ kind: 'operator', text: ch === '=' ? '==' : ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${ch}" in expression: ${expression}`);
  }

  return tokens;
}
