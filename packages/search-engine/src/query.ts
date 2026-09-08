import { normalizeText, tokenize } from "./tokenize";

/**
 * 1990s search syntax, as AltaVista popularised it:
 *   +word    the word is required
 *   -word    the word is excluded
 *   "a b c"  exact phrase
 *   word     optional; more matches rank higher
 */
export interface ParsedQuery {
  raw: string;
  required: string[];
  excluded: string[];
  optional: string[];
  phrases: string[];
  /** True when nothing searchable was typed. */
  empty: boolean;
}

export function parseQuery(raw: string): ParsedQuery {
  const required: string[] = [];
  const excluded: string[] = [];
  const optional: string[] = [];
  const phrases: string[] = [];

  let rest = raw;
  rest = rest.replace(/"([^"]+)"/g, (_m, phrase: string) => {
    const normalized = normalizeText(phrase).replace(/\s+/g, " ").trim();
    if (normalized) phrases.push(normalized);
    return " ";
  });

  for (const piece of rest.split(/\s+/)) {
    if (!piece) continue;
    const sign = piece[0];
    const body = sign === "+" || sign === "-" ? piece.slice(1) : piece;
    const tokens = tokenize(body);
    if (sign === "+") required.push(...tokens);
    else if (sign === "-") excluded.push(...tokens);
    else optional.push(...tokens);
  }

  return {
    raw,
    required,
    excluded,
    optional,
    phrases,
    empty: required.length === 0 && optional.length === 0 && phrases.length === 0,
  };
}
