import { createContext, useContext } from "react";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Layout metrics for one aspect ratio. Scenes read these instead of hard-coding positions. */
export interface Format {
  width: number;
  height: number;
  pad: number; // side margin
  headTop: number; // top of the kicker + headline block
  headSize: number; // headline font size
  headWidth: number; // headline column width (16:9 puts it in a left column)
  kickerSize: number;
  bodySize: number;
  statement: number; // big centred statements
  screen: Box; // product screen when a phone sits beside it
  wide: Box; // product screen on its own
  phone: { x: number; y: number; scale: number };
  /** Where the camera puts its subject across the screen when a phone overlaps it (0.5 = centre). */
  screenFocus: number;
  captions: { bottom: number; size: number; maxWidth: number };
}

// Measured to keep UI legible on a phone: in the 4:5 and 9:16 layouts a 14 px label in the app,
// recorded at 2× and zoomed ~1.6×, lands around 18–20 px on a 1080-wide frame.
export const FORMATS = {
  // Feeds, DMs, WhatsApp: fills most of a phone screen and still plays well on desktop.
  "4:5": {
    width: 1080, height: 1350, pad: 72, headTop: 96, headSize: 78, headWidth: 936, kickerSize: 24, bodySize: 34, statement: 110,
    screen: { x: 40, y: 372, w: 672, h: 720 },
    wide: { x: 44, y: 380, w: 992, h: 760 },
    phone: { x: 724, y: 432, scale: 1 },
    screenFocus: 0.5,
    captions: { bottom: 64, size: 34, maxWidth: 920 },
  },
  // Reels, Shorts, TikTok, Stories.
  "9:16": {
    width: 1080, height: 1920, pad: 72, headTop: 150, headSize: 88, headWidth: 936, kickerSize: 26, bodySize: 38, statement: 124,
    screen: { x: 40, y: 470, w: 1000, h: 700 },
    wide: { x: 40, y: 470, w: 1000, h: 1000 },
    phone: { x: 640, y: 1010, scale: 1 },
    screenFocus: 0.42,
    captions: { bottom: 150, size: 40, maxWidth: 960 },
  },
  // YouTube, LinkedIn, websites, presentations: text in a left column, product on the right.
  "16:9": {
    width: 1920, height: 1080, pad: 110, headTop: 150, headSize: 74, headWidth: 600, kickerSize: 22, bodySize: 30, statement: 124,
    screen: { x: 760, y: 150, w: 760, h: 760 },
    wide: { x: 760, y: 140, w: 1060, h: 800 },
    phone: { x: 1550, y: 220, scale: 1 },
    screenFocus: 0.5,
    captions: { bottom: 56, size: 32, maxWidth: 1200 },
  },
  "1:1": {
    width: 1080, height: 1080, pad: 64, headTop: 72, headSize: 66, headWidth: 950, kickerSize: 22, bodySize: 30, statement: 96,
    screen: { x: 40, y: 300, w: 680, h: 600 },
    wide: { x: 44, y: 300, w: 992, h: 640 },
    phone: { x: 740, y: 330, scale: 0.86 },
    screenFocus: 0.5,
    captions: { bottom: 40, size: 30, maxWidth: 900 },
  },
} satisfies Record<string, Format>;

export type FormatName = keyof typeof FORMATS;

export const FormatContext = createContext<Format>(FORMATS["4:5"]);
export const useFormat = () => useContext(FormatContext);
/** True when text sits in a left column beside the product (16:9) rather than above it. */
export const isLandscape = (f: Format) => f.width > f.height;
