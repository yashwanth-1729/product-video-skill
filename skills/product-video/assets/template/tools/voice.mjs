// Voiceover with ElevenLabs, with word timings for the composition.
//
//   node tools/voice.mjs --voices                     list voices on the account
//   node tools/voice.mjs --takes 3 [--voice Eric]     generate takes of script.txt
//   node tools/voice.mjs --verify                     transcribe each take, report mistakes / spoken cues
//   node tools/voice.mjs --pick 2                     use take 2: normalise to -16 LUFS → public/audio/vo.mp3 + words.json
//
// Options: --script script.txt  --model eleven_v4  --speed 1.0  --format mp3_44100_128  --dry
// Key: ELEVENLABS_API_KEY in the environment or in .env (never commit it).
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { args, duration, env, normalizeVoice } from "./lib/media.mjs";
import { compare, fromCharacters, fromTranscript, stripCues, writeWords } from "./lib/words.mjs";

const o = args();
const API = "https://api.elevenlabs.io";
const TAKES = path.resolve("public/audio/takes");
const scriptFile = path.resolve(o.script || "script.txt");

function key() {
  const k = env("ELEVENLABS_API_KEY");
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set (environment or .env). Create one at elevenlabs.io → Settings → API keys.");
  if (!k.startsWith("sk_")) throw new Error("That looks like an API key ID, not the key. Real keys start with sk_ and are shown once when created.");
  return k;
}

async function api(pathname, init = {}) {
  const res = await fetch(API + pathname, { ...init, headers: { "xi-api-key": key(), ...(init.headers || {}) } });
  if (!res.ok) {
    const body = await res.text();
    let hint = "";
    if (/quota_exceeded/.test(body)) hint = "\n→ Out of characters on this plan. Shorten the script, or add credits.";
    if (/output_format_not_allowed/.test(body)) hint = "\n→ That output format needs a higher plan; use --format mp3_44100_128.";
    if (/missing_permissions/.test(body)) hint = "\n→ The key lacks a permission (enable Text to Speech / Speech to Text / Voices for it).";
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 400)}${hint}`);
  }
  return res;
}

async function listVoices() {
  const res = await api("/v2/voices?page_size=100");
  const { voices } = await res.json();
  for (const v of voices) {
    const l = v.labels || {};
    console.log(`${v.voice_id}  ${v.name.padEnd(42).slice(0, 42)} ${[l.accent, l.gender, l.age, l.use_case].filter(Boolean).join(", ")}`);
  }
}

async function resolveVoice(nameOrId) {
  if (/^[A-Za-z0-9]{20}$/.test(nameOrId)) return nameOrId;
  const res = await api(`/v2/voices?page_size=100&search=${encodeURIComponent(nameOrId)}`);
  const { voices } = await res.json();
  const v = voices.find((x) => x.name.toLowerCase().startsWith(nameOrId.toLowerCase())) || voices[0];
  if (!v) throw new Error(`no voice matching "${nameOrId}" — run with --voices to list them`);
  console.log(`voice: ${v.name} (${v.voice_id})`);
  return v.voice_id;
}

async function generate() {
  const script = readFileSync(scriptFile, "utf8").trim();
  const spoken = stripCues(script);
  const takes = Number(o.takes || 1);
  const chars = script.length;
  console.log(`script: ${spoken.split(/\s+/).length} words, ${chars} characters per take × ${takes} take(s) = ~${chars * takes} credits`);
  if (o.dry) return;
  const voice = await resolveVoice(String(o.voice || "Eric"));
  mkdirSync(TAKES, { recursive: true });
  const start = nextTakeNumber();
  for (let i = 0; i < takes; i++) {
    const n = start + i;
    const res = await api(`/v1/text-to-speech/${voice}/with-timestamps?output_format=${o.format || "mp3_44100_128"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: script, model_id: o.model || "eleven_v4", voice_settings: { speed: Number(o.speed || 1) } }),
    });
    const data = await res.json();
    const mp3 = path.join(TAKES, `take-${n}.mp3`);
    writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
    const words = fromCharacters(data.alignment);
    writeFileSync(path.join(TAKES, `take-${n}.words.json`), JSON.stringify(words));
    const secs = words.length ? words[words.length - 1].end : 0;
    console.log(`take ${n}: ${secs.toFixed(1)}s, ${(words.length / secs).toFixed(2)} words/s → ${path.relative(process.cwd(), mp3)}`);
  }
  console.log("Next: node tools/voice.mjs --verify, listen, then --pick <n>.");
}

function nextTakeNumber() {
  if (!existsSync(TAKES)) return 1;
  const nums = readdirSync(TAKES).map((f) => Number(/^take-(\d+)\.mp3$/.exec(f)?.[1] || 0));
  return Math.max(0, ...nums) + 1;
}

async function transcribe(file) {
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", new Blob([readFileSync(file)]), path.basename(file));
  const res = await api("/v1/speech-to-text", { method: "POST", body: form });
  return res.json();
}

async function verify() {
  const script = readFileSync(scriptFile, "utf8");
  const takes = readdirSync(TAKES).filter((f) => /^take-\d+\.mp3$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
  if (o.take) takes.splice(0, takes.length, `take-${o.take}.mp3`);
  for (const f of takes) {
    const t = await transcribe(path.join(TAKES, f));
    const r = compare(script, t.text || "");
    const flag = r.spokenCues.length ? "  ⚠ spoke delivery cues: " + r.spokenCues.join(" ") : "";
    console.log(`${f}: ${(r.accuracy * 100).toFixed(1)}% of words heard${flag}`);
    if (r.missing.length) console.log(`   missing: ${r.missing.slice(0, 20).join(" ")}`);
    if (r.extra.length) console.log(`   extra:   ${r.extra.slice(0, 20).join(" ")}`);
    console.log(`   heard: ${t.text}`);
  }
  console.log("Names and acronyms that come back wrong (e.g. HMS → \"HNMS\") need respelling in script.txt: \"H.M.S.\", \"Nel-lore\".");
}

function pick() {
  const n = o.pick;
  const mp3 = path.join(TAKES, `take-${n}.mp3`);
  const wordsFile = path.join(TAKES, `take-${n}.words.json`);
  if (!existsSync(mp3) || !existsSync(wordsFile)) throw new Error(`take ${n} not found in public/audio/takes`);
  const out = path.resolve("public/audio/vo.mp3");
  normalizeVoice(mp3, out, Number(o.lufs || -16));
  const words = JSON.parse(readFileSync(wordsFile, "utf8"));
  const secs = writeWords(path.resolve("public/audio/words.json"), { source: "elevenlabs", audio: "audio/vo.mp3", words });
  console.log(`using take ${n}: ${secs.toFixed(1)}s of speech (audio ${duration(out).toFixed(1)}s), normalised to ${o.lufs || -16} LUFS → public/audio/vo.mp3 + words.json`);
  copyFileSync(scriptFile, path.resolve("public/audio/script.used.txt"));
}

try {
  if (o.voices) await listVoices();
  else if (o.verify) await verify();
  else if (o.pick) pick();
  else await generate();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
