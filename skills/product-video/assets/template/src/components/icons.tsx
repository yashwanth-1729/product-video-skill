import type { ReactNode } from "react";

/** A small set of line icons (24×24, 1.8 stroke) for cards and diagrams. Add more as paths. */
export const ICONS: Record<string, ReactNode> = {
  rows: <path d="M4 6h16M4 12h16M4 18h10" />,
  chat: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1z" />,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6zM10 19a2 2 0 0 0 4 0" />,
  calendar: <path d="M5 6h14v13H5zM5 10h14M9 4v4M15 4v4" />,
  chart: <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  card: <path d="M4 7h16v10H4zM4 11h16M7 15h4" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5M16 4.5a3.5 3.5 0 0 1 0 6.8M18 15c1.6.6 2.6 2.2 3 5" />,
  spark: <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
  shield: <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  doc: <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />,
  send: <path d="M4 12l16-8-6 16-3-6-7-2z" />,
  repeat: <path d="M5 10a7 7 0 0 1 12-3l2 2M19 4v5h-5M19 14a7 7 0 0 1-12 3l-2-2M5 20v-5h5" />,
};

export function Icon({ name, size = 42, color }: { name: string; size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] ?? ICONS.spark}
    </svg>
  );
}
