// Records product scenes from a live web app, in high quality, for the video.
//
//   node tools/record.mjs                 record every scene in scenes.config.mjs
//   node tools/record.mjs overview pay    record only these scenes
//   node tools/record.mjs --list          list the scenes
//   node tools/record.mjs --config other.config.mjs
//
// A scripted browser clicks through each scene at a calm, human pace with a smooth visible cursor.
// Frames are captured straight from Chrome (CDP screencast, JPEG q92) and stitched with ffmpeg, which
// is sharper than Playwright's built-in recorder. Every cursor move is logged to rec/<scene>.json so the
// composition's camera can follow the action. Output per scene: public/rec/<scene>.mp4 + .json.
import { chromium } from "playwright";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { args, ffmpegPath, run } from "./lib/media.mjs";

const opts = args();
const configPath = path.resolve(opts.config || "scenes.config.mjs");
const config = (await import(pathToFileURL(configPath).href)).default;
const OUT = path.resolve("public/rec");

const VIEW = config.viewport ?? { width: 1280, height: 1100 };
const SCALE = config.scale ?? 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A soft, modern cursor drawn in the page (crisp at any zoom), plus a click ripple. Its position survives
// full page loads via sessionStorage. Extra CSS from the config (e.g. blurring personal data) is injected too.
const CURSOR = (extraCss) => `
(() => {
  const css = ${JSON.stringify(extraCss || "")};
  const install = () => {
    if (!document.head || document.getElementById("__cur")) return;
    const s = document.createElement("style");
    s.textContent = \`
      #__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;
        transition:transform 700ms cubic-bezier(.22,1,.36,1);will-change:transform;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}
      #__cur svg{transition:transform 120ms} #__cur.press svg{transform:scale(.86)}
      .__ripple{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;pointer-events:none;z-index:2147483646;
        background:rgba(99,102,241,.32);animation:__rip 600ms ease-out forwards}
      @keyframes __rip{from{transform:scale(.2);opacity:1}to{transform:scale(1.6);opacity:0}}
      html{scrollbar-width:none} ::-webkit-scrollbar{display:none}
    \` + css;
    document.head.appendChild(s);
    const c = document.createElement("div");
    c.id = "__cur";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2.5l15 9.2-6.6 1.4 3.9 7.3-2.8 1.5-3.9-7.4L4.9 19z" fill="#0b1220" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    let p = [window.innerWidth / 2, window.innerHeight * 0.55];
    try { p = JSON.parse(sessionStorage.getItem("__curpos")) || p; } catch {}
    c.style.transition = "none";
    c.style.transform = \`translate(\${p[0]}px,\${p[1]}px)\`;
    requestAnimationFrame(() => (c.style.transition = ""));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install); else install();
  new MutationObserver(install).observe(document.documentElement, { childList: true, subtree: true });
})();`;

// --- helpers handed to each scene's run(page, h) -----------------------------------------------------

let marks = null;

function helpers(page) {
  const mark = (kind, b) => marks?.push({ t: Date.now() / 1000, kind, x: b.x, y: b.y, w: b.width, h: b.height });

  async function moveTo(locator, kind = "focus") {
    await locator.scrollIntoViewIfNeeded();
    const b = await locator.boundingBox();
    if (!b) throw new Error("element is not visible");
    mark(kind, b);
    const x = b.x + Math.min(b.width / 2, 60);
    const y = b.y + b.height / 2;
    await page.evaluate(([x, y]) => {
      const c = document.getElementById("__cur");
      if (c) c.style.transform = `translate(${x - 5}px,${y - 3}px)`;
      try { sessionStorage.setItem("__curpos", JSON.stringify([x - 5, y - 3])); } catch {}
    }, [x, y]);
    await sleep(750);
    return { x, y };
  }

  async function click(locator, pause = 350) {
    const { x, y } = await moveTo(locator, "click");
    await page.evaluate(([x, y]) => {
      const c = document.getElementById("__cur");
      c?.classList.add("press");
      setTimeout(() => c?.classList.remove("press"), 160);
      const r = document.createElement("div");
      r.className = "__ripple";
      r.style.left = x + "px";
      r.style.top = y + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }, [x, y]);
    await locator.click();
    await sleep(pause);
  }

  async function type(locator, text, delay = 38) {
    await click(locator, 150);
    await locator.fill("");
    await locator.pressSequentially(text, { delay });
    await sleep(250);
  }

  async function select(locator, label) {
    await click(locator, 150);
    await locator.selectOption({ label });
    await sleep(300);
  }

  async function scroll(y, ms = 1200) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), y);
    await sleep(ms);
  }

  return { moveTo, hover: moveTo, click, type, select, scroll, sleep, mark: (kind, box) => mark(kind, box) };
}

