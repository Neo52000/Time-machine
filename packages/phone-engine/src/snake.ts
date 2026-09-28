/**
 * Serpentin — the store's game. Pure: the UI owns the timer and the random
 * source, so every rule is unit-tested without waiting.
 */
export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  x: number;
  y: number;
}

export interface SnakeState {
  cols: number;
  rows: number;
  /** Head first. */
  body: Cell[];
  direction: Direction;
  /** Applied on the next step, so two quick turns cannot fold the snake onto itself. */
  queued: Direction;
  food: Cell;
  score: number;
  over: boolean;
}

export type Random = () => number;

const MOVES: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** A free cell picked with `random`, or undefined when the board is full. */
function placeFood(body: Cell[], cols: number, rows: number, random: Random): Cell | undefined {
  const free: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!body.some((c) => c.x === x && c.y === y)) free.push({ x, y });
    }
  }
  return free[Math.floor(random() * free.length)];
}

export function createSnake(cols: number, rows: number, random: Random = Math.random): SnakeState {
  if (cols < 5 || rows < 5) throw new Error("The board needs at least 5 × 5 cells");
  const y = Math.floor(rows / 2);
  const body = [
    { x: 2, y },
    { x: 1, y },
    { x: 0, y },
  ];
  return {
    cols,
    rows,
    body,
    direction: "right",
    queued: "right",
    food: placeFood(body, cols, rows, random)!,
    score: 0,
    over: false,
  };
}

/** Queues a turn; reversing onto the neck is ignored. */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.over || direction === OPPOSITE[state.direction]) return state;
  return { ...state, queued: direction };
}

/** One move. Walls and the snake's own body end the game. */
export function stepSnake(state: SnakeState, random: Random = Math.random): SnakeState {
  if (state.over) return state;
  const direction = state.queued;
  const move = MOVES[direction];
  const head = { x: state.body[0]!.x + move.x, y: state.body[0]!.y + move.y };
  const eats = same(head, state.food);
  // The tail moves away this step unless the snake grows.
  const rest = eats ? state.body : state.body.slice(0, -1);
  const outside = head.x < 0 || head.y < 0 || head.x >= state.cols || head.y >= state.rows;
  if (outside || rest.some((c) => same(c, head))) {
    return { ...state, direction, over: true };
  }
  const body = [head, ...rest];
  if (!eats) return { ...state, body, direction };
  const food = placeFood(body, state.cols, state.rows, random);
  return {
    ...state,
    body,
    direction,
    score: state.score + 1,
    food: food ?? state.food,
    over: food === undefined,
  };
}
