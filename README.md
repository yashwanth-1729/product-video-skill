# product-video

**A Claude skill that turns a real web app into a professional, motion-graphics product video.** It covers
the story, a claims check against the real product, scripted screen recording with a camera that follows
the cursor, voiceover with word-level sync, Remotion composition, a broadcast-level sound mix, and a
frame-by-frame review. You describe the video; Claude makes it.

<p align="center">
  <img src="docs/preview.gif" width="360" alt="Preview of a pitch video made with this skill">
</p>

<p align="center"><b><a href="docs/clevo-pitch.mp4">▶ Watch the full 75-second example</a></b> · made with this skill for <b>Clevo</b>, a hospital automation product</p>

![Contact sheet of the example video](docs/contact-sheet.jpg)

## What you get

Ask for something like *"make a 60-second pitch video of my app for investors"*, and Claude:

1. **Writes the story:** problem, promise, 3–5 proof moments, trust, one clear ask. It then **checks every
   claim against the product** and stops if the script promises something that isn't built.
2. **Gets the product camera-ready:** healthy demo data, no internal codes on screen, personal data blurred,
   happy-path inputs.
3. **Records the real app** with a scripted browser at 2× resolution and a smooth drawn cursor. Every cursor
   move is logged so the video's camera can follow it.
4. **Voices it** with ElevenLabs (with automatic transcription checks for misread words), your own recording
   (auto-synced), or no voice at all (captions only).
5. **Composes it in Remotion:**
   - Kinetic type, the product in calm browser frames and a phone showing real messages.
   - Captions, and scenes that cut on the words that introduce them.
   - Output in **4:5, 9:16, 16:9 or 1:1** from one storyboard.
6. **Mixes the sound:** voice at -16 LUFS, licensed music ducked under it, subtle effects tied to what's on
   screen.
7. **Reviews it like a creative director:** contact sheets of still frames and a defect checklist, at least
   two passes, then automatic checks on the final file (size, length, loudness, true peak, silences).

## Install

**Claude Code (plugin):**

```bash
claude plugin marketplace add yashwanth-1729/product-video-skill
claude plugin install product-video@product-video-skill
```

**Claude Code (plain skill):** copy `skills/product-video` into `~/.claude/skills/` (or your project's
`.claude/skills/`).

**Claude.ai:** download `product-video.skill` from the
[Releases](https://github.com/yashwanth-1729/product-video-skill/releases) page and upload it under
Settings → Capabilities → Skills. Video work needs a local environment with Node and a browser, so Claude
Code is the best fit.

## Use

Just ask, in your own words:

> Make a 45-second launch reel of my app at localhost:3000 for Instagram. No voiceover, captions only.

> I need a 60-second pitch video for investors from our staging site, 4:5 for DMs, with a professional
> male voice. My ElevenLabs key is in .env.

> Turn our dashboard into a 30-second product demo for LinkedIn, 16:9, with our logo and brand colour.

Claude asks only what it can't infer (audience, where it'll be watched, length, voice), proposes defaults
for the rest, and shows you frames before the final render.

## Requirements

- **Node.js 18 or newer** (tested on 22) and about 1 GB of disk for Chromium and Remotion. ffmpeg comes
  bundled with Remotion, so nothing else needs installing.
- **Optional: an ElevenLabs API key**, for AI voice, voice verification, own-voice alignment and sound
  effects. The free plan works for trying it out (see licences below).
- **Your app,** running somewhere a browser can reach: localhost, staging, or a static build.
- Tested on Windows 11. The tools are plain Node and cross-platform.

## Usage and plan limits

<!-- USAGE:START -->
Measured on the test runs below (Claude Sonnet 5.5, from brief to final file):

| Video | Tokens processed | Of which new input | Output |
|---|---|---|---|
| 53 s investor pitch, with voiceover | 17.4 M | 1.3 M | 0.14 M |
| 31 s vertical reel, no voice | 13.1 M | 1.3 M | 0.15 M |

So **a finished 1-minute video takes roughly 15–20 million tokens**, about 90% of them cached context
being re-read on each step (which counts far less towards limits than new tokens).

