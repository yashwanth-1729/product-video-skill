// Timing for videos without ElevenLabs voices.
//
// Your own voice (often the most convincing for a founder pitch):
//   node tools/align.mjs --audio my-take.m4a
//     → transcribes with word timestamps (ElevenLabs Speech-to-Text; free tier works),
//       normalises to -16 LUFS → public/audio/vo.mp3 + public/audio/words.json
//
// No voice at all (captions and on-screen text only):
//   node tools/align.mjs --estimate [--script script.txt] [--wps 2.6]
//     → a reading-pace timeline in public/audio/words.json with "audio": null
//
// Timing from a transcript you already have (e.g. Whisper JSON with words[{word|text,start,end}]):
//   node tools/align.mjs --audio my-take.wav --words whisper.json
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { args, duration, env, normalizeVoice } from "./lib/media.mjs";
import { estimate, fromTranscript, writeWords } from "./lib/words.mjs";

const o = args();
const WORDS = path.resolve("public/audio/words.json");

async function transcribe(file) {
  const k = env("ELEVENLABS_API_KEY");
  if (!k) throw new Error("Transcribing needs ELEVENLABS_API_KEY (Speech-to-Text). Or pass --words with an existing transcript.");
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", new Blob([readFileSync(file)]), path.basename(file));
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": k }, body: form });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

try {
  if (o.estimate) {
    const script = readFileSync(path.resolve(o.script || "script.txt"), "utf8");
    const words = estimate(script, Number(o.wps || 2.6));
    const secs = writeWords(WORDS, { source: "estimate", audio: null, words });
    console.log(`estimated ${words.length} words over ${secs.toFixed(1)}s (no audio) → public/audio/words.json`);
  } else if (o.audio) {
    const input = path.resolve(o.audio);
    if (!existsSync(input)) throw new Error(`no such file: ${input}`);
    const out = path.resolve("public/audio/vo.mp3");
    normalizeVoice(input, out, Number(o.lufs || -16));
    let words;
    if (o.words) {
      const raw = JSON.parse(readFileSync(path.resolve(o.words), "utf8"));
      const list = raw.words || raw.segments?.flatMap((s) => s.words || []) || raw;
      words = list.map((w) => ({ text: String(w.text ?? w.word).trim(), start: Number(w.start), end: Number(w.end) })).filter((w) => w.text);
    } else {
      words = fromTranscript(await transcribe(out));
    }
    const secs = writeWords(WORDS, { source: "transcript", audio: "audio/vo.mp3", words });
    console.log(`${words.length} words, ${secs.toFixed(1)}s of speech (audio ${duration(out).toFixed(1)}s) → public/audio/vo.mp3 + words.json`);
    console.log("Check the words in public/audio/words.json: anchors in src/Video.tsx match on them, and captions show them.");
  } else {
    console.log("Use --audio <file> (your own recording) or --estimate (no voice). See the header of this file.");
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
