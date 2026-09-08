"use client";

import { useState, type FormEvent } from "react";
import type { PageBlock, ReconstructedPage } from "@time-machine/content-schema";
import type { SearchProvider, SearchResponse } from "@time-machine/search-engine";

export interface SearchResultsData {
  response: SearchResponse;
  provider: SearchProvider;
}

interface Props {
  page: ReconstructedPage;
  query: Record<string, string>;
  /** Present when the page carries a `search-results` block and a query was given. */
  searchResults?: SearchResultsData;
  /** Navigate to an href (absolute historical URL or same-site path). */
  onNavigate: (href: string) => void;
}

/**
 * Renders a declarative reconstruction. Blocks map to React elements only:
 * there is no HTML string, no dangerouslySetInnerHTML, no script, so a
 * content file can never execute anything in the visitor's browser.
 */
export function ReconstructedPageView({ page, query, searchResults, onNavigate }: Props) {
  return (
    <div
      className={`tw-page tw-style-${page.style}`}
      data-testid="reconstruction"
      data-page-id={page.id}
    >
      {page.blocks.map((block, i) => (
        <Block
          key={i}
          block={block}
          query={query}
          searchResults={searchResults}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function Block({
  block,
  query,
  searchResults,
  onNavigate,
}: { block: PageBlock } & Omit<Props, "page">) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as const;
      return <Tag className="tw-heading">{block.text}</Tag>;
    }
    case "paragraph":
      return <p className="tw-paragraph">{block.text}</p>;
    case "notice":
      return <p className="tw-notice">{block.text}</p>;
    case "divider":
      return <hr className="tw-divider" />;
    case "list":
      return (
        <ul className="tw-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "links":
      return (
        <div className="tw-links">
          {block.title && <h3 className="tw-heading">{block.title}</h3>}
          <ul className={block.layout === "columns" ? "tw-links-columns" : "tw-links-list"}>
            {block.items.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <a
                  href={link.href}
                  className="tw-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(link.href);
                  }}
                >
                  {link.label}
                </a>
                {link.description && <span className="tw-link-desc"> — {link.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    case "search-form":
      return (
        <SearchForm
          action={block.action}
          paramName={block.paramName}
          placeholder={block.placeholder}
          buttonLabel={block.buttonLabel}
          initial={query[block.paramName] ?? ""}
          onNavigate={onNavigate}
        />
      );
    case "search-results": {
      const q = query[block.paramName] ?? "";
      return (
        <SearchResults
          heading={block.template.replace("{query}", q)}
          query={q}
          data={searchResults}
          onNavigate={onNavigate}
        />
      );
    }
  }
}

function SearchForm(props: {
  action: string;
  paramName: string;
  placeholder?: string;
  buttonLabel: string;
  initial: string;
  onNavigate: (href: string) => void;
}) {
  const [value, setValue] = useState(props.initial);
  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ [props.paramName]: value.trim() });
    props.onNavigate(`${props.action}?${params.toString()}`);
  }
  return (
    <form className="tw-search" onSubmit={submit} data-testid="page-search-form">
      <input
        className="tw-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={props.placeholder}
        aria-label={props.placeholder ?? "Recherche"}
        data-testid="page-search-input"
      />
      <button type="submit" className="tw-button">
        {props.buttonLabel}
      </button>
    </form>
  );
}

function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Results come from the Time Search index at the machine's date, so a site
 * that did not exist yet simply never appears. Each hit navigates back
 * through the Browser Engine.
 */
function SearchResults({
  heading,
  query,
  data,
  onNavigate,
}: {
  heading: string;
  query: string;
  data?: SearchResultsData;
  onNavigate: (href: string) => void;
}) {
  if (!query.trim()) {
    return (
      <p className="tw-results" data-testid="search-results" data-count="0">
        Tapez un ou plusieurs mots-clés.
      </p>
    );
  }
  const hits = data?.response.hits ?? [];
  const total = data?.response.total ?? 0;
  return (
    <div data-testid="search-results" data-count={total}>
      <p className="tw-results">{heading}</p>
      {hits.length === 0 ? (
        <p className="tw-paragraph" data-testid="search-empty">
          Aucun résultat pour « {query} » à la date du{" "}
          {data ? frDate(data.response.selectedDate) : "?"}. Le Time Web ne connaît que ce qui
          existait à cette date.
        </p>
      ) : (
        <ol className="tw-hits">
          {hits.map((hit) => (
            <li key={hit.document.id} className="tw-hit" data-testid={`hit-${hit.document.id}`}>
              <a
                href={hit.document.url ?? "#"}
                className="tw-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (hit.document.url) onNavigate(hit.document.url);
                }}
              >
                {hit.document.title}
              </a>
              <div className="tw-hit-snippet">{hit.snippet}</div>
              <div className="tw-hit-meta">
                {hit.document.url} — en ligne depuis le {frDate(hit.document.availableFrom)}
              </div>
            </li>
          ))}
        </ol>
      )}
      {data && (
        <p className="tw-notice">
          {total} résultat(s) — {data.provider.label} : {data.provider.tagline}
        </p>
      )}
    </div>
  );
}
