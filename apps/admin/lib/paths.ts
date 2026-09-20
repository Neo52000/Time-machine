import path from "node:path";

/**
 * `apps/admin` is always run from its own directory (`pnpm --filter
 * @time-machine/admin dev|build|start`, same as `apps/web`), so
 * `process.cwd()` is a stable anchor for the monorepo root — unlike
 * `import.meta.url`, which would resolve inside the Next.js server bundle
 * after a build, not the source tree.
 *
 * `TIME_MACHINE_CONTENT_ROOT` overrides this — e2e tests point it at a
 * throwaway copy of `content/` so a test run never writes into the real
 * seed data (see root `playwright.config.ts`).
 */
export const CONTENT_ROOT = process.env.TIME_MACHINE_CONTENT_ROOT
  ? path.resolve(process.env.TIME_MACHINE_CONTENT_ROOT)
  : path.join(process.cwd(), "..", "..", "content");
