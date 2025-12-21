import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(configDir, "../..");

const nextConfig: NextConfig = {
  // Both must be set to the same value to avoid Vercel build warning
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    // Bun workspaces install deps at the workspace root; Turbopack needs this
    // to resolve `next` and other packages when multiple lockfiles exist.
    root: workspaceRoot,
  },
};

export default nextConfig;
