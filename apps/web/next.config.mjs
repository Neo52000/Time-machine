import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@time-machine/content-schema",
    "@time-machine/era-engine",
    "@time-machine/timeline-engine",
    "@time-machine/apps-runtime",
    "@time-machine/browser-engine",
    "@time-machine/search-engine",
    "@time-machine/minitel-engine",
    "@time-machine/messenger-engine",
    "@time-machine/media-engine",
    "@time-machine/desktop-engine",
    "@time-machine/window-manager",
  ],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
