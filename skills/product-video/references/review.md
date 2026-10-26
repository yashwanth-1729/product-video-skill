# Review

The review loop is where most of the quality comes from. Render still frames, look at them critically,
fix, repeat. The first pass always finds something; plan for at least two.

## How to review

```bash
node tools/frames.mjs --every 3                 # contact sheet of the composition → out/review/sheet.png
node tools/frames.mjs --at 12.5,30.2 --scale 1  # full-size frames to inspect a fix
node tools/frames.mjs --video out/video.mp4 --every 4   # what the rendered file really looks like
```

Look at each frame twice: once at sheet size (roughly what a phone shows), once full size for detail.
Pick extra frames just after each scene change and at every phone message and card pop. That's where
timing bugs hide.

If the user can look too, send them the sheet or a short render. Their eye for their own product catches
things yours won't.

## Checklist

**Story and truth**
- [ ] Every claim on screen or in the voice exists in the product today (the storyboard's Evidence column).
- [ ] No numbers you can't stand behind. Dashboards and AI summaries in frame tell a positive, true story.
- [ ] The ask is singular and clear on the end card.

**Legibility**
- [ ] UI text in product scenes is readable at sheet size. If not: narrower recording viewport, closer zoom
      or shot.
- [ ] Headlines fit in at most 3 lines. Captions don't cover the subject.
- [ ] Nothing important is cut at a frame edge (labels, numbers, the end of a sentence).

**Composition**
- [ ] The phone never covers the part of the screen the voice is talking about.
- [ ] One accent colour. Red only for real problems.
- [ ] Every frame has one clear focal point. Empty frames are only at deliberate breaths.

**Camera**
- [ ] The camera arrives where the action is, with it, not after.
- [ ] After a page change (form submitted, navigation) the camera moves to the new content. Use `shots` if
      the last cursor mark points at something gone.
- [ ] No swimming: one path per scene.

**Timing and sync**
- [ ] Scenes cut on the words that introduce them.
- [ ] Cause precedes effect: the form submits before the confirmation message lands, and the click comes
      before the result.
- [ ] Phone messages, card pops and highlights land on the words that name them.
- [ ] The end card holds about 4 s. Nothing is cut off at the end.

**Type and motion**
- [ ] Spaces between words are intact in animated headlines.
- [ ] Words, cards and frames enter with the same easing. Nothing bounces or spins.
- [ ] Accent words are the right ones (punctuation included in `accent`).

**Data and privacy**
- [ ] No internal codes, enum names, debug badges, model names or "worker online" chrome.
- [ ] No real personal data. Phone numbers and emails are blurred.
- [ ] Dates look current and native (locale), names look plausible and fictional.

**Sound** (from `qa.mjs` and one listen)
- [ ] About -16 LUFS integrated, true peak ≤ −1 dBTP.
- [ ] Voice clear over music on a phone speaker. Music fades in and out.
- [ ] No long silences mid-video (unless intended).

## Common defects and fixes

| You see | Cause | Fix |
|---|---|---|
| Words run together in a headline | Trailing spaces in inline-block spans collapse | Use margins between word spans (as `Rise` does) |
| A recorded scene shows the wrong moment | The video started at its scene's start, not where you think | Give the recording its own `<Scene>`; set `from`/`rate` from its marks |
| Confirmation appears before the form is sent | Bubble timed to the voice, clip timed differently | Compute the submit time from the recording's marks; land the bubble after it |
| Camera stuck on an empty area after submit | Last cursor mark points at a control that's gone | Add `shots` that move to the success state |
| A label is cut off; camera zoomed on a tiny toggle | Clicked a small control cold | `h.moveTo(row)` before clicking; or a `shot` |
| UI text unreadable | Viewport too wide for the frame | Record that scene at ~900 px wide; raise `zoom` |
| Dashboard looks like it's failing | Stale or unhealthy demo data | Fix the data generator; regenerate summaries; re-record |
| "**bold**" asterisks in an AI answer | The product renders markdown as text | Fix the product's prompt or renderer; re-record |
| Voice says a cue word ("calm…") | Delivery cue read aloud | Reject the take; simplify the cues; regenerate |
| Music drowns the voice | Track hotter than assumed | Lower `under` and `gaps` in `<Music />`; re-check with `qa.mjs` |
