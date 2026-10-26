import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { C, easeOut, fontFamily } from "../theme";

// --- the clock ---------------------------------------------------------------------------------------
// Every scene runs inside <Scene from to>, its own Sequence. Components take ABSOLUTE video times
// (from at("phrase")) and convert internally, so nobody has to subtract scene starts by hand.
// A video inside a scene plays from the scene's start, so each recording needs its own <Scene>.

const SceneClock = createContext({ from: 0, to: Infinity });

export function Scene({ from, to, children, fade = true }: { from: number; to: number; children: ReactNode; fade?: boolean }) {
  const { fps } = useVideoConfig();
  const start = Math.round(from * fps);
  const frames = Math.max(1, Math.round(to * fps) - start);
  return (
    <Sequence from={start} durationInFrames={frames} layout="none">
      <SceneClock.Provider value={{ from, to }}>{fade ? <FadeOut>{children}</FadeOut> : <AbsoluteFill>{children}</AbsoluteFill>}</SceneClock.Provider>
    </Sequence>
  );
}

/** Absolute video time in seconds (same scale as at()). */
export function useT(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return useContext(SceneClock).from + frame / fps;
}

/** Seconds since the enclosing scene started. */
export function useLocalT(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

export const useScene = () => useContext(SceneClock);

/** 0 → 1 between two absolute times, eased out. */
export function progress(t: number, start: number, dur = 0.7, ease = easeOut): number {
  return interpolate(t, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/** Scenes fade and lift out over their last 0.35 s, so cuts read as breaths rather than jumps. */
function FadeOut({ children }: { children: ReactNode }) {
  const t = useT();
  const { to } = useScene();
  const k = interpolate(t, [to - 0.35, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: 1 - k, transform: `translateY(${-18 * k}px)` }}>{children}</AbsoluteFill>;
}

// --- surfaces ----------------------------------------------------------------------------------------

/** Off-white with two slow accent glows and a fine dot grid. Present, never competing. */
export function Background() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = Math.sin((frame / fps) * 0.18) * 40;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: `radial-gradient(700px 520px at ${18 + drift / 30}% ${8 + drift / 60}%, ${C.accentSoft}, transparent 70%),
                       radial-gradient(640px 560px at ${92 - drift / 40}% ${96 - drift / 80}%, ${C.accentSoft}, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${C.line} 1.2px, transparent 1.2px)`,
          backgroundSize: "28px 28px",
          opacity: 0.55,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 78%)",
        }}
      />
    </AbsoluteFill>
  );
}

// --- type --------------------------------------------------------------------------------------------

/**
 * Words rise into place one after another. Spacing is a margin, not a trailing space: spaces inside
 * inline-block spans collapse and the words run together.
 */
export function Rise({
  text,
  at,
  size,
  weight = 800,
  color = C.ink,
  stagger = 0.06,
  accent = [],
  align = "left",
  lineHeight = 1.04,
  style,
}: {
  text: string;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  stagger?: number;
  accent?: string[];
  align?: "left" | "center";
  lineHeight?: number;
  style?: CSSProperties;
}) {
  const t = useT();
  const words = text.split(" ");
  const accents = new Set(accent.map((a) => a.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "")));
  return (
    <div style={{ fontFamily, fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: "-0.035em", textAlign: align, ...style }}>
      {words.map((w, i) => {
        const p = progress(t, at + i * stagger, 0.75);
        const isAccent = accents.has(w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""));
        return (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: size * 0.08, marginBottom: -size * 0.08, marginRight: i < words.length - 1 ? "0.26em" : 0 }}
          >
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)`, opacity: p, color: isAccent ? C.accent : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
}

/** Small uppercase label with a drawn rule: tells the viewer which part of the story this is. */
export function Kicker({ children, at, size = 24 }: { children: ReactNode; at: number; size?: number }) {
  const t = useT();
  const p = progress(t, at, 0.6);
  return (
    <div style={{ fontFamily, display: "inline-flex", alignItems: "center", gap: 12, fontSize: size, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
      <span style={{ width: size * 1.4, height: 3, borderRadius: 3, background: C.accent, transform: `scaleX(${p})`, transformOrigin: "left" }} />
      {children}
    </div>
  );
}

/** The product's logo, or a monogram in the accent colour when there is none. */
export function Logo({ size }: { size: number }) {
  if (BRAND.logo) return <Img src={staticFile(BRAND.logo)} style={{ width: size, height: size, objectFit: "contain" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: C.accent, color: "white", display: "grid", placeItems: "center", fontFamily, fontWeight: 800, fontSize: size * 0.5, letterSpacing: "-0.04em" }}>
      {BRAND.name.charAt(0)}
    </div>
  );
}
