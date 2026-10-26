#!/usr/bin/env node
// Creates a video project from the bundled template.
//
//   node <skill-dir>/scripts/init.mjs ./video          (refuses to overwrite a non-empty folder)
//   node <skill-dir>/scripts/init.mjs ./video --force
//
// Then, inside the new folder: npm install && npx playwright install chromium
// (On Windows, run npm in PowerShell or cmd if Git Bash fails with "'node' is not recognized".)
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.resolve(here, "../assets/template");
const argv = process.argv.slice(2);
const target = path.resolve(argv.find((a) => !a.startsWith("--")) || "video");
const force = argv.includes("--force");

if (existsSync(target) && readdirSync(target).length && !force) {
  console.error(`${target} is not empty. Pick another folder, or pass --force to copy over it.`);
  process.exit(1);
}

cpSync(template, target, { recursive: true, filter: (src) => !/[\\/](node_modules|out)([\\/]|$)/.test(src) });
// Dotfiles are stored without the dot so every packaging route keeps them.
for (const [from, to] of [["gitignore.txt", ".gitignore"], ["env.example.txt", ".env.example"]]) {
  const f = path.join(target, from);
  if (existsSync(f)) renameSync(f, path.join(target, to));
}
mkdirSync(path.join(target, "public", "rec"), { recursive: true });

const rel = path.relative(process.cwd(), target) || ".";
console.log(`Created ${rel}

Next:
  cd ${rel}
  npm install
  npx playwright install chromium
  npx remotion studio src/index.ts      (preview the example video)
`);
