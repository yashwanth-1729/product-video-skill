import { useMemo } from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { BRAND } from "../brand";
import { FPS } from "../theme";
import { AUDIO, speaking, VO_END, VO_START } from "../timing";
import { useRecording } from "./Screen";

/** The voiceover (already normalised to -16 LUFS by the voice/align tools). Nothing plays if there is none. */
export function Voice() {
  if (!AUDIO) return null;
  return (
    <Sequence from={Math.round(VO_START * FPS)} layout="none">
      <Audio src={staticFile(AUDIO)} />
    </Sequence>
  );
}

/**
 * Licensed music, ducked ~18–20 dB under the voice and breathing up in pauses; fades in at the start
 * and out at the end. Levels assume a typical mastered track (around -10 LUFS); check with tools/qa.mjs.
 */
export function Music({ under = 0.075, gaps = 0.2, outro = 0.5, noVoice = 0.32 }: { under?: number; gaps?: number; outro?: number; noVoice?: number }) {
  const { durationInFrames } = useVideoConfig();
  const env = useMemo(() => {
    const out: number[] = [];
    let v = 0;
    const total = durationInFrames / FPS;
    for (let f = 0; f < durationInFrames; f++) {
      const t = f / FPS;
      let goal = !AUDIO ? noVoice : speaking(t) ? under : gaps;
      if (t > VO_END) goal = outro;
      v += (goal - v) * (1 - Math.exp(-(1 / FPS) * (goal > v ? 3 : 7)));
      const fadeIn = Math.min(1, t / 1.2);
      const fadeOut = Math.min(1, Math.max(0, (total - 0.2 - t) / 2.4));
      out.push(v * fadeIn * fadeOut);
    }
    return out;
  }, [durationInFrames, under, gaps, outro, noVoice]);
  if (!BRAND.music) return null;
  return <Audio src={staticFile(BRAND.music)} loop volume={(f) => env[f] ?? 0} />;
}

/** One sound effect at an absolute time; render at the top level, not inside a <Scene>. Keep effects rare and tied to something visible. */
export function Sfx({ at, src, volume = 0.25 }: { at: number; src: string | null; volume?: number }) {
  if (!src) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at * FPS))} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
}

/**
 * A soft click on every click the viewer can see in a recorded scene (from the recorder's marks).
 * Times are absolute, so render it at the top level of the video (not inside a <Scene>), with the
 * same from/rate as the scene's <Screen> and that scene's from/to.
 */
export function Clicks({ name, from = 0, rate = 1, scene, volume = 0.2 }: { name: string; from?: number; rate?: number; scene: { from: number; to: number }; volume?: number }) {
  const rec = useRecording(name);
  if (!rec || rec === "missing" || !BRAND.sfx.click) return null;
  const times = rec.marks
    .filter((m) => m.kind === "click")
    .map((m) => scene.from + (m.t - from) / rate)
    .filter((t) => t > scene.from + 0.3 && t < scene.to - 0.3);
  return (
    <>
      {times.map((t) => (
        <Sfx key={t} at={t} src={BRAND.sfx.click} volume={volume} />
      ))}
    </>
  );
}
