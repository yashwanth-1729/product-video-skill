---
name: product-video
description: Make a professional, motion-graphics product video (launch film, product demo, investor or sales pitch, explainer, social reel) from a real web app. Covers story and script, a claims check against what the product really does, scripted screen recording with a camera that follows the cursor, voiceover (ElevenLabs, your own voice, or none) with word-level sync, Remotion motion graphics in 4:5, 9:16, 16:9 or 1:1, a broadcast-level sound mix, and a frame-by-frame quality pass. Use this whenever someone wants a video of their app, website, SaaS, dashboard or product, such as "make a demo video", "launch video", "pitch video for investors/customers/doctors", "product walkthrough", "promo reel for Instagram", "Remotion video", "screen recording with voiceover", "turn my website into a video", even if they don't say "motion graphics" or name a tool.
---

# Product video

Turn a working web app into a short, polished video: real product footage in calm frames, a camera that
glides to what matters, a voice the visuals move with, and a story that ends in a clear ask. The bundled
template and tools do the heavy lifting; your job is the story, the taste, and the checking.

## The bar

A result is done when all of this is true. Hold every decision to it.

- **Intentional in every frame.** One accent colour, calm neutrals, one typeface, decisive ease-out
  motion, real UI lit like a product shot. Restraint reads as confidence; decoration reads as amateur.
- **Legible on a phone.** Most people will watch it on one, often muted. Zoom UI until its text lands at
  roughly 16 px or more on a 1080-wide frame, and keep captions on.
- **Moves with the voice.** Scenes cut on the words that introduce them, because they are anchored to the
  voiceover's word timings, not to guessed seconds.
- **True.** Everything shown or said exists in the product today. No invented metrics, no features "coming
  soon", no testimonials. One false claim costs more trust than the video earns.
- **Sounds finished.** Voice at about -16 LUFS, music 18–24 dB under it, nothing clipping.

## Workflow

Work through these in order. Each step names the reference file to read when you reach it, so read them
as you go rather than all up front.

1. Brief: who it's for, what they should do next, where they'll watch it.
2. Story, then a claims check against the real product. Read `references/story.md`.
3. Make the product camera-ready: demo data, privacy, happy paths. See `references/recording.md`.
4. Scaffold the video project.
5. Record the scenes. Read `references/recording.md`.
6. Voice: ElevenLabs, your own recording, or none. Read `references/voice.md`.
7. Compose the timeline and scenes. Read `references/motion.md`, and `references/sound.md` for audio.
8. Review loop on still frames, two passes at least. Read `references/review.md`.
9. Render, run the automatic checks, deliver with notes.

When something breaks, check `references/troubleshooting.md` first. It lists every failure we have hit
and the fix.

### 1. Brief

Infer what you can from the conversation and the product, and ask only about what you can't. Propose
defaults rather than open questions:

| Decision | Default |
|---|---|
| Audience and the ask | From context; one ask only (a demo, a pilot, a reply) |
| Where it's watched → format | DMs and feeds: **4:5**. Reels, Shorts, Stories: **9:16**. YouTube, LinkedIn, websites: **16:9** |
| Length | 45–75 s for pitches and demos, 20–35 s for reels, under 90 s always |
| Voice | ElevenLabs if they have a key; their own recording if it's a founder pitch; captions only for reels |
| Brand | Logo, accent colour and font taken from the product itself |

Settle the one-sentence promise before anything else, e.g. "Clevo keeps patients from slipping away
between visits." Every scene should serve that sentence.

### 2. Story first, then a claims check

Read `references/story.md`. Write two files in the video project:

- `storyboard.md` is a table of beats with the time, the on-screen visual, the voice line, the on-screen
  text, and the product evidence for each claim.
- `script.txt` is the voiceover, one bracketed delivery cue per paragraph, written for the ear.

Then do the **claims check**. For every claim in the script, find the screen in the product that proves
it. If a claim isn't built (or only half built), stop and tell the user plainly. Offer to cut or reword
the claim, or to build the missing piece first if you're working in their codebase. In practice pitches
often promise more than the product does. Catching that before recording is the most valuable thing this
step does.

### 3. Make the product camera-ready

The camera is merciless: it shows every internal code, empty state, test record and real phone number.
Before recording, work through the data-hygiene checklist in `references/recording.md`. In short:

- Use realistic demo data that makes the product look healthy and current.
- Keep internal codes and jargon off screen.
- Leave no real personal data in view. The recorder can blur fields with CSS.
- Use happy-path inputs. An input that trips a safety rule derails a demo.
- Run AI features before recording and choose prompts that give crisp answers.
- Note any setting you change temporarily (sign-out on reload, rate limits) and restore it afterwards.

### 4. Scaffold

