// Generates a few quiet interface sound effects with ElevenLabs (works on the free tier).
//
//   node tools/sfx.mjs                 click, pop, whoosh → public/audio/sfx-*.mp3
//   node tools/sfx.mjs pop "a soft notification chime"   one custom effect
//
// Sound effects should be felt more than heard: the composition plays them at 0.15–0.35 volume,
// only on events the viewer can see (a click, a message landing, a scene change).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { args, env } from "./lib/media.mjs";

const PRESETS = {
  click: ["a single very soft, subtle mouse click on a trackpad, clean, close, no reverb", 0.5],
  pop: ["a soft gentle message notification pop, warm, subtle, modern UI sound, very short, no melody", 0.6],
  whoosh: ["a very soft airy whoosh transition, subtle, smooth, modern, gentle", 1.0],
};

const o = args();
const k = env("ELEVENLABS_API_KEY");
if (!k) {
  console.error("ELEVENLABS_API_KEY is not set. Sound effects are optional; the video works without them.");
  process.exit(1);
}
const jobs = o._.length >= 2 ? [[o._[0], o._.slice(1).join(" "), Number(o.seconds || 0.8)]] : Object.entries(PRESETS).map(([n, [t, s]]) => [n, t, s]);
mkdirSync(path.resolve("public/audio"), { recursive: true });
for (const [name, text, seconds] of jobs) {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": k, "content-type": "application/json" },
    body: JSON.stringify({ text, duration_seconds: seconds, prompt_influence: 0.7 }),
  });
  if (!res.ok) {
    console.error(`${name}: ElevenLabs ${res.status} ${(await res.text()).slice(0, 200)}`);
    process.exitCode = 1;
    continue;
  }
  const file = path.resolve(`public/audio/sfx-${name}.mp3`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${name} → public/audio/sfx-${name}.mp3`);
}
