// Shared helpers for the video tools: finding ffmpeg, running it, reading .env, small fs utilities.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const EXE = process.platform === "win32" ? ".exe" : "";

function onPath(name) {
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name + EXE);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// Remotion ships ffmpeg/ffprobe inside its per-platform compositor package
// (e.g. @remotion/compositor-win32-x64-msvc). It lacks a few filters but covers everything we need.
function remotionBinary(name) {
  const base = path.resolve("node_modules", "@remotion");
  if (!existsSync(base)) return null;
  for (const dir of readdirSync(base)) {
    if (!dir.startsWith("compositor-")) continue;
    const candidate = path.join(base, dir, name + EXE);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function locate(name, envVar) {
  const found = process.env[envVar] || onPath(name) || remotionBinary(name);
  if (!found) {
    throw new Error(
      `${name} not found. Run "npm install" in the video project (Remotion ships ${name}), install it system-wide, or set ${envVar}.`,
    );
  }
  return found;
}

export const ffmpegPath = () => locate("ffmpeg", "FFMPEG");
export const ffprobePath = () => locate("ffprobe", "FFPROBE");

/** Runs a binary and returns { stdout, stderr }. Throws with the tail of stderr on failure. */
export function run(bin, args, { allowFail = false } = {}) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0 && !allowFail) {
    const tail = (r.stderr || "").trim().split("\n").slice(-8).join("\n");
    throw new Error(`${path.basename(bin)} exited with ${r.status}:\n${tail}`);
  }
  return { stdout: r.stdout || "", stderr: r.stderr || "", status: r.status };
}

/** Integrated loudness (LUFS), true peak (dBTP) and loudness range of a file's audio. */
export function loudness(file) {
  const { stderr } = run(ffmpegPath(), ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"], {
    allowFail: true,
  });
  const json = stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
  if (!json) return null;
  const d = JSON.parse(json);
  return { lufs: Number(d.input_i), truePeak: Number(d.input_tp), range: Number(d.input_lra) };
}

/** Normalises speech to a target loudness (two-pass loudnorm, linear, so the voice keeps its dynamics). */
export function normalizeVoice(input, output, target = -16) {
  const first = loudnessRaw(input, target);
  const filter = first
    ? `loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${first.input_i}:measured_TP=${first.input_tp}:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true`
    : `loudnorm=I=${target}:TP=-1.5:LRA=11`;
  run(ffmpegPath(), ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-af", filter, "-ar", "48000", "-b:a", "192k", output]);
}

function loudnessRaw(file, target) {
  const { stderr } = run(
    ffmpegPath(),
    ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", `loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"],
    { allowFail: true },
  );
  const json = stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
  return json ? JSON.parse(json) : null;
}

/** Duration in seconds of any media file. */
export function duration(file) {
  const { stdout } = run(ffprobePath(), ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]);
  return Number(stdout.trim());
}

/** KEY=value pairs from a .env file in the project (not committed), merged under process.env. */
export function env(name) {
  if (process.env[name]) return process.env[name];
  const file = path.resolve(".env");
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

/** Tiny argv parser: --flag value, --flag=value, --bool, plus positionals. */
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const [k, v] = a.slice(2).split("=", 2);
    if (v !== undefined) out[k] = v;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}
