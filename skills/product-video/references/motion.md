# Composition and motion

The template is a Remotion project: the video is a React tree rendered frame by frame. `src/Video.tsx` is
the storyboard, `src/scenes/scenes.tsx` holds the scene building blocks, `src/components/` the primitives.
This file explains how the pieces fit and the design choices behind them, so you can extend them without
losing the polish.

## Contents
- The clock: phrases, not seconds
- Files
- Scene blocks
- The screen and its camera
- Formats and layout
- Typography and colour
- Motion
- Captions
- Pitfalls

## The clock: phrases, not seconds

`src/timing.ts` loads `public/audio/words.json` and exposes:

- `at("phrase", after?)` gives the absolute second a phrase starts being spoken. It throws if the phrase isn't
  in the voiceover. That's deliberate: a typo should fail loudly, not misplace a scene.
- `endOf("phrase")` gives when it finishes. `VO_END` and `TOTAL` mark the end of the voice and of the video
  (voice plus about 4.5 s of end card). `WORDS` is every word with its times.

Build the storyboard from anchors:

```tsx
const T = {
  hook: 0,
  intro: at("Clevo fixes that") - 0.25,     // scenes start just before the words that introduce them
  booking: at("When a patient") - 0.3,
  care: at("Between visits, it keeps") - 0.3,
  close: at("is built") - 0.25,
  end: VO_END,
};
<Scene from={T.booking} to={T.care}> … </Scene>
```

Events inside a scene use anchors too: a phone message lands at `at("books the appointment")`, a card pops
on the word that names it. Because nothing is hand-timed, a new voice take re-times the whole video.

## Files

| File | What to change |
|---|---|
| `src/brand.ts` | Name, tagline, logo, accent, app label, phone header, CTA, music, sound effects, caption spellings |
| `src/Video.tsx` | The storyboard: scenes, anchors, copy |
| `src/scenes/scenes.tsx` | Scene blocks. Extend them, keeping the shared layout and motion |
| `src/format.ts` | Layout metrics per aspect ratio. Rarely needs changing |
| `src/theme.ts` | Font and derived palette. Swap the font import if the product has a brand font |

## Scene blocks

All take **absolute** times and must sit inside `<Scene from to>`.

- **`Hook`**: optional lead line, big statement, then pains as chips. `drift` adds a field of dots where a few
  slip away, for "lost between X" stories only.
- **`LogoReveal`**: the logo arrives with a soft ring, the name rises, then the tagline. With `nodes` and
  `diagramAt` it moves up for a three-node "where it fits" diagram (e.g. Your system → Product → Customers),
  with flowing connectors and `lit` highlights on the word that names each node.
- **`ProductScene`**: kicker and headline plus the real product (`screen`), and optionally a `phone` with
  message `bubbles`. With a phone, screen and phone sit side by side (stacked with a small overlap in 9:16).
