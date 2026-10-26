/**
 * Everything brand-specific lives here. Take the accent from the product itself (its primary button
 * or CSS variable) so the video and the app feel like one thing.
 */
export const BRAND = {
  name: "Your Product",
  tagline: "One line that says what it does for them",
  /** A file in public/ (svg/png), or null to show the name as a wordmark only. */
  logo: null as string | null,
  /** One accent colour. Everything else is calm neutrals: restraint is what reads as premium. */
  accent: "#4F46E5",
  /** Shown in the title bar of the browser frame around recordings. */
  appLabel: "Your Product",
  /** Header of the phone mock-up (only used if a scene shows messages). */
  messages: { title: "Your Product", subtitle: "WhatsApp · business account" },
  /** End card. For DMs, "Reply to …" beats a URL nobody can tap. */
  cta: "Reply to book a 15-minute demo",
  ctaSub: "Live today",
  /** Licensed music in public/ (e.g. "audio/music.mp3"), or null for none. Never commercial songs. */
  music: null as string | null,
  /** Sound effects in public/ from tools/sfx.mjs, or null to skip them. */
  sfx: { click: null as string | null, pop: null as string | null, whoosh: null as string | null },
};

/**
 * How words should be written in captions when the voice script spells them phonetically,
 * e.g. { "Nel-lore": "Nellore", "Klee-vo": "Clevo" }. Dotted acronyms (H.M.S.) are cleaned automatically.
 */
export const CAPTION_SPELLING: Record<string, string> = {};
