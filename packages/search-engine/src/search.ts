import { isAvailableAt, type SearchDocument } from "@time-machine/content-schema";
import { parseQuery, type ParsedQuery } from "./query";
import { normalizeText, tokenize } from "./tokenize";

/**
 * Time Search — an inverted index over `SearchDocument`s with a hard
 * temporal filter: a document is a candidate only if it was available on
 * the selected date (`isAvailableAt`). Ranking is deliberately simple and
 * explainable, in the spirit of 1990s engines: term frequency weighted by
 * field (title > keywords > description), a bonus for covering more of the
 * query, and a bonus for exact phrases.
 */
type Field = "title" | "keywords" | "description";

const FIELD_WEIGHT: Record<Field, number> = { title: 3, keywords: 2, description: 1 };
const PHRASE_BONUS = 4;
const COVERAGE_BONUS = 2;

interface Posting {
  title: number;
  keywords: number;
  description: number;
}

interface IndexedDocument {
  document: SearchDocument;
  /** Normalised full text used for phrase matching. */
  text: string;
}

export interface SearchIndex {
  documents: IndexedDocument[];
  postings: Map<string, Map<string, Posting>>;
}

export interface SearchHit {
  document: SearchDocument;
  score: number;
  snippet: string;
  matchedTerms: string[];
}

export interface SearchOptions {
  query: string;
  /** ISO date (YYYY-MM-DD) the machine is at; documents outside their window are invisible. */
  selectedDate: string;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  query: ParsedQuery;
  selectedDate: string;
  hits: SearchHit[];
  total: number;
}

function fieldText(doc: SearchDocument, field: Field): string {
  if (field === "title") return doc.title;
  if (field === "keywords") return doc.keywords.join(" ");
  return doc.description ?? "";
}

export function createSearchIndex(docs: SearchDocument[]): SearchIndex {
  const postings = new Map<string, Map<string, Posting>>();
  const seen = new Set<string>();
  const documents: IndexedDocument[] = [];

  for (const document of docs) {
    if (seen.has(document.id)) throw new Error(`Duplicate search document id "${document.id}"`);
    seen.add(document.id);
    for (const field of ["title", "keywords", "description"] as const) {
      for (const token of tokenize(fieldText(document, field))) {
        let perDoc = postings.get(token);
        if (!perDoc) {
          perDoc = new Map();
          postings.set(token, perDoc);
        }
        const posting = perDoc.get(document.id) ?? { title: 0, keywords: 0, description: 0 };
        posting[field] += 1;
        perDoc.set(document.id, posting);
      }
    }
    documents.push({
      document,
      text: normalizeText(
        [document.title, document.description ?? "", document.keywords.join(" ")].join(" "),
      ).replace(/\s+/g, " "),
    });
  }
  return { documents, postings };
}

function termScore(posting: Posting): number {
  let score = 0;
  for (const field of ["title", "keywords", "description"] as const) {
    if (posting[field] > 0) score += FIELD_WEIGHT[field] * (1 + Math.log(posting[field]));
  }
  return score;
}

function snippetOf(doc: SearchDocument, maxLength = 160): string {
  const base = doc.description?.trim() || doc.keywords.join(", ");
  return base.length > maxLength ? `${base.slice(0, maxLength - 1).trimEnd()}…` : base;
}

export function search(index: SearchIndex, options: SearchOptions): SearchResponse {
  const query = parseQuery(options.query);
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  const empty: SearchResponse = { query, selectedDate: options.selectedDate, hits: [], total: 0 };
  if (query.empty) return empty;

  const scored: SearchHit[] = [];
  for (const { document, text } of index.documents) {
    if (!isAvailableAt(document, options.selectedDate)) continue;

    const postingOf = (term: string) => index.postings.get(term)?.get(document.id);

    if (query.excluded.some((term) => postingOf(term))) continue;
    if (query.required.some((term) => !postingOf(term))) continue;
    if (query.phrases.some((phrase) => !text.includes(phrase))) continue;

    let score = 0;
    const matched: string[] = [];
    for (const term of [...query.required, ...query.optional]) {
      const posting = postingOf(term);
      if (!posting) continue;
      score += termScore(posting);
      matched.push(term);
    }
    const termCount = query.required.length + query.optional.length;
    if (termCount > 0 && matched.length === 0) continue;
    if (termCount > 0) score += COVERAGE_BONUS * (matched.length / termCount);
    score += PHRASE_BONUS * query.phrases.length;

    scored.push({
      document,
      score,
      snippet: snippetOf(document),
      matchedTerms: [...new Set(matched)],
    });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title, "fr"),
  );
  return {
    query,
    selectedDate: options.selectedDate,
    hits: scored.slice(offset, offset + limit),
    total: scored.length,
  };
}
