import { interpolate } from "remotion";
import { BRAND } from "../brand";
import { C, easeOut, fontFamily, shadow } from "../theme";
import { Logo, progress, useT } from "./base";

export interface Bubble {
  /** Absolute time the message lands (a typing indicator shows for 0.8 s before). */
  at: number;
  /** The real message text the product sends. Never invent capabilities here. */
  text: string;
  time: string;
  /** "in" = received by the customer (left), "out" = sent by them (right). */
  side?: "in" | "out";
}

/**
 * A generic phone showing the messages a customer receives. Deliberately not any vendor's exact chrome:
 * show the product's real message text, not a pixel copy of someone else's app.
 */
export function Phone({ bubbles, enter, scale = 1, title = BRAND.messages.title, subtitle = BRAND.messages.subtitle }: { bubbles: Bubble[]; enter: number; scale?: number; title?: string; subtitle?: string }) {
  const t = useT();
  const k = progress(t, enter, 0.9, easeOut);
  return (
    <div
      style={{
        width: 330,
        height: 660,
        borderRadius: 54,
        padding: 11,
        background: "#0E1418",
        boxShadow: shadow.float,
        opacity: k,
        transform: `translateY(${(1 - k) * 120}px) rotate(${(1 - k) * 4}deg) scale(${scale})`,
        transformOrigin: "0% 0%",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 44, overflow: "hidden", background: "#EEF2F5" }}>
        <div style={{ position: "absolute", top: 10, left: "50%", width: 96, height: 26, marginLeft: -48, borderRadius: 20, background: "#0E1418", zIndex: 3 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "48px 16px 12px", background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 40, background: C.accentSoft, display: "grid", placeItems: "center", overflow: "hidden" }}>
            <Logo size={28} />
          </div>
          <div style={{ fontFamily, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 126, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily, fontSize: 12, fontWeight: 600, color: C.muted, background: "rgba(255,255,255,0.8)", padding: "4px 12px", borderRadius: 999 }}>Today</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 150, padding: "14px 12px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
          {bubbles.map((b, i) => {
            if (t < b.at - 0.8) return null;
            const out = b.side === "out";
            const align = out ? "flex-end" : "flex-start";
            if (t < b.at) {
              return (
                <div key={i} style={{ alignSelf: align, background: C.surface, borderRadius: 18, padding: "12px 16px", display: "flex", gap: 5 }}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} style={{ width: 7, height: 7, borderRadius: 7, background: C.muted, opacity: 0.35 + 0.65 * Math.abs(Math.sin((t * 6 + d) * 1.2)) }} />
                  ))}
                </div>
              );
            }
            const q = progress(t, b.at, 0.55, easeOut);
            return (
              <div
                key={i}
                style={{
                  alignSelf: align,
                  maxWidth: "92%",
                  background: out ? C.accentSoft : C.surface,
                  borderRadius: out ? "18px 6px 18px 18px" : "6px 18px 18px 18px",
                  padding: "11px 13px 7px",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.05), 0 6px 18px -10px rgba(15,23,42,0.25)",
                  opacity: q,
                  transform: `translateY(${(1 - q) * 18}px) scale(${0.94 + q * 0.06})`,
                  transformOrigin: out ? "100% 100%" : "0% 100%",
                  fontFamily,
                }}
              >
                <div style={{ fontSize: 15.5, lineHeight: 1.38, color: C.ink, whiteSpace: "pre-line" }}>{b.text}</div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: C.muted, textAlign: "right" }}>
                  {b.time}{" "}
                  <span style={{ color: C.accent, fontWeight: 700, opacity: interpolate(t, [b.at + 0.4, b.at + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>✓✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
