import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing } from "remotion";
import { BRAND } from "./brand";

// One display family for everything. Swap the import for the product's own font if it has one on Google Fonts.
export const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

export const FPS = 30;

function mix(hex: string, withHex: string, amount: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(hex), p(withHex)];
  return "#" + a.map((v, i) => Math.round(v + (b[i]! - v) * amount).toString(16).padStart(2, "0")).join("");
}
const alpha = (hex: string, a: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};

/** Calm neutrals (they work with any accent) plus the brand accent and its tints. */
export const C = {
  bg: "#F7F8FB",
  surface: "#FFFFFF",
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  line: "#E2E8F0",
  accent: BRAND.accent,
  accentDeep: mix(BRAND.accent, "#000000", 0.28),
  accentSoft: mix(BRAND.accent, "#FFFFFF", 0.88),
  glow: alpha(BRAND.accent, 0.22),
  warn: "#B45309",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
};

/** Ease-out-expo: decisive entrances that settle without bounce. Use it for almost everything. */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const shadow = {
  card: "0 1px 2px rgba(15,23,42,0.06), 0 12px 32px -12px rgba(15,23,42,0.18)",
  float: "0 2px 6px rgba(15,23,42,0.06), 0 40px 90px -30px rgba(15,23,42,0.35)",
};
