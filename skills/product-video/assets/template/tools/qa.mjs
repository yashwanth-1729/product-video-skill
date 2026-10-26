// Final checks on a rendered video. Prints PASS / WARN / FAIL and makes a contact sheet.
//
//   node tools/qa.mjs out/video.mp4 [--aspect 4:5] [--lufs -16] [--max 90] [--no-sheet]
//
// Exit code 1 if anything FAILs. Pass --silent for videos meant to have no audio. Loudness target: -16 LUFS integrated (social/web standard, -14 to -16),
// true peak at or under -1 dBTP so phones and platforms don't clip it.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { args, ffmpegPath, ffprobePath, loudness, run } from "./lib/media.mjs";

const o = args();
const file = path.resolve(o._[0] || "out/video.mp4");
const ASPECTS = { "4:5": [1080, 1350], "9:16": [1080, 1920], "16:9": [1920, 1080], "1:1": [1080, 1080] };
const rows = [];
const add = (status, check, detail) => rows.push({ status, check, detail });

const probe = JSON.parse(run(ffprobePath(), ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]).stdout);
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
const secs = Number(probe.format.duration);

if (!v) add("FAIL", "video stream", "none");
else {
  const [num, den] = String(v.r_frame_rate).split("/").map(Number); // "30/1"
  const fps = den ? num / den : num;
  add(v.codec_name === "h264" ? "PASS" : "WARN", "codec", `${v.codec_name} ${v.pix_fmt}`);
  if (o.aspect) {
    const [w, h] = ASPECTS[o.aspect] || [];
    add(v.width === w && v.height === h ? "PASS" : "FAIL", "size", `${v.width}×${v.height} (want ${w}×${h} for ${o.aspect})`);
  } else add("PASS", "size", `${v.width}×${v.height}`);
  add([24, 25, 30, 50, 60].includes(Math.round(fps)) ? "PASS" : "WARN", "frame rate", `${fps.toFixed(2)} fps`);
}
const max = Number(o.max || 120);
add(secs <= max ? "PASS" : "WARN", "length", `${secs.toFixed(1)} s (limit ${max} s)`);
const mb = Number(probe.format.size) / 1e6;
add(mb < 60 ? "PASS" : "WARN", "file size", `${mb.toFixed(1)} MB${mb >= 60 ? " — large for WhatsApp/DMs; re-render with a higher --crf" : ""}`);

if (!a) add(o.silent ? "PASS" : "WARN", "audio", "no audio stream");
else {
  const L = loudness(file);
  if (L && !Number.isFinite(L.lufs)) {
    // Remotion writes a silent track when the video has no audio.
    add(o.silent ? "PASS" : "WARN", "audio", "silent track (no voice or music)" + (o.silent ? "" : " — pass --silent if that's intended"));
  } else if (L) {
    const target = Number(o.lufs || -16);
    const off = Math.abs(L.lufs - target);
    add(off <= 1.5 ? "PASS" : off <= 3 ? "WARN" : "FAIL", "loudness", `${L.lufs.toFixed(1)} LUFS integrated (target ${target})`);
    add(L.truePeak <= -1 ? "PASS" : "WARN", "true peak", `${L.truePeak.toFixed(1)} dBTP (want ≤ -1)`);
  }
  // Long silences mid-video usually mean a gap in the voice or a missing music bed.
  if (L && !Number.isFinite(L.lufs)) {
    /* nothing to analyse */
  } else {
  const { stderr } = run(ffmpegPath(), ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "silencedetect=noise=-50dB:d=1.5", "-f", "null", "-"], { allowFail: true });
  const gaps = [...stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)]
    .map((m) => [Number(m[1]), Number(m[2])])
    .filter(([s, e]) => s > 1 && e < secs - 1);
  add(gaps.length ? "WARN" : "PASS", "silences", gaps.length ? gaps.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(", ") : "no long silences mid-video");
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\n${path.basename(file)}`);
for (const r of rows) console.log(`  ${pad(r.status, 5)} ${pad(r.check, 12)} ${r.detail}`);

if (!o["no-sheet"]) {
  const every = Math.max(2, Math.round(secs / 18));
  spawnSync(process.execPath, [path.resolve("tools/frames.mjs"), "--video", file, "--every", String(every), "--out", "out/qa"], { stdio: "inherit" });
}
process.exit(rows.some((r) => r.status === "FAIL") ? 1 : 0);
