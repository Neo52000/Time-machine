/**
 * Browser history — pure, immutable, so the Time Browser's back/forward
 * behaviour is testable without React. Navigating from the middle of the
 * stack discards the forward entries, like every browser since Mosaic.
 */
export interface BrowserHistory {
  entries: string[];
  index: number;
}

export function createBrowserHistory(initialUrl: string): BrowserHistory {
  return { entries: [initialUrl], index: 0 };
}

export function currentUrl(history: BrowserHistory): string {
  return history.entries[history.index] ?? "";
}

export function canGoBack(history: BrowserHistory): boolean {
  return history.index > 0;
}

export function canGoForward(history: BrowserHistory): boolean {
  return history.index < history.entries.length - 1;
}

export function navigateTo(history: BrowserHistory, url: string): BrowserHistory {
  if (url === currentUrl(history)) return history;
  const entries = [...history.entries.slice(0, history.index + 1), url];
  return { entries, index: entries.length - 1 };
}

export function goBack(history: BrowserHistory): BrowserHistory {
  return canGoBack(history) ? { ...history, index: history.index - 1 } : history;
}

export function goForward(history: BrowserHistory): BrowserHistory {
  return canGoForward(history) ? { ...history, index: history.index + 1 } : history;
}
