"use client";

import Link from "next/link";
import { useState } from "react";
import type { EraManifest } from "@time-machine/content-schema";

const TIMELINE_START_YEAR = 1980;
const TIMELINE_END_YEAR = new Date().getFullYear();
const DECADE_MARKS = [1980, 1990, 2000, 2010, TIMELINE_END_YEAR];

function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}

function positionPercent(year: number): number {
  const span = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
  return ((year - TIMELINE_START_YEAR) / span) * 100;
}

export function HomeTimeline({ eras }: { eras: EraManifest[] }) {
  const [hoveredEraId, setHoveredEraId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-4xl px-4">
      <div className="relative mt-16 h-px w-full bg-neutral-700">
        {DECADE_MARKS.map((year) => (
          <div
            key={year}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${positionPercent(year)}%` }}
          >
            <div className="h-2 w-px bg-neutral-600" />
            <span className="mt-2 text-xs text-neutral-500">
              {year === TIMELINE_END_YEAR ? "TODAY" : year}
            </span>
          </div>
        ))}

        {eras.map((era) => {
          const year = yearOf(era.dateStart);
          const isHovered = hoveredEraId === era.id;
          return (
            <Link
              key={era.id}
              href={`/era/${era.id}/loading`}
              onMouseEnter={() => setHoveredEraId(era.id)}
              onMouseLeave={() => setHoveredEraId(null)}
              onFocus={() => setHoveredEraId(era.id)}
              onBlur={() => setHoveredEraId(null)}
              data-testid={`era-marker-${era.id}`}
              className="absolute top-0 flex -translate-x-1/2 -translate-y-full flex-col items-center pb-3 focus:outline-none"
              style={{ left: `${positionPercent(year)}%` }}
            >
              <span
                className={`whitespace-nowrap text-sm transition-colors ${
                  isHovered ? "text-white" : "text-neutral-400"
                }`}
              >
                {era.label}
              </span>
              <span
                className={`mt-1 text-lg transition-colors ${
                  isHovered ? "text-white" : "text-neutral-600"
                }`}
                aria-hidden
              >
                ▼
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
