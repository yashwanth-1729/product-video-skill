# Recording the product

The recorder (`tools/record.mjs`) drives a real browser through each scene at a calm, human pace, with a
smooth drawn cursor, and captures frames straight from Chrome at 2× resolution. Every cursor move is
logged so the composition's camera can follow the action. You write the scenes; it does the rest.

## Contents
- Data hygiene: make the product camera-ready
- scenes.config.mjs
- Choosing a viewport
- Moving the cursor for the camera
- Logins and state
- Selectors that don't break
- Checking a recording
- Recording real messages (optional)

## Data hygiene: make the product camera-ready

Do this before the first take. These problems are invisible in daily use and glaring on camera.

- **Healthy, current data.** Dashboards should show a business that works: bookings, not "0 booked";
  a short queue of open tasks, not 172 unresolved warnings; dates around today, not last month. If the
  data comes from a generator, fix the generator (include today, upcoming items, older items already
  handled) rather than editing screenshots. Regenerate anything derived from it, such as AI summaries
  and cached reports.
- **Realistic, fictional people.** Plausible names, fictional records, a name or mark on the screen that
  reads as a demo ("Demo Clinic", "Acme"), never real customers.
- **No internal codes or jargon on screen.** Enum names (`CARE_OVERDUE`), stack traces, debug badges,
  model names, "worker online" indicators. Hide chrome with the config's `css`, and fix product text the
  user would also see.
- **Personal data blurred.** Phone numbers, emails, addresses. Put selectors in `css`, e.g.
  `input[type=tel], [data-private] { filter: blur(6px); }`. If a real phone number must receive a real
  message for proof, blur it on screen anyway.
- **Happy-path inputs.** Choose inputs that exercise the flow you want to show. A demo enquiry mentioning
  "chest pain" will rightly be routed to a human as an emergency. That's correct behaviour, but it's the
  wrong demo.
- **AI features rehearsed.** Run the exact prompt you'll show and read the answer. Prefer prompts with
  crisp, positive, specific answers. If answers show markdown asterisks, jargon or a negative tone, fix the
  product's prompt or pick another question before recording.
- **Locale and formats.** Set `locale` and `timezoneId` so dates and currency look native to the audience.
  Headless Chrome may ignore the locale inside native date inputs; avoid lingering on them.
- **Temporary settings.** If you turn off sign-out-on-reload, captchas or rate limits for recording, write
  them down and turn them back on afterwards.

## scenes.config.mjs

```js
export default {
  baseUrl: "http://localhost:3000",          // or https://staging…, or a file:// URL of a static build
  viewport: { width: 1280, height: 1100 },
  scale: 2,
  locale: "en-US",
  timezoneId: "Asia/Kolkata",
  css: `input[type=tel] { filter: blur(6px) } .dev-badge { display: none }`,
  login: async (page, role, { url }) => { /* sign in as a demo account; see "Logins" */ },
  scenes: {
    booking: {
      start: "/enquiry",
      login: undefined,             // or "admin": calls config.login(page, "admin") first
      view: { width: 900, height: 1100 },   // optional per-scene viewport
      before: 20000,                // optional ms to wait before this scene (e.g. for a message to arrive)
      settle: 1500,                 // ms after load before the camera rolls
      run: async (page, h) => {
        await h.type(page.getByLabel("Full name"), "Priya Sharma");
        await h.select(page.locator('select[name="department"]'), "Cardiology");
        await h.click(page.getByRole("button", { name: "Request appointment" }));
        await h.sleep(3000);        // hold on the result: the composition needs a beat after each action
      },
    },
  },
};
```

Helpers (all logged for the camera): `h.click(locator, pause?)`, `h.type(locator, text, delay?)`,
`h.select(locator, label)`, `h.moveTo(locator)` (alias `h.hover`), `h.scroll(y, ms)`, `h.sleep(ms)`.

Keep each scene to one moment (5–15 s of action) and end with a held result (2–3 s). Many short scenes
give the editor freedom; one long walkthrough doesn't.

## Choosing a viewport

The camera crops and zooms, so the viewport decides how big text can get:

- **4:5 and 9:16 videos:** 1280×1100 at 2× is a good default. Tall pages frame naturally.
- **16:9 videos:** 1440×900.
- **Wide tables, long rows, chat answers:** record that scene narrower (`view: { width: 900, height: 1100 }`).
  Content wraps into a tighter block, and the camera can zoom closer while keeping whole lines in frame.
  This is the fix whenever text looks too small in review.
- Keep `scale: 2`. Text stays sharp when the camera zooms to 1.5–1.9×.

Legibility target: an app's 14 px label should land around 16–20 px on a 1080-wide frame. Roughly,
`font px × (frame width ÷ viewport width) × zoom ≥ 16`.

## Moving the cursor for the camera

The camera goes where the cursor goes and fits the element it lands on. A wide element (a row, a card)
zooms out until it fits; a small control gets a close-up. So:

- **Hover the thing that tells the story, then act.** `h.moveTo(row)` then `h.click(toggle)` keeps the row's
  label in view. Clicking a tiny toggle cold zooms onto the toggle alone.
- **Hold after each action** (`h.sleep(1500)` or more) so the result is on screen long enough to read.
- **One path through the page.** Back-and-forth cursor travel makes the camera swim.
- **Scroll deliberately**, with `h.scroll(y, 1600)`. The camera follows the content.
- For moments you'll frame by hand (a summary card, a total), it's fine to record without moves and give
  the composition explicit `shots` instead (motion.md).

## Logins and state

- Prefer a demo account or a one-click demo login over typing passwords. Never record real customer data.
- `config.login(page, role, { url })` runs before scenes that set `login: "<role>"`. Each scene starts in a
  fresh browser context, so login state doesn't leak between scenes.
- Some apps sign you out on full page loads (a security feature). The recorder's `page.goto` counts as one,
  so turn that off on the demo server while recording and back on after.
- Flows that build on each other (register → consult → dispense → bill) must run in order and target the
  same record. Find rows by the name you created (`page.locator("li", { hasText: "Priya Sharma" })`), not
  "the first row". Seeded data may already be in the queue ahead of you.

## Selectors that don't break

- Use Playwright's role and label locators (`getByRole`, `getByLabel`, `getByText`).
- **Scope to the form or card you mean.** Pages often contain hidden duplicates (a hidden `reason` input in
  another form). `page.locator("form:has(select[name=doctor])").locator("input[name=reason]")` beats
  `page.locator("input[name=reason]").first()`. Symptom of the wrong one: "element is not visible" timeouts.
- Wait for states, not time, when something is asynchronous:
  `await page.locator('[aria-label="Thinking"]').waitFor({ state: "detached", timeout: 60000 })`.
- On failure the recorder saves `public/rec/<scene>-error.png` and moves on to the next scene. Read that
  screenshot first.

## Checking a recording

```bash
node tools/frames.mjs --video public/rec/booking.mp4 --every 2 --out out/rec-booking
```

Look for: the right record on screen, readable text, no personal data, no stray dialogs, the result held
long enough at the end. Re-record freely, it only takes seconds.

## Recording real messages (optional)

Showing a real WhatsApp or SMS arriving is strong proof. Only send to numbers the user owns and has
approved, through the product's own approved templates. Either:

- have the user screen-record their phone while you trigger the flow, then place the clip in a `Phone`-
  sized frame; or
- show the message text in the generic `Phone` component, using the exact text the product sends.

Never fabricate a message the product doesn't send.
