"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  createSnake,
  stepSnake,
  turn,
  type Direction,
  type SnakeState,
} from "@time-machine/phone-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import type { PhoneAppProps } from "../types";

const COLS = 15;
const ROWS = 18;
const STEP_MS = 170;
/** Score that earns the passport stamp. */
export const SERPENTIN_GOAL = 5;
const SWIPE_PX = 18;

const KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Serpentin: the store's game. Swipe, the arrow pad or the keyboard to turn. */
export function SerpentinApp(_props: PhoneAppProps) {
  const [game, setGame] = useState<SnakeState>(() => createSnake(COLS, ROWS));
  const [playing, setPlaying] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const rewarded = useRef(false);
  const audio = useAudio();
  const { emit } = useNarrative();

  useEffect(() => {
    if (!playing || game.over) return;
    const id = window.setInterval(() => setGame((g) => stepSnake(g)), STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, game.over]);

  useEffect(() => {
    if (game.over) audio.play("error");
  }, [game.over, audio]);

  useEffect(() => {
    if (game.score >= SERPENTIN_GOAL && !rewarded.current) {
      rewarded.current = true;
      emit("service.opened", { kiosk: "game", service: `serpentin-${SERPENTIN_GOAL}` });
    }
  }, [game.score, emit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const direction = KEYS[e.key];
      if (!direction) return;
      e.preventDefault();
      setGame((g) => turn(g, direction));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const restart = () => {
    setGame(createSnake(COLS, ROWS));
    setPlaying(true);
  };

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    const direction: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    setGame((g) => turn(g, direction));
  };

  const cells = new Map<string, string>();
  game.body.forEach((c, i) => cells.set(`${c.x},${c.y}`, i === 0 ? "head" : "body"));
  cells.set(`${game.food.x},${game.food.y}`, "food");

  return (
    <div className="ph-snake">
      <div className="ph-appbar">
        <strong>Serpentin</strong>
        <span data-testid="serpentin-score">Score : {game.score}</span>
      </div>
      <div
        className="ph-snake-board"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={`Plateau de jeu, score ${game.score}`}
        data-testid="serpentin-board"
        data-state={game.over ? "over" : playing ? "playing" : "ready"}
      >
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const kind = cells.get(`${i % COLS},${Math.floor(i / COLS)}`);
          return <span key={i} className={kind ? `ph-cell ph-cell-${kind}` : "ph-cell"} />;
        })}
        {(!playing || game.over) && (
          <div className="ph-snake-overlay">
            <p>
              {game.over
                ? `Perdu ! Score : ${game.score}`
                : `Mangez ${SERPENTIN_GOAL} pastilles pour gagner un tampon.`}
            </p>
            <button
              type="button"
              className="ph-btn"
              onClick={restart}
              data-testid="serpentin-start"
            >
              {game.over ? "Rejouer" : "Jouer"}
            </button>
          </div>
        )}
      </div>
      <div className="ph-pad" aria-label="Direction">
        {(["up", "left", "right", "down"] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={`ph-pad-${d}`}
            aria-label={{ up: "Haut", down: "Bas", left: "Gauche", right: "Droite" }[d]}
            onClick={() => setGame((g) => turn(g, d))}
            data-testid={`serpentin-${d}`}
          >
            {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
          </button>
        ))}
      </div>
    </div>
  );
}
