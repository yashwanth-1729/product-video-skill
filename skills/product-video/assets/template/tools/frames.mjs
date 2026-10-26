// Review frames: the fastest way to see what the video looks like without rendering all of it.
//
//   node tools/frames.mjs --every 3                    a still every 3 s of the composition → out/review/sheet.png
//   node tools/frames.mjs --at 4.5,12,20.2             stills at these times (seconds)
//   node tools/frames.mjs --video out/video.mp4 --every 4   frames from a rendered file instead
//
// Options: --comp Video-4x5 (composition id), --scale 0.5, --out out/review, --cols 4
// Look at the sheet, fix what's off, run again. Two passes catch most problems.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { args, duration, ffmpegPath, run } from "./lib/media.mjs";

const o = args();
const OUT = path.resolve(o.out || "out/review");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const scale = Number(o.scale || 0.5);

async function fromComposition() {
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition, getCompositions } = await import("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const comps = await getCompositions(serveUrl);
  const id = o.comp || comps[0]?.id;
  const composition = await selectComposition({ serveUrl, id });
  const total = composition.durationInFrames / composition.fps;
  const times = timesFor(total);
  const files = [];
  for (const t of times) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
    const file = path.join(OUT, `t${t.toFixed(2).padStart(6, "0")}.png`);
    await renderStill({ composition, serveUrl, output: file, frame, scale });
    files.push({ file, t });
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  return { files, label: id, total };
}

function fromVideo(video) {
  const total = duration(video);
  const files = timesFor(total).map((t) => {
    const file = path.join(OUT, `t${t.toFixed(2).padStart(6, "0")}.jpg`);
    run(ffmpegPath(), ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", video, "-frames:v", "1", "-vf", `scale=iw*${scale}:-2`, "-q:v", "3", file]);
    return { file, t };
  });
  return { files, label: path.basename(video), total };
}

function timesFor(total) {
  if (o.at) return String(o.at).split(",").map(Number).filter((t) => t >= 0 && t < total);
  const every = Number(o.every || 3);
  const out = [];
  for (let t = Math.min(1, total / 2); t < total; t += every) out.push(Math.round(t * 100) / 100);
  return out;
}

// A contact sheet built as a web page and photographed, so no image library is needed.
async function sheet({ files, label, total }) {
  const cols = Number(o.cols || (files.length > 12 ? 6 : 4));
  const cells = files
    .map(({ file, t }) => `<figure><img src="${pathToFileURL(file).href}"><figcaption>${t.toFixed(1)}s</figcaption></figure>`)
    .join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#111;font:600 14px system-ui;color:#ddd}
    h1{font-size:15px;margin:0 0 16px;color:#999} .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px}
    figure{margin:0} img{width:100%;display:block;border-radius:6px;background:#222}
    figcaption{margin-top:5px;color:#aaa}</style>
    <h1>${label} · ${total.toFixed(1)}s · ${files.length} frames</h1><div class="g">${cells}</div>`;
  const page = path.join(OUT, "sheet.html");
  writeFileSync(page, html);
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(pathToFileURL(page).href);
  await p.waitForLoadState("load");
  await p.screenshot({ path: path.join(OUT, "sheet.png"), fullPage: true });
  await browser.close();
}

try {
  const result = o.video ? fromVideo(path.resolve(o.video)) : await fromComposition();
  await sheet(result);
  console.log(`${result.files.length} frames → ${path.relative(process.cwd(), OUT)}/ (open sheet.png)`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
