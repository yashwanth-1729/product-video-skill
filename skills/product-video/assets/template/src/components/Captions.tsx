import { useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_SPELLING } from "../brand";
import { useFormat } from "../format";
import { C, fontFamily } from "../theme";
import { WORDS, type Word } from "../timing";

// Short phrases (at most ~6 words, broken at punctuation) read faster than whole sentences.
const PHRASES: Word[][] = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of WORDS) {
    cur.push(w);
    const end = /[.,?!:;]$/.test(w.text) || w.text.endsWith("...");
    if ((end && cur.length >= 2) || cur.length >= 6) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
})();

const clean = (s: string) => {
  let x = s.replace(/\.\.\.|…/g, "").replace(/\b((?:[A-Za-z]\.){2,})/g, (m) => m.replace(/\./g, ""));
  for (const [from, to] of Object.entries(CAPTION_SPELLING)) x = x.split(from).join(to);
  return x;
};

/**
 * Captions for people watching with the sound off (most do, in feeds and DMs). Words light up as they
 * are spoken. Hide them over scenes whose headline already says the same thing.
 */
export function Captions({ hideBefore = 0, hideAfter = Infinity, hide = [] }: { hideBefore?: number; hideAfter?: number; hide?: [number, number][] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = useFormat();
  const t = frame / fps;
  if (t < hideBefore || t > hideAfter || hide.some(([a, b]) => t >= a && t <= b)) return null;
  const phrase = PHRASES.find((p) => t >= p[0]!.start - 0.05 && t <= p[p.length - 1]!.end + 0.25);
  if (!phrase) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: f.captions.bottom, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          fontFamily,
          fontSize: f.captions.size,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          padding: "12px 22px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.88)",
          boxShadow: "0 8px 30px -14px rgba(15,23,42,0.35)",
          maxWidth: f.captions.maxWidth,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {phrase.map((w, i) => (
          <span key={i} style={{ color: t >= w.start ? C.ink : "#A8B3C2" }}>
            {clean(w.text)}
            {i < phrase.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
