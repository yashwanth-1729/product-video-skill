// The video's clock is a list of spoken words with times: public/audio/words.json.
// Every source (ElevenLabs timestamps, speech-to-text of your own recording, or an estimate
// for voice-free videos) is converted to this one shape so the composition never cares which.
//
// { "source": "elevenlabs" | "transcript" | "estimate", "audio": "audio/vo.mp3" | null,
//   "duration": 58.2, "words": [ { "text": "Every", "start": 0.08, "end": 0.31 }, ... ] }
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Removes [delivery cues] — they steer the voice but are never spoken or captioned. */
export const stripCues = (script) => script.replace(/\[[^\]]*\]/g, " ").replace(/[ \t]+/g, " ").trim();

/** ElevenLabs /with-timestamps character alignment → words (cues skipped). */
export function fromCharacters(alignment) {
  const ch = alignment.characters;
  const st = alignment.character_start_times_seconds;
  const en = alignment.character_end_times_seconds;
  const words = [];
  let cur = "";
  let start = 0;
  let end = 0;
  let inCue = false;
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    if (c === "[") inCue = true;
    if (inCue) {
      if (c === "]") inCue = false;
      continue;
    }
    if (/\s/.test(c)) {
      if (cur) words.push({ text: cur, start: round(start), end: round(end) });
      cur = "";
      continue;
    }
    if (!cur) start = st[i];
    cur += c;
    end = en[i];
  }
  if (cur) words.push({ text: cur, start: round(start), end: round(end) });
  return words;
}

/** ElevenLabs speech-to-text (Scribe) response → words. */
export function fromTranscript(resp) {
  return (resp.words || [])
    .filter((w) => w.type === "word" || (!w.type && w.text?.trim()))
    .map((w) => ({ text: w.text.trim(), start: round(w.start), end: round(w.end) }))
    .filter((w) => w.text);
}

/**
 * A plausible timeline for a script nobody speaks (voice-free videos), so captions and scene
 * changes still have a rhythm: ~2.6 words per second for reading, plus pauses at punctuation.
 */
export function estimate(script, wps = 2.6) {
  const text = stripCues(script);
  const tokens = text.split(/\s+/).filter(Boolean);
  const words = [];
  let t = 0;
  const paragraphBreaks = new Set();
  // Mark the last word of each paragraph in the original script.
  let count = 0;
  for (const para of script.split(/\n\s*\n/)) {
    count += stripCues(para).split(/\s+/).filter(Boolean).length;
    paragraphBreaks.add(count - 1);
  }
  tokens.forEach((tok, i) => {
    // ~0.047 s per letter at 2.6 words/s, calibrated against ElevenLabs narration (incl. the pauses below).
    const letters = tok.replace(/[^\p{L}\p{N}]/gu, "").length;
    const len = Math.max(0.12, letters * 0.047) * (2.6 / wps);
    words.push({ text: tok, start: round(t), end: round(t + len) });
    t += len + 0.04;
    if (tok.endsWith("...")) t += 0.45;
    else if (/[.!?]$/.test(tok)) t += 0.42;
    else if (/[,;:]$/.test(tok)) t += 0.2;
    if (paragraphBreaks.has(i)) t += 0.45;
  });
  return words;
}

export function writeWords(file, { source, audio, words }) {
  mkdirSync(path.dirname(file), { recursive: true });
  const duration = words.length ? words[words.length - 1].end : 0;
  writeFileSync(file, JSON.stringify({ source, audio, duration: round(duration), words }, null, 1));
  return duration;
}

/** Compare what was meant with what was heard: missing/extra words and spoken cue words. */
export function compare(script, heard) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const want = norm(stripCues(script).replace(/\b((?:[A-Za-z]\.){2,})/g, (m) => m.replace(/\./g, "")));
  const got = norm(heard);
  // Longest common subsequence to line the two up.
  const n = want.length;
  const m = got.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = want[i] === got[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const missing = [];
  const extra = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (want[i] === got[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(want[i++]);
    else extra.push(got[j++]);
  }
  while (i < n) missing.push(want[i++]);
  while (j < m) extra.push(got[j++]);
  const cueWords = new Set(norm((script.match(/\[[^\]]*\]/g) || []).join(" ")));
  const spokenCues = extra.filter((w) => cueWords.has(w));
  return { accuracy: n ? (n - missing.length) / n : 1, missing, extra, spokenCues };
}

const round = (x) => Math.round(x * 1000) / 1000;
