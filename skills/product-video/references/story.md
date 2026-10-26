# Story and script

A product video is persuasion with pictures. People fund, buy or reply because of a problem they feel and
proof they trust, not because of a feature tour. Decide the story before touching a screen.

## Contents
- The one-sentence promise
- The structure that works
- Writing for the ear
- Audience variants
- The storyboard file
- The claims check
- Worked example (a 75-second pitch)

## The one-sentence promise

Write the sentence every scene must serve: who it helps, with what, and how it feels. For example:

- "Clevo keeps patients from slipping away between visits, automatically, on WhatsApp."
- "Ledgerbird sends your invoices and chases them, so you get paid in days, not weeks."

If you can't write it, the product's positioning isn't settled. Ask the user rather than papering over it.

## The structure that works

| Beat | Share | Job |
|---|---|---|
| **Problem** | ~15% | The viewer's pain in their words. Concrete losses ("a missed call, a follow-up nobody made"). No product yet. |
| **Promise** | ~10% | The product's name and the one-sentence promise. A logo moment. |
| **Proof** | ~50% | 3–5 moments of the product doing the thing, each its own scene. Real UI, real outcomes. |
| **Trust** | ~10% | Why it's safe: a human stays in the loop, data is private, it fits what they already use. |
| **Ask** | ~15% | One clear next step and a reason to take it now. |

Rules of thumb:

- **Open on the problem, not the interface.** The first three seconds decide whether anyone keeps watching.
- **Proof moments over feature lists.** Three moments shown well beat ten features named. Pick the ones
  with a visible before→after: an enquiry answered, a reminder sent, a bill that builds itself.
- **One idea per scene, 4–8 s each.** A scene that needs a second idea needs a second scene.
- **Length:** 45–75 s for pitches, 20–35 s for reels. At ~2.6 spoken words per second, 150 words is about
  60 s of voice; budget 4–5 s more for the end card.
- **End with a single ask.** In DMs, "Reply to book a 15-minute demo" beats a URL nobody can tap.
  For investors: a pilot, a meeting. For customers: a trial, a demo.
- **Honest scale words.** "Built and live today", "ready for a pilot". Never claim customers, revenue or
  certifications you can't show.

## Writing for the ear

The script is spoken, then read as captions. Both reward short, plain sentences.

- Short sentences. Fragments are fine: "A missed call. A follow-up nobody made."
- Concrete nouns and verbs, not adjectives: "replies in seconds" beats "seamless engagement".
- One number per sentence at most, and only if it's true.
- Name the product early (by ~15% in) and again at the end.
- Read it aloud, or time it: at 2.6 words/s, cut until it fits.
- Spell for the voice, not the eye. Write acronyms with dots ("H.M.S.", "A.I.") so they're read as
  letters. Respell names the voice gets wrong ("Nel-lore"). Captions undo this automatically for dotted
  acronyms; add the rest to `CAPTION_SPELLING` in `src/brand.ts`.
- **Delivery cues** go in brackets, one per paragraph, describing the voice and not the action:
  `[calm, measured]`, `[warm, confident]`, `[serious, reassuring]`, `[brisk, upbeat]`, `[sincere, inspiring]`.
  Ellipses add weighted pauses. Don't stack cues; too many make the voice unstable (see voice.md).

## Audience variants

Same product, different emphasis:

| Audience | Lead with | Proof that lands | Ask |
|---|---|---|---|
| Investors / funders | The size of the problem, why now, that it already works | Live product, real flows, a credible team line | Meeting, pilot, intro |
| Buyers (owners, managers) | Money and time they lose today | Automation they don't have to supervise; a daily summary | Demo, pilot |
| Practitioners (doctors, staff) | Their day: interruptions, follow-ups, mistakes | Safety nets (allergy check, abnormal result routed), fewer clicks | Try it, demo |
| General social audience | A relatable pain in one line | One delightful moment, fast | Follow, sign up |

If the video will be sent to many different people, keep it general: no names, no single customer, the
whole product's value. If it's for one person, the opening and the ask can be personal, but the proof
must still be real.

## The storyboard file

Write `storyboard.md` in the video project before recording. It's the contract between story, recording
and composition:

```markdown
# <Product> — <purpose>, <format>, ~<length>s

Promise: <one sentence>
Audience / ask: <who> → <one next step>

| # | Beat | Voice line (anchor phrase in **bold**) | On screen | Scene / recording | Evidence |
|---|------|------------------------------------------|-----------|-------------------|----------|
| 1 | Problem | **Every hospital** works hard… | Kinetic type, pain chips | Hook | — |
| 2 | Promise | **Clevo fixes that.** … | Logo, "Your HMS → Clevo → WhatsApp" | LogoReveal | Integration endpoint exists |
| 3 | Proof | **When a patient enquires**, … | Booking form, phone shows confirmation | ProductScene: enquiry | Live booking + approved template |
| … |
```

The **bold anchor phrase** is what `at("…")` will look for in the voiceover; pick 2–4 distinctive words
that start the line.

## The claims check

Go through the script line by line and fill the Evidence column with where the product proves it: a page,
a flow, a real message, a test. Then sort every claim into one of three:

- **Real:** it exists, works, and you'll record it.
- **Partial:** it exists but not as the script implies. Reword the claim to match reality.
- **Missing:** it isn't built. Stop and tell the user. Offer to cut it, reword it as a direction ("next, we're
  building…"), or build it first if you're in their codebase and they agree.

Also check the claims that hide in visuals: a dashboard showing "Booked 0" or "172 need attention" claims
the product is failing; an AI summary saying "performance was poor" undercuts the pitch. Fix the data, not
the screenshot (see recording.md, data hygiene).

## Worked example: a 75-second general pitch

Purpose: sent to many hospital owners in DMs, 4:5, ElevenLabs voice. 187 words, about 70 s of voice.

```
[calm, measured] Every hospital works hard to treat its patients. But between visits... patients quietly
slip away. A missed call. A follow-up nobody made. A report nobody chased.

[warm, confident] Clevo fixes that. It's an A.I. layer that plugs into the H.M.S. you already use... and
handles patient follow-up on WhatsApp, automatically.

[clear, upbeat] When a patient enquires, Clevo replies in seconds... books the appointment... and sends
the reminders, so fewer patients miss their visit.

[steady, assured] Between visits, it keeps care on track. Diabetic and blood pressure patients are
reminded before every review. Lab reports reach patients the moment they're ready. And when someone
misses an appointment, Clevo offers the next open slot... and brings them back.

[serious, reassuring] Anything that needs a person goes straight to the doctor, or your front desk.
Nothing falls through the cracks.

[confident] No H.M.S. yet? Clevo can run the whole clinic. Reception, consultation, pharmacy and
billing... with allergy checks, and bills that build themselves.

[warm, lighter] And for you, every morning, a sixty-second summary of your hospital... and an assistant
you can simply ask.

[sincere, inspiring] Clevo is built, and live today. Let's set it up for your hospital... and let the
results speak.
```

What made it work: problem in concrete losses; the promise names the fit ("plugs into the HMS you already
use"); four proof moments, each one scene; a trust beat ("goes straight to the doctor"); a breadth beat for
those without software; an owner beat; one ask. While building it, the claims check found two promised
features that didn't exist yet. They were built before recording.
