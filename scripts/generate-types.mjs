/**
 * Regenerates src/types/database.types.ts from the local Supabase database.
 *
 * Run with:  npm run gen:types
 *
 * The CLI writes to stdout, so the output is piped through a UTF-8 encoder.
 * A plain `>` redirect under Windows PowerShell 5.1 produces UTF-16LE, which
 * ESLint then rejects as a binary file.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src", "types", "database.types.ts");

const child = spawn(
  "npx",
  ["--yes", "supabase@latest", "gen", "types", "typescript", "--local"],
  { cwd: root, shell: true },
);

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  stdout += chunk;
});
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

child.on("close", (code) => {
  // The CLI prints progress to stderr and the types to stdout.
  const types = stdout.replace(/^﻿/, "").trimStart();

  if (!types.includes("export type Json")) {
    console.error("Did not receive TypeScript definitions.");
    console.error(stderr);
    process.exit(1);
  }

  writeFileSync(outFile, types, "utf8");
  console.log(`Wrote ${outFile} (${types.length} bytes, utf-8)`);
  process.exit(code === 0 ? 0 : 1);
});
