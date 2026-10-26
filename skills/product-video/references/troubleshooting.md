# Troubleshooting

Every problem here actually happened while making real videos with this pipeline.

## Setup

**`npm install` fails with "'node' is not recognized" (Windows, Git Bash).**
Some packages run install scripts through cmd.exe, which doesn't see Git Bash's PATH. Run `npm install`
(and `npx playwright install chromium`) from PowerShell or cmd instead.

**`Cannot find package 'playwright'` when running a tool.**
Node resolves packages next to the script file. Run tools from inside the video project
(`node tools/record.mjs`), after `npm install`, not from the skill folder.

**`ffmpeg not found`.**
The tools look for `$FFMPEG`, then ffmpeg on PATH, then the copy inside `node_modules/@remotion/compositor-*`.
Run `npm install` in the video project, or set `FFMPEG=/path/to/ffmpeg`. Remotion's copy lacks a few
filters (ebur128, tile, acompressor), so the tools only use filters it has.

## Recording

**"element is not visible" timeout.**
The locator matched a hidden duplicate (another form's field, a template row). Scope it:
`page.locator("form:has(select[name=doctor])").locator("input[name=reason]")`. Check
`public/rec/<scene>-error.png`.

**The scene acted on the wrong record.**
Seeded data was ahead in the queue. Target the record you created by its text
(`page.locator("li", { hasText: "Priya Sharma" })`), not `.first()`.

**The app signed out between steps.**
Each `page.goto` is a full page load. Disable sign-out-on-reload on the demo server while recording, then
restore it.

**A demo flow took an unexpected path (e.g. flagged as an emergency).**
The input tripped a safety rule. Use a happy-path input ("routine check-up") for the demo.

**Dates show in the wrong format.**
Set `locale` and `timezoneId` in the config. Native date inputs in headless Chrome may still show US
order, so don't linger on them.

**The AI answer never appears.**
The model is slower in the browser than you expect. Wait for the loading indicator to detach
(`waitFor({ state: "detached", timeout: 60000 })`), not a fixed sleep.

**Only one frame captured; the recording is a still.**
The screencast only emits frames when the page changes. A scene with no motion is a still. That's fine,
since the composition's camera adds movement. Add a `h.moveTo` or `h.scroll` if you want visible activity.

## Voice

**`API key ID used as API key`.** You copied the key's ID. Create a new key; the `sk_…` value is shown once.

**`missing_permissions` / `user_read`.** The key lacks a permission. The tools don't need `user_read`,
but Text to Speech and Speech to Text must be enabled.

**`quota_exceeded`.** Out of characters. Shorten the script, or the user adds credits. A take costs about
as many credits as the script has characters, cues included.

**`output_format_not_allowed`.** Use the default `mp3_44100_128`. 192 kbps needs a higher plan.

**`paid_plan_required` for music.** The Music API needs a paid plan. Use a licensed track instead (sound.md).

**The voice reads an acronym as a word, or mispronounces a name.** Respell: `H.M.S.`, `A.I.`, `Nel-lore`,
then add caption fixes to `CAPTION_SPELLING`.

**Takes too long or short.** Natural narration is 2.4–2.8 words per second. Trim the script, or set
`--speed 1.05` (extremes hurt quality).

## Composition

**`"phrase" is not in the voiceover`.** `at()` didn't find it. The take said something else (own
recordings), or there's a typo. The error prints the first words; check `public/audio/words.json`.

**A recorded scene shows the wrong part of its clip.** Videos play from their scene's start. Give each
`<Screen>` its own `<Scene>`, and compute `from` and `rate` from the recording's marks.

**Words run together in headlines.** Spaces inside inline-block spans collapse. Use margins (see `Rise`).

**Sound effects at the wrong time.** `Sfx` and `Clicks` were rendered inside a `<Scene>`, where Sequence
offsets apply. Render them at the top level.

**The studio shows the old voice.** `words.json` is imported at bundle time. Restart the studio.

**The placeholder "isn't recorded yet" appears.** `public/rec/<name>.mp4` or `.json` is missing. Record the
scene, or fix the name.

## Render and QA

**`loudness NaN` / silent track.** The video has no audio, and Remotion writes a silent track. Pass
`--silent` to `qa.mjs` if that's intended.

**Rendering is slow.** Render review frames (`frames.mjs`) instead of full renders while iterating. For the
final render, `--concurrency` can raise parallelism on machines with spare cores.

**File too large for WhatsApp or DMs.** Re-render with a higher CRF (`--crf=20` to `23`). 75 s at CRF 16 is
about 20 MB; at CRF 22, about 8 MB.