```bash
node <this-skill-dir>/scripts/init.mjs ./video
cd video && npm install && npx playwright install chromium
```

The template renders an example right away (`npx remotion studio src/index.ts`), with placeholders where
recordings will go. It uses Remotion's bundled ffmpeg, so nothing else needs installing. On Windows, if
`npm install` fails under Git Bash with "'node' is not recognized", run it in PowerShell or cmd.

### 5. Record

Describe each moment as a scene in `scenes.config.mjs`. A scene is the start page plus a short
`run(page, h)` script using helpers like `h.click`, `h.type`, `h.moveTo` and `h.scroll`. Then run:

```bash
node tools/record.mjs            # or: node tools/record.mjs scene1 scene2
```

Each scene becomes `public/rec/<scene>.mp4`, recorded at 2× for sharpness, plus `.json` with the cursor
marks the camera follows. Keep scenes to 5–15 s of action and record many small ones. Re-recording one
scene is cheap. After recording, check frames (`node tools/frames.mjs --video public/rec/<scene>.mp4
--every 2`) before building on them. `references/recording.md` covers viewports, logins, selectors and
the camera-friendly way to move the cursor.

### 6. Voice

Read `references/voice.md`, then pick one:

- **ElevenLabs:** run `node tools/voice.mjs --takes 3`, then `--verify` (it transcribes each take and
  flags misread words and spoken cues), then `--pick N`. Respell names and acronyms the voice gets wrong.
- **Your own voice:** run `node tools/align.mjs --audio take.m4a`. It's free, and often the most convincing
  for a founder.
- **No voice:** run `node tools/align.mjs --estimate`. You get captions and on-screen text paced at
  reading speed.

All three write `public/audio/words.json`, the clock the whole composition runs on. Audio is normalised to
-16 LUFS.

### 7. Compose

Read `references/motion.md`. Then edit two files:

- `src/brand.ts` holds the name, tagline, logo, accent, CTA and music.
- `src/Video.tsx` is the storyboard as code. Each `<Scene from={at("phrase")} to={...}>` runs between two
  spoken phrases.

Build from the scene blocks in `src/scenes/scenes.tsx` (`Hook`, `LogoReveal`, `ProductScene` with
optional `Phone`, `Cards`, `Alerts`, `Statement`, `EndCard`) before inventing new ones. They already encode
the layout, legibility and motion choices for every format. A few rules prevent the most common defects:

- Every recording gets its own `<Scene>`. A video inside a scene plays from that scene's start.
- Use absolute times from `at()` everywhere. Scenes start about 0.25 s before their phrase.
- Show what the product really sends: phone messages use the product's actual text.

For audio (music bed, ducking, sound effects, licensing) read `references/sound.md`.

### 8. Review loop

```bash
node tools/frames.mjs --every 3        # → out/review/sheet.png
```

Look at the contact sheet like a picky creative director. Use the checklist in `references/review.md`,
which covers typography, legibility, overlap, camera, sync, truth, data and audio. Fix, re-render frames,
look again. Expect at least two passes. Most of the quality comes from this loop, and the first pass
always finds something. Render specific moments with `--at 12.5,30` when checking a fix.

### 9. Render, check, deliver

```bash
npx remotion render src/index.ts Video-4x5 out/video.mp4 --crf=16
node tools/qa.mjs out/video.mp4 --aspect 4:5          # add --silent for voice-free videos
```

`qa.mjs` checks size, frame rate, length, file size, loudness, true peak and silent gaps, and writes a
contact sheet of the final file. Look at that sheet too: it is what the viewer gets. Then deliver:

- the MP4, and where it is;
- a one-paragraph summary of the story, length and format;
- credits and licences: the voice provider (free plans may require credit), the music source and licence;
- anything you assumed or couldn't verify, such as a template still awaiting approval or a number you
  couldn't confirm.

Offer variants that are cheap now: another aspect ratio (re-render the other composition), a shorter cut,
another language voice.

## Licences, costs, ethics

- **Remotion** is free for individuals and companies of up to 3 people. Larger companies need a company
  licence (remotion.pro). Mention this if the user is a bigger company.
- **ElevenLabs:**
  - Its free plan requires attribution and is meant for non-commercial use. Paid plans include a
    commercial licence.
  - The music API needs a paid plan, and some output formats need higher tiers.
  - Each take costs about as many credits as the script has characters.
- **Music** must be licensed: Pixabay Music, the YouTube Audio Library, or a paid library. Never use
  commercial songs. Many free tracks are registered with YouTube Content ID. That's fine for DMs and
  websites, but claims can appear on YouTube.
- **Don't imitate other brands.** The phone mock-up is deliberately generic. Show the product's real
  messages, not a pixel copy of another company's app.
- **Privacy.** Use demo data only. Blur anything personal. Never put real customers in a public video.