- **`Cards`**: up to four icon cards, 2×2, popping on the words that name them. Use these for breadth ("one
  system for the whole clinic") instead of tiny UI tiles nobody can read.
- **`Alerts`**: status cards sliding in, each with a destination chip ("→ Doctor"). Use for trust beats.
- **`Statement`**: big centred lines; `until` fades a line out to make room for the next.
- **`EndCard`**: logo, name, tagline, CTA pill and a sub-line. Hold it about 4 s.

A strong 60–75 s video typically runs: Hook → LogoReveal (with diagram) → 3–5 ProductScenes → Alerts or
Cards → Statement → EndCard.

## The screen and its camera

`<Screen name="booking" from={3.2} rate={1.5} … />` plays `public/rec/booking.mp4` inside a browser frame:

- `from` and `rate` choose the slice and speed. Speeds of 1–1.6 still look natural. Match the action to the
  voice, e.g. the form's submit should land just before the voice says "books the appointment". Recording
  marks have times (`public/rec/<name>.json`). Use them to compute a `from` and `rate` that put a click
  where you need it.
- **Cursor-following camera (default).** It glides to each cursor mark, starting `leadIn` (0.25 s) early so
  it arrives with the click. Movement is smoothed with critical damping (about 0.5 s to settle) and clamped
  so it never shows past the page edge. It fits the subject: wide elements zoom out to fit, small controls
  get up to `zoom` (default 1.7). Before the first mark it shows the page at `wide` (1.05).
- **Explicit `shots`.** `[{ t: 0, x, y, zoom }, { t: 6.4, x, y, zoom }]` in recorded-page coordinates and clip
  time. Use them for framing by hand: a summary card, a total, a success message after navigation (when
  the page changes, the last cursor mark no longer points at anything useful).
- `focusX` places the subject across the frame (0.5 = centre). `ProductScene` sets it from the format when a
  phone overlaps the screen, so the overlap never covers the subject.
- A scene whose recording doesn't exist yet shows a placeholder panel, so the storyboard can be built
  before recording.

Legibility rule: if a frame's UI text looks small in review, first record that scene with a narrower
viewport (recording.md), then raise `zoom` or use a closer `shot`. Don't just shrink the headline to make
room.

## Formats and layout

`FORMATS` in `src/format.ts` define positions for 4:5 (1080×1350), 9:16 (1080×1920), 16:9 (1920×1080) and
1:1 (1080×1080). Scene blocks read them through `useFormat()`, so one storyboard renders in every aspect:

```bash
npx remotion render src/index.ts Video-9x16 out/reel.mp4
```

- **4:5 and 1:1:** headline band on top, product below, phone beside it.
- **9:16:** headline on top, product in the middle, phone overlapping its lower right, captions higher up to
  clear app UI.
- **16:9:** headline in a left column, product on the right, phone at the far right.

When adding a block, read sizes from the format (`f.headSize`, `f.bodySize`, `f.screen`) rather than hard-
coding pixels, so it works everywhere.

## Typography and colour

- **One family** (Plus Jakarta Sans by default; use the product's brand font if it's on Google Fonts). Two
  weights do most of the work: 800 for headlines, 500–700 for everything else.
- **Headlines:** tight tracking (-0.035em), line-height about 1.04, one accent word in the brand colour. Mark
  it with `accent={["word."]}`, matching the word with its punctuation as written.
- **Colour:** neutrals plus the brand accent and its tints (`C.accentSoft`, `C.accentDeep`). Use red only
  for real problems ("✕", abnormal results). Use the light background unless the user asks for dark.
- **Kickers** (small uppercase labels with a drawn rule) tell the viewer which part of the story they're in:
  "Chronic care", "Lab follow-ups".

## Motion

- **Easing:** `easeOut` (ease-out-expo, `bezier(0.16, 1, 0.3, 1)`) for almost everything: decisive, no bounce.
- **Durations:** entrances 0.6–0.9 s, words staggered 0.05–0.1 s, scene fade-out 0.35 s (built into
  `<Scene>`). Nothing slower than about 1 s unless it's the camera.
- **What moves:** words rise into place, cards lift in, the screen frame tilts up from 3D and settles, the
  camera glides. Nothing spins, bounces or flashes.
- **Ambient life:** the background glows drift slowly. That's enough. Don't add particles or confetti.

## Captions

`<Captions hideBefore={T.intro} hideAfter={T.close} hide={[[a, b]]} />` shows short phrases (at most six
words, split at punctuation). Each word lights up as it's spoken. Hide captions over scenes whose big
type already says the same words, typically the hook and the close. Phonetic spellings are fixed through
`CAPTION_SPELLING`, and dotted acronyms are cleaned automatically.

## Pitfalls

- **Videos play from their scene's start.** Conditionally rendering a `<Screen>` partway through a scene
  makes it start mid-clip. Give every recording its own `<Scene>`.
- **Spaces collapse in inline-block word animations.** `Rise` uses a margin for spacing. Copy that pattern
  for any custom kinetic type.
- **`Sfx` and `Clicks` use absolute times.** Render them at the top level of `Video`, not inside a `<Scene>`.
- **JSON in `public/` is loaded at render time** (recordings), but `words.json` is imported at bundle time.
  Restart the studio after regenerating the voice.
- **Composition length** comes from `TOTAL`. If the end card cuts off, raise `OUTRO` in `timing.ts`.
