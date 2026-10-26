// What to record, and how. Each scene is one continuous take of a single moment in the product.
// Keep scenes short (5–15 s of action): the composition trims and speeds them, and re-recording one
// scene is cheap, so record many small ones rather than one long walkthrough.
//
//   node tools/record.mjs --list       node tools/record.mjs overview
//
// Helpers passed to run(page, h): h.click(locator), h.type(locator, text), h.select(locator, label),
// h.moveTo(locator) (hover, logged for the camera), h.scroll(y), h.sleep(ms).
// Locators are Playwright's: page.getByRole("button", { name: "Send" }), page.getByLabel("Email"), …
// Scope them to the form or card you mean: a page often has hidden duplicates of the same field.

export default {
  // Where the app runs: a dev server, a staging URL you own, or a file:// path to a static build.
  baseUrl: "http://localhost:3000",

  // A tall-ish viewport frames well in 4:5 and 9:16; use ~1440×900 for 16:9. Recorded at 2× for sharpness.
  viewport: { width: 1280, height: 1100 },
  scale: 2,
  locale: "en-US",
  timezoneId: "America/New_York",

  // Injected into every page. Blur anything personal (real phone numbers, emails, names), hide dev badges.
  css: `
    input[type=tel], input[name=phone], [data-private] { filter: blur(6px); }
  `,

  // Optional: sign in before scenes that set `login`. Prefer a demo/quick-login account; never real customer data.
  // login: async (page, role, { url }) => {
  //   await page.goto(url("/login"));
  //   await page.getByLabel("Email").fill(`${role}@demo.test`);
  //   await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD);
  //   await page.getByRole("button", { name: "Sign in" }).click();
  //   await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  // },

  scenes: {
    overview: {
      start: "/",
      note: "first look at the product",
      run: async (page, h) => {
        await h.sleep(1200);
        await h.moveTo(page.locator("main h1, h1").first());
        await h.sleep(1500);
        await h.scroll(400, 2000);
        await h.sleep(1200);
      },
    },
    dashboard: {
      start: "/",
      run: async (page, h) => {
        await h.sleep(1000);
        await h.scroll(250, 1800);
        await h.sleep(1500);
      },
    },
  },
};
