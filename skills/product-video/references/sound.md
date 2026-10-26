# Sound

Sound is half of "professional". A clean voice at a consistent level, music that sits under it, and a few
quiet effects tied to what's on screen. Most amateur videos fail on level: music too loud, voice too quiet.

## Targets

| Thing | Target | Why |
|---|---|---|
| Whole video, integrated | **-16 LUFS** (−14 to −16 is standard for social and web) | Platforms normalise loudness; this lands consistently |
| True peak | **≤ −1 dBTP** | Avoids clipping after platform encoding |
| Music under voice | **18–24 dB below the voice** | Felt, not competing; words stay clear on phone speakers |
| Music in pauses / end card | Rises to about 8–12 dB below voice level | Keeps energy between lines |
| Sound effects | Subtle (volume 0.15–0.35) | Texture, never punctuation |

`node tools/qa.mjs out/video.mp4` measures integrated loudness and true peak (via ffmpeg's loudnorm
analysis) and flags long silences.

## Voice

The voice and align tools normalise speech to -16 LUFS with a two-pass linear loudnorm, so the voice keeps
its natural dynamics. `<Voice />` plays it from `VO_START` (0.6 s). If you replace `vo.mp3` by hand,
normalise it the same way (`normalizeVoice` in `tools/lib/media.mjs`).

## Music

- **Licensed only.** Good free sources:
  - **Pixabay Music:** commercial use allowed, no attribution required. Download it yourself or ask the
    user to. Many tracks are registered with YouTube Content ID; the licence still permits use and claims
    can be cleared, but warn the user if the video is going to YouTube.
  - **YouTube Audio Library:** read each track's attribution terms.
  - **ElevenLabs Music:** paid plans only.

  Never use commercial songs.
- **Character:** for product films, use calm, modern, minimal tracks (soft piano, airy pads, light
  percussion) at about 85–110 BPM, without vocals. Tags like "corporate ambient", "minimal technology" and
  "non-distracting" find them.
- **Setup:** put the file in `public/audio/` and set `BRAND.music = "audio/music.mp3"`. `<Music />` loops it
  if it's shorter than the video and fades it in and out.
- **Ducking:** `<Music />` builds a volume envelope from the voice's word timings. It sits at `under`
  (0.075, roughly −22 dB) while the voice speaks and rises to `gaps` (0.2) in pauses. In voice-free videos it
  plays at `noVoice` (0.32), and after the voice ends at `outro` (0.5). These defaults assume a mastered track
  around −10 LUFS. If `qa.mjs` reports the mix too loud or quiet, scale them.
- **End card:** music alone is quieter than voice plus music. The `outro` level brings it up so the ending
  doesn't feel like it dropped out. Aim for the end card around −26 to −24 LUFS.

## Sound effects

- `node tools/sfx.mjs` generates soft `click`, `pop` and `whoosh` sounds with ElevenLabs (free tier works)
  into `public/audio/sfx-*.mp3`. Then set `BRAND.sfx`.
- Tie every effect to something visible:
  - `Clicks` plays a soft click on each click the viewer sees in a recorded scene (from the recorder's marks).
  - A `pop` lands when a phone message arrives: `<Sfx at={bubble.at} src={BRAND.sfx.pop} volume={0.3} />`.
  - A `whoosh` sits about 0.15 s before major scene changes, at volume 0.15–0.2.
- Render `Sfx` and `Clicks` at the top level of `Video` (absolute times), not inside scenes.
- Less is more: if you notice the effects, they're too loud or too many.

## Checking

1. `node tools/qa.mjs out/video.mp4` gives integrated loudness, true peak and silences.
2. Listen once on a phone speaker and once on headphones. Words must be clear over the music on the phone.
3. Check the first and last seconds. Music should fade in and out, never start or stop abruptly.