| Plan | Share of one 5-hour session per 1-minute video | Share of the weekly limit |
|---|---|---|
| Claude Pro | about 20–40% | about 3–5% |
| Claude Max 5x | about 4–8% | under 1% |
| Claude Max 20x | about 1–2% | well under 1% |

These are estimates from the plan's usage meter while the runs were going, not official figures: plan
limits aren't published in tokens and vary with load. Opus uses limits faster than Sonnet, and every extra
review pass or re-recording adds to it. A fresh session is cheaper than adding a video to a long one.
<!-- USAGE:END -->

## How it works

```
skills/product-video/
├── SKILL.md                    the workflow Claude follows
├── references/                 read on demand: story, recording, voice, motion, sound, review, troubleshooting
├── scripts/init.mjs            creates a video project from the template
└── assets/template/            a ready Remotion project
    ├── scenes.config.mjs       what to record (one moment per scene)
    ├── script.txt              the voiceover, with [delivery cues]
    ├── tools/                  record · voice · align · sfx · frames · qa
    └── src/                    brand, formats, timing (word-anchored), scenes, components
```

The core idea is that **the voiceover is the clock**. Every voice source is converted to word timings
(`public/audio/words.json`), and scenes are placed with `at("phrase")`. Swap the voice, the language or the
take, and the video re-times itself.

## Tests

<!-- TESTS:START -->
Two briefs for a fictional invoicing app (Ledgerbird), each given to Claude Sonnet 5.5 running unattended,
once with this skill and once without it.

**1. "A ~30 second vertical launch reel for Instagram, no voiceover, clean and premium."**

| Check | With the skill | Without |
|---|---|---|
| 1080×1920, 20–40 s | ✅ 31.2 s | ✅ 30.0 s |
| Real app footage, no invented claims | ✅ every claim mapped to a screen | ✅ |
| Frames reviewed before delivery | ✅ 3 passes | ✅ |
| Ends with a clear call to action | ✅ | ✅ |
| Framing | ✅ nothing cut at the edges | ⚠️ headings and rows cropped at the frame edge |
| File size | 9.2 MB | 25.6 MB |

![Reel made with the skill](docs/tests/reel-with-skill.jpg)

Without the skill, Claude still made a good-looking reel (dark, dramatic, with a spotlight on the active
row), so on a short silent reel the gap is mostly polish and consistency:

![Reel made without the skill](docs/tests/reel-without-skill.jpg)

**2. "A 45–60 second pitch for angel investors, 4:5, professional male voiceover, script under 900
characters, at most 2 voice takes."**

| Check | With the skill |
|---|---|
| 1080×1350 with audio, 45–60 s | ✅ 52.7 s |
| Loudness −18 to −13 LUFS, true peak ≤ −1 dBTP | ✅ −16.5 LUFS, −4.7 dBTP |
| Scenes synced to the narration | ✅ cut on word timings |
| Credit budget | ✅ 831 characters, 1 take |
| No false claims | ✅ no revenue, users or results claimed; demo data labelled |
| One clear ask | ✅ "Reply to book a 15-minute walkthrough" |

![Pitch made with the skill](docs/tests/pitch-with-skill.jpg)

The run without the skill for this brief was stopped partway to stay within plan limits, so there's no
comparison yet. Small defects the skill's own review left in: a heading clipped at the top of two frames,
and one beat that fades out too early.
<!-- TESTS:END -->

The test cases live in `skills/product-video/evals/` in the `claude plugin eval` format, with a small
fictional demo app (Ledgerbird). Run them yourself with `claude plugin eval . --scaffold`.

## Licences and credits

- **This skill:** MIT.
- **Remotion** is free for individuals and companies of up to 3 people; larger companies need a
  [company licence](https://www.remotion.pro).
- **ElevenLabs:** the free plan requires attribution and is meant for non-commercial use. Paid plans include
  a commercial licence.
- **Music:** use licensed tracks only. The skill explains Pixabay Music and YouTube Audio Library terms,
  including Content ID.
- **Example video:** made for Clevo (shown with permission). Voice: ElevenLabs. Music: "Ambient Corporate
  Business Background" by alex-morgan, from Pixabay (Pixabay Content License). All patient data is fictional.

## Author

Built by **Yashwanth Cherukuri** while making Clevo's pitch video with Claude Code. Issues and pull requests
are welcome, especially new scene blocks, formats and voice providers.
