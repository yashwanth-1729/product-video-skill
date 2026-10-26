import { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, getStaticFiles, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { C, easeOut, fontFamily, shadow } from "../theme";
import { progress, useLocalT, useScene, useT } from "./base";

export interface Mark {
  t: number;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Recording {
  width: number;
  height: number;
  duration: number;
  marks: Mark[];
}
/** A camera keyframe in page coordinates (CSS px of the recorded viewport), at a clip time. */
export interface Shot {
  t: number;
  x: number;
  y: number;
  zoom: number;
}

const has = (file: string) => getStaticFiles().some((f) => f.name.replace(/\\/g, "/") === file);

/** Loads rec/<name>.json (written by tools/record.mjs). Returns "missing" if the scene isn't recorded yet. */
export function useRecording(name: string): Recording | null | "missing" {
  const exists = useMemo(() => has(`rec/${name}.json`) && has(`rec/${name}.mp4`), [name]);
  const [rec, setRec] = useState<Recording | null>(null);
  const [handle] = useState(() => (exists ? delayRender(`loading rec/${name}.json`) : null));
  useEffect(() => {
    if (handle === null) return;
    fetch(staticFile(`rec/${name}.json`))
      .then((r) => r.json())
      .then((j: Recording) => {
        setRec(j);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, name]);
  return exists ? rec : "missing";
}

export interface ScreenProps {
  /** Recording name: public/rec/<name>.mp4 + .json. */
  name: string;
  /** Where in the recording to start (seconds), and playback speed. Speeds of 1–1.6 still look natural. */
  from?: number;
  rate?: number;
  width: number;
  height: number;
  /** When the frame flies in (absolute seconds; defaults to the scene start). */
  enter?: number;
  /** Zoom while following the cursor, and before the first cursor move. ~1.5–1.9 keeps UI text readable on phones. */
  zoom?: number;
  wide?: number;
  /** Explicit camera keyframes; when given, they replace cursor-following. */
  shots?: Shot[];
  /** The camera starts moving this long before each cursor move, so it arrives with the click. */
  leadIn?: number;
  /** Where across the frame the subject sits (0.5 = centre). */
  focusX?: number;
}

/**
 * The real product in a quiet browser frame. The camera glides to wherever the cursor went (from the
 * recorder's marks) like a steady operator: smoothed, clamped to the page, never past its edges.
 */
export function Screen(p: ScreenProps) {
  const rec = useRecording(p.name);
  return <Frame width={p.width} height={p.height} enter={p.enter}>{rec === "missing" ? <Missing name={p.name} /> : rec ? <Footage {...p} rec={rec} /> : null}</Frame>;
}

function Frame({ width, height, enter, children }: { width: number; height: number; enter?: number; children: React.ReactNode }) {
  const t = useT();
  const { from } = useScene();
  const k = progress(t, enter ?? from, 0.9, easeOut);
  const bar = 44;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        background: C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: shadow.float,
        opacity: k,
        transform: `perspective(1600px) translateY(${(1 - k) * 70}px) rotateX(${(1 - k) * 10}deg) scale(${0.96 + k * 0.04})`,
        transformOrigin: "50% 100%",
      }}
    >
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", borderBottom: `1px solid ${C.line}`, background: "#FBFCFE" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: 11, background: "#E5E9F0" }} />
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily, fontSize: 15, fontWeight: 600, color: C.muted }}>{BRAND.appLabel}</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 52 }} />
      </div>
      <div style={{ position: "relative", width, height: height - bar, overflow: "hidden", background: C.bg }}>{children}</div>
    </div>
  );
}

function Footage({ name, rec, from = 0, rate = 1, width, height, zoom = 1.7, wide = 1.05, shots, leadIn = 0.25, focusX = 0.5 }: ScreenProps & { rec: Recording }) {
  const { fps } = useVideoConfig();
  const { from: sceneFrom, to: sceneTo } = useScene();
  const local = useLocalT();
  const viewH = height - 44;
  const base = width / rec.width;
  const frames = Math.max(1, Math.ceil((Math.min(sceneTo, sceneFrom + 600) - sceneFrom) * fps) + 1);

  // Where the camera wants to be on each frame, then smoothed (critically damped, ~0.5 s to settle).
  const path = useMemo(() => {
    const target = (clip: number) => {
      if (shots?.length) {
        let s = shots[0]!;
        for (const k of shots) if (k.t <= clip) s = k;
        return s;
      }
      const seen = rec.marks.filter((m) => m.t <= clip + leadIn);
      const m = seen[seen.length - 1];
      if (!m) return { x: rec.width / 2, y: rec.height * 0.42, zoom: wide };
      // Fit the subject: a whole row or card zooms out until it fits (~85% of the frame); a small
      // control keeps the close-up. Hovering a row before clicking its toggle keeps the label in view.
      const fit = Math.min((0.85 * width) / (m.w * base), (0.8 * viewH) / (m.h * base));
      return { x: m.x + m.w / 2, y: m.y + m.h / 2, zoom: Math.max(Math.min(zoom, fit), Math.min(wide, zoom)) };
    };
    const out: { x: number; y: number; z: number }[] = [];
    const first = target(from);
    let x = first.x;
    let y = first.y;
    let z = first.zoom;
    for (let f = 0; f < frames; f++) {
      const goal = target(from + (f / fps) * rate);
      const k = 1 - Math.exp(-(1 / fps) * 4.2);
      x += (goal.x - x) * k;
      y += (goal.y - y) * k;
      z += (goal.zoom - z) * k * 0.85;
      const sc = base * z;
      const loX = (width * focusX) / sc;
      const hiX = rec.width - (width * (1 - focusX)) / sc;
      const vh = viewH / sc;
      out.push({
        x: loX > hiX ? rec.width / 2 : Math.min(Math.max(x, loX), hiX),
        y: vh >= rec.height ? rec.height / 2 : Math.min(Math.max(y, vh / 2), rec.height - vh / 2),
        z,
      });
    }
    return out;
  }, [rec, from, rate, shots, zoom, wide, leadIn, focusX, fps, frames, width, viewH, base]);

  const cam = path[Math.min(Math.round(local * fps), path.length - 1)]!;
  const s = base * cam.z;
  return (
    <OffthreadVideo
      src={staticFile(`rec/${name}.mp4`)}
      startFrom={Math.round(from * fps)}
      playbackRate={rate}
      muted
      style={{ position: "absolute", left: width * focusX - cam.x * s, top: viewH / 2 - cam.y * s, width: rec.width * s, height: rec.height * s, maxWidth: "none" }}
    />
  );
}

function Missing({ name }: { name: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily, color: C.muted, textAlign: "center", padding: 40 }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.ink2 }}>Scene “{name}” isn't recorded yet</div>
        <div style={{ fontSize: 18, marginTop: 10 }}>Add it to scenes.config.mjs, then run: node tools/record.mjs {name}</div>
      </div>
    </div>
  );
}
