#!/usr/bin/env node
import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the compiled TypeScript code
import("../dist/cli/index.js").catch((err) => {
  console.error("Failed to load CLI:", err);
  process.exit(1);
});
