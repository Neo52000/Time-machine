/**
 * Text normalisation shared by indexing and querying: lowercase, strip
 * accents ("réseau" → "reseau"), split on anything that is not a letter or
 * digit, drop very short tokens and a small French/English stop-word list.
 */
const STOPWORDS = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "et",
  "ou",
  "en",
  "au",
  "aux",
  "sur",
  "pour",
  "par",
  "dans",
  "avec",
  "sans",
  "ce",
  "ces",
  "cet",
  "cette",
  "son",
  "sa",
  "ses",
  "que",
  "qui",
  "est",
  "sont",
  "pas",
  "plus",
  "the",
  "a",
  "an",
  "of",
  "and",
  "or",
  "in",
  "on",
  "to",
  "for",
  "is",
  "are",
  "at",
  "by",
  "with",
]);

export function normalizeText(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}
