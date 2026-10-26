import data from "../public/audio/words.json";

/**
 * The video's clock: the spoken words and when each is said (public/audio/words.json, written by
 * tools/voice.mjs, tools/align.mjs --audio, or tools/align.mjs --estimate for voice-free videos).
 * Scenes are placed with at("phrase") so they cut on the word, and stay in sync when the voice changes.
 */

export interface Word {
  text: string;
  start: number;
  end: number;
}
interface WordsFile {
  source: string;
  audio: string | null;
  duration: number;
  words: Word[];
}
const file = data as WordsFile;

/** Seconds of quiet before the first word, and of end card after the last. */
export const VO_START = 0.6;
export const OUTRO = 4.5;

export const AUDIO = file.audio;
export const WORDS: Word[] = file.words.map((w) => ({ text: w.text, start: w.start + VO_START, end: w.end + VO_START }));
export const VO_END = WORDS.length ? WORDS[WORDS.length - 1]!.end : 0;
export const TOTAL = VO_END + OUTRO;

// Letters and digits only, so punctuation, "H.M.S." and smart quotes never break a lookup.
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
let flat = "";
const owner: number[] = [];
WORDS.forEach((w, i) => {
  const n = norm(w.text);
  flat += n;
  for (let k = 0; k < n.length; k++) owner.push(i);
});

function find(phrase: string, after: number): [number, number] {
  const q = norm(phrase);
  if (!q) throw new Error(`empty phrase`);
  let from = 0;
  for (;;) {
    const k = flat.indexOf(q, from);
    if (k < 0) {
      const sample = WORDS.slice(0, 40).map((w) => w.text).join(" ");
      throw new Error(`"${phrase}" is not in the voiceover (after ${after}s). Words start: ${sample} …`);
    }
    const first = owner[k]!;
    const last = owner[k + q.length - 1]!;
    if (WORDS[first]!.start >= after) return [first, last];
    from = k + 1;
  }
}

/** When a phrase starts being spoken (video seconds). `after` picks a later occurrence. */
export const at = (phrase: string, after = 0) => WORDS[find(phrase, after)[0]]!.start;
/** When a phrase finishes being spoken. */
export const endOf = (phrase: string, after = 0) => WORDS[find(phrase, after)[1]]!.end;
/** True while the voice is speaking (with a little release), for ducking music. */
export const speaking = (t: number) => WORDS.some((w) => t >= w.start - 0.2 && t <= w.end + 0.45);
