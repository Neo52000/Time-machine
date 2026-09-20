import { cpSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// This config always runs from the repo root (`pnpm exec playwright test`),
// so `process.cwd()` is the repo root — simpler than `import.meta.url`,
// which Playwright's config loader evaluates as CommonJS.
const repoRoot = process.cwd();

// Some sandboxes pre-install a fixed Chromium revision under a well-known
// path instead of the one matching the pinned @playwright/test version.
// Prefer it when present; CI installs its own matching browser via
// `playwright install` and won't have this path, so it falls through to
// Playwright's default resolution there.
const sandboxChromium = "/opt/pw-browsers/chromium";
const executablePath = existsSync(sandboxChromium) ? sandboxChromium : undefined;

// apps/admin writes to its content root — never point it at the real
// content/ tree during e2e. Copy it once into a throwaway directory and
// point the admin dev server at that copy via TIME_MACHINE_CONTENT_ROOT.
const adminContentFixture = mkdtempSync(path.join(tmpdir(), "time-machine-admin-e2e-"));
cpSync(path.join(repoRoot, "content"), adminContentFixture, { recursive: true });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @time-machine/web dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @time-machine/admin dev",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { TIME_MACHINE_CONTENT_ROOT: adminContentFixture },
    },
  ],
  projects: [
    {
      name: "web",
      testIgnore: ["**/admin/**"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
        launchOptions: executablePath ? { executablePath } : undefined,
      },
    },
    {
      name: "admin",
      testMatch: ["**/admin/**"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        launchOptions: executablePath ? { executablePath } : undefined,
      },
    },
  ],
});
