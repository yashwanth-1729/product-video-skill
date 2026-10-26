# Voice

The voiceover sets the pace of the whole video: every scene and caption is timed to its words. There are
three ways to get it. All three produce `public/audio/words.json` (the clock) and, for spoken versions,
`public/audio/vo.mp3` normalised to -16 LUFS.

| Option | Best for | Cost | Command |
|---|---|---|---|
| ElevenLabs | Polished narration, any language | Credits ≈ script characters per take | `node tools/voice.mjs --takes 3` |
| Your own recording | Founder pitches, authenticity | Free (alignment uses ElevenLabs Speech-to-Text, or bring a Whisper transcript) | `node tools/align.mjs --audio take.m4a` |
| No voice | Reels, muted feeds | Free | `node tools/align.mjs --estimate` |

## ElevenLabs

1. **Key.** `ELEVENLABS_API_KEY=sk_…` in `.env` (never commit it). A string without `sk_` is the key's *ID*,
   not the key. Real keys are shown once when created. Enable Text to Speech, Speech to Text and Voices
   access for the key.
2. **Voice.** `node tools/voice.mjs --voices` lists them. For professional narration, pick a voice whose
   description fits: "smooth, trustworthy", "steady broadcaster", "deep, resonant". The skill defaults to
   **Eric**. Offer the user 2–3 short samples when the voice matters to them, and let them choose by ear.
3. **Model.** `eleven_v4` (default): most expressive, follows bracketed delivery cues. `eleven_multilingual_v2`
   is steadier for some languages.
4. **Script.** See story.md for writing for the ear. ElevenLabs specifics:
   - One delivery cue per paragraph, e.g. `[warm, confident]`, describing the voice. No stage directions
     (`[walking]`) and no sound cues (`[music]`); those can come out as sound effects.
   - Ellipses (`...`) make weighted pauses. SSML `<break>` tags are not supported by v3/v4.
   - Don't overuse cues. Too many make the voice unstable: speed shifts, artifacts.
   - Spell acronyms with dots (`H.M.S.`, `A.I.`) and respell tricky names phonetically (`Nel-lore`).
5. **Takes.** `node tools/voice.mjs --takes 3`. Takes differ in delivery even with the same text. The tool
   prints each take's length and words per second (natural narration is about 2.4–2.8).
6. **Verify.** `node tools/voice.mjs --verify` transcribes each take and reports:
   - the share of script words heard, with missing and extra words;
   - **spoken delivery cues**, where the voice read a bracket tag aloud. Always reject those takes.

   A product name coming back spelled differently ("Klevo" for "Clevo") is usually just the transcriber's
   spelling. Listen before respelling. An acronym heard as a word ("HNMS") means it needs dots.
7. **Pick.** `node tools/voice.mjs --pick 2` normalises the take to -16 LUFS (two-pass, linear, so the voice
   keeps its dynamics) and writes `vo.mp3` and `words.json`. If the user can listen, send them the takes
   (`public/audio/takes/take-N.mp3`) and let them choose. Otherwise choose the clean take with the most
   natural pace.

Plan limits worth knowing, which change over time, so check the account if a call fails:

- The free plan has about 10,000 characters a month, needs attribution, and doesn't cover commercial use.
- 192 kbps output needs a higher tier. The default 128 kbps is fine for video.
- The Music API is paid plans only.
- A 60 s script is roughly 900–1,200 characters, so budget for verification takes.

The tool prints the expected credit use before generating; use `--dry` to see it without spending anything.

## Your own recording

Record in a quiet, soft-furnished room, phone about 20 cm from the mouth, one continuous take per
paragraph or the whole script. Then:

```bash
node tools/align.mjs --audio my-take.m4a          # transcribes with word timestamps, normalises to -16 LUFS
node tools/align.mjs --audio take.wav --words whisper.json   # use an existing word-level transcript instead
```

Open `public/audio/words.json` and check the words. Anchors in `src/Video.tsx` match on these words, so if
the speaker improvised, update the anchor phrases to what was actually said.

## No voice

```bash
node tools/align.mjs --estimate [--wps 2.6]
```

It builds a timeline from `script.txt` at reading pace, with pauses at punctuation and paragraph breaks.
`audio` stays null, so no voice track plays and captions carry the words. For reels, keep on-screen text
short and let each line hold at least 1.5 s. Raise `--wps` for a snappier cut and lower it for dense text.

## Changing the voice later

Because scenes are anchored to phrases, not seconds, you can regenerate the voice (new take, new voice,
new language) and the video re-times itself. Only phrases that no longer exist need new anchors. `at()`
throws an error naming the missing phrase.