// --- one scene ---------------------------------------------------------------------------------------

async function recordScene(browser, name, scene) {
  if (scene.before) await sleep(scene.before);
  const view = scene.view ?? VIEW;
  const context = await browser.newContext({
    viewport: view,
    deviceScaleFactor: scene.scale ?? SCALE,
    locale: config.locale ?? "en-US",
    timezoneId: config.timezoneId,
    storageState: config.storageState,
  });
  await context.addInitScript(CURSOR(config.css));
  const page = await context.newPage();
  page.setDefaultTimeout(config.timeout ?? 30000);

  const base = String(config.baseUrl).replace(/\/$/, "");
  const url = (p) => (/^[a-z]+:/i.test(p) ? p : base + (p.startsWith("/") || p.startsWith("#") ? "" : "/") + p);

  if (scene.login && config.login) await config.login(page, scene.login, { url });
  if (scene.setup) await scene.setup(page, { url });
  await page.goto(url(scene.start ?? "/"));
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(scene.settle ?? 1500); // let entrance animations finish before the camera rolls

  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId });
    } catch {}
  });
  const scale = scene.scale ?? SCALE;
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: view.width * scale, maxHeight: view.height * scale, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  marks = [];
  await sleep(600);
  let failed = null;
  try {
    await scene.run(page, helpers(page));
  } catch (err) {
    failed = err;
    await page.screenshot({ path: path.join(OUT, `${name}-error.png`) }).catch(() => {});
  }
  await sleep(1200);
  await cdp.send("Page.stopScreencast").catch(() => {});
  const t1 = Date.now() / 1000;
  await context.close();

  if (failed) {
    marks = null;
    throw new Error(`${failed.message.split("\n")[0]} (see public/rec/${name}-error.png)`);
  }
  const start = frames[0]?.t ?? t0;
  writeFileSync(
    path.join(OUT, `${name}.json`),
    JSON.stringify({
      width: view.width,
      height: view.height,
      duration: Math.round((t1 - start) * 1000) / 1000,
      marks: (marks ?? []).map((m) => ({ ...m, t: Math.round((m.t - start) * 1000) / 1000 })),
    }),
  );
  marks = null;
  stitch(name, frames, t1, view, scale);
}

// Screencast frames arrive only when the page changes: hold each one until the next.
function stitch(name, frames, t1, view, scale) {
  if (!frames.length) throw new Error(`no frames captured for ${name}`);
  const dir = path.join(OUT, `_${name}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const lines = [];
  frames.forEach((f, i) => {
    const file = `f${String(i).padStart(5, "0")}.jpg`;
    writeFileSync(path.join(dir, file), Buffer.from(f.data, "base64"));
    const next = i + 1 < frames.length ? frames[i + 1].t : t1;
    lines.push(`file '${file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file 'f${String(frames.length - 1).padStart(5, "0")}.jpg'`);
  writeFileSync(path.join(dir, "list.txt"), lines.join("\n"));
  const w = Math.round((view.width * scale) / 2) * 2;
  const h = Math.round((view.height * scale) / 2) * 2;
  run(ffmpegPath(), [
    "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", `fps=60,scale=${w}:${h}:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
    path.join(OUT, `${name}.mp4`),
  ]);
  rmSync(dir, { recursive: true, force: true });
}

// --- main ----------------------------------------------------------------------------------------------

const names = Object.keys(config.scenes ?? {});
if (opts.list) {
  for (const n of names) console.log(`${n.padEnd(18)} ${config.scenes[n].start ?? "/"}${config.scenes[n].note ? "  — " + config.scenes[n].note : ""}`);
  process.exit(0);
}
const wanted = opts._.length ? opts._ : names;
const unknown = wanted.filter((n) => !config.scenes?.[n]);
if (unknown.length) {
  console.error(`unknown scene(s): ${unknown.join(", ")}. Known: ${names.join(", ")}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: [`--lang=${config.locale ?? "en-US"}`] });
let failures = 0;
try {
  for (const name of wanted) {
    const started = Date.now();
    try {
      await recordScene(browser, name, config.scenes[name]);
      console.log(`✓ ${name.padEnd(18)} ${((Date.now() - started) / 1000).toFixed(1)}s  → public/rec/${name}.mp4`);
    } catch (err) {
      failures++;
      console.error(`✗ ${name.padEnd(18)} ${err.message}`);
    }
  }
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
