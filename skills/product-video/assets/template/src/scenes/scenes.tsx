import type { ReactNode } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BRAND } from "../brand";
import { isLandscape, useFormat } from "../format";
import { C, fontFamily, shadow } from "../theme";
import { Kicker, Logo, progress, Rise, useScene, useT } from "../components/base";
import { Icon } from "../components/icons";
import { Phone, type Bubble } from "../components/Phone";
import { Screen, type ScreenProps } from "../components/Screen";

/*
 * Scene building blocks. All times are ABSOLUTE video seconds (from at("phrase")); each block sits
 * inside a <Scene from to>. Compose them in src/Video.tsx. Change copy and timing freely; keep the
 * restraint (one accent, calm motion, real UI) that makes the result read as professional.
 */

// --- the headline block used by most scenes --------------------------------------------------------

export function Head({ kicker, title, accent, at, size }: { kicker?: string; title: string; accent?: string[]; at?: number; size?: number }) {
  const f = useFormat();
  const { from } = useScene();
  const start = at ?? from + 0.05;
  return (
    <div style={{ position: "absolute", left: f.pad, top: f.headTop, width: f.headWidth }}>
      {kicker && <Kicker at={start} size={f.kickerSize}>{kicker}</Kicker>}
      {kicker && <div style={{ height: f.kickerSize * 0.9 }} />}
      <Rise text={title} at={start + 0.12} size={size ?? f.headSize} accent={accent} />
    </div>
  );
}

// --- 1. the problem ----------------------------------------------------------------------------------

/**
 * Opens on the viewer's problem, not the product. A quiet lead line, one big statement, then the pains
 * as chips. `drift` (optional time) makes a field of dots where a few slip away: things lost between visits,
 * deals, follow-ups. Use it only if that metaphor is true for this product.
 */
export function Hook({ lead, statement, accent, pains = [], drift }: { lead?: { text: string; at: number }; statement: { text: string; at: number }; accent?: string[]; pains?: { text: string; at: number }[]; drift?: number }) {
  const t = useT();
  const f = useFormat();
  const firstPain = pains[0]?.at ?? Infinity;
  const dim = interpolate(t, [firstPain - 0.3, firstPain + 0.4], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const land = isLandscape(f);
  const textTop = land ? f.height * 0.16 : f.height * 0.17;
  const chipsTop = land ? f.height * 0.56 : f.height * 0.56;
  const cols = 9;
  const rows = land ? 4 : 6;
  const gridW = Math.min(f.width - f.pad * 4, 720);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: f.pad, right: f.pad, top: textTop, textAlign: "center" }}>
        {lead && <Rise text={lead.text} at={lead.at} size={f.bodySize * 1.15} weight={600} color={C.ink2} align="center" stagger={0.045} />}
        {lead && <div style={{ height: 30 }} />}
        <Rise text={statement.text} at={statement.at} size={f.statement * 0.9} align="center" accent={accent} stagger={0.1} />
      </div>
      {drift !== undefined && (
        <div style={{ position: "absolute", left: (f.width - gridW) / 2, top: chipsTop - 40, width: gridW, height: rows * 76, opacity: dim * progress(t, drift - 2.5, 1.2) }}>
          {Array.from({ length: cols * rows }, (_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const leaves = (c * 7 + r * 3) % 5 === 0;
            const q = leaves ? progress(t, drift + (i % 7) * 0.12, 2.2) : 0;
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: (c * gridW) / (cols - 1) - 8,
                  top: r * 76,
                  width: 16,
                  height: 16,
                  borderRadius: 16,
                  background: leaves && q > 0.02 ? C.danger : C.accent,
                  opacity: (leaves ? 1 - q : 0.85) * 0.8,
                  transform: `translate(${q * (60 + (i % 4) * 30)}px, ${q * (40 + (i % 3) * 25)}px) scale(${1 - q * 0.5})`,
                }}
              />
            );
          })}
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: chipsTop, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {pains.map(({ text, at }) => {
          const p = progress(t, at, 0.6);
          return (
            <div
              key={text}
              style={{
                fontFamily,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 30px 18px 22px",
                borderRadius: 999,
                background: C.surface,
                boxShadow: shadow.card,
                border: `1px solid ${C.line}`,
                fontSize: f.bodySize * 1.05,
                fontWeight: 700,
                color: C.ink,
                letterSpacing: "-0.02em",
                opacity: p,
                transform: `translateY(${(1 - p) * 26}px) scale(${0.96 + p * 0.04})`,
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 34, background: C.dangerSoft, color: C.danger, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800 }}>✕</span>
              {text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// --- 2. the answer -----------------------------------------------------------------------------------

export interface DiagramNode {
  label: string;
  sub?: string;
  icon: "logo" | string;
  at: number;
  /** Times during which the node glows. */
  lit?: [number, number];
}

/**
 * The logo arrives, then (optionally) moves up for a three-step "where it fits" diagram,
 * e.g. Your system → Product → Your customers. Keep it to three nodes.
 */
export function LogoReveal({ at, tagline, nodes = [], diagramAt }: { at: number; tagline?: string; nodes?: DiagramNode[]; diagramAt?: number }) {
  const t = useT();
  const f = useFormat();
  const pop = progress(t, at, 0.9);
  const up = diagramAt !== undefined ? progress(t, diagramAt - 0.55, 0.9) : 0;
  const ring = progress(t, at + 0.05, 1.6);
  const centerTop = f.height * 0.3;
  const node = Math.min(270, (f.width - f.pad * 2 - 2 * 80) / 3);
  const gap = Math.min(110, (f.width - node * 3) / 4);
  const rowW = node * 3 + gap * 2;
  const rowLeft = (f.width - rowW) / 2;
  const rowTop = f.height * (isLandscape(f) ? 0.5 : 0.47);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(up, [0, 1], [centerTop, f.height * 0.11]), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", transform: `scale(${interpolate(up, [0, 1], [1, 0.62]) * (0.7 + pop * 0.3)})`, opacity: pop }}>
          <span style={{ position: "absolute", left: "50%", top: "50%", width: 180, height: 180, marginLeft: -90, marginTop: -90, borderRadius: 999, border: `2px solid ${C.accent}`, opacity: (1 - ring) * 0.6, transform: `scale(${1 + ring * 1.2})` }} />
          <Logo size={180} />
        </div>
        <div style={{ marginTop: interpolate(up, [0, 1], [26, 0]), transform: `scale(${interpolate(up, [0, 1], [1, 0.7])})` }}>
          <Rise text={BRAND.name} at={at + 0.3} size={f.statement * 1.1} align="center" stagger={0.05} />
        </div>
        {tagline && (
          <div style={{ marginTop: 10, opacity: progress(t, at + 0.9, 0.8), fontFamily, fontSize: f.bodySize, fontWeight: 600, color: C.ink2, letterSpacing: "-0.01em", textAlign: "center", padding: `0 ${f.pad}px` }}>{tagline}</div>
        )}
      </div>
      {nodes.slice(0, 3).map((n, i) => {
        const p = progress(t, n.at, 0.7);
        const lit = n.lit ? progress(t, n.lit[0], 0.5) * (1 - progress(t, n.lit[1], 0.5)) : 0;
        const x = rowLeft + i * (node + gap);
        return (
          <div key={n.label} style={{ position: "absolute", left: x, top: rowTop, width: node, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
            <div style={{ width: node, height: node * 0.85, borderRadius: 32, background: C.surface, border: `1px solid ${lit > 0.01 ? C.accent : C.line}`, boxShadow: lit > 0.01 ? `0 0 0 ${8 * lit}px ${C.glow}, ${shadow.card}` : shadow.card, display: "grid", placeItems: "center" }}>
              {n.icon === "logo" ? <Logo size={node * 0.48} /> : <Icon name={n.icon} size={node * 0.36} color={C.accentDeep} />}
            </div>
            <div style={{ fontFamily, marginTop: 20, fontSize: f.bodySize * 0.95, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{n.label}</div>
            {n.sub && <div style={{ fontFamily, marginTop: 4, fontSize: f.bodySize * 0.65, fontWeight: 500, color: C.muted }}>{n.sub}</div>}
          </div>
        );
      })}
      {nodes.length > 1 &&
        nodes.slice(1, 3).map((n, i) => {
          const p = progress(t, n.at - 0.15, 0.6);
          const x1 = rowLeft + (i + 1) * node + i * gap + 10;
          const len = gap - 20;
          return (
            <div key={`w${i}`} style={{ position: "absolute", left: x1, top: rowTop + node * 0.425 - 2, width: len, height: 4 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: C.line }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${p * 100}%`, borderRadius: 4, background: C.accent, opacity: 0.35 }} />
              {p >= 1 &&
                [0, 0.5].map((o) => {
                  const k = (((t * 0.55 + o) % 1) + 1) % 1;
                  return <span key={o} style={{ position: "absolute", top: -5, left: k * len - 7, width: 14, height: 14, borderRadius: 14, background: C.accent, opacity: Math.sin(k * Math.PI) }} />;
                })}
            </div>
          );
        })}
    </AbsoluteFill>
  );
}

// --- 3. proof: the product doing the thing -----------------------------------------------------------

/**
 * Headline + the real product, optionally with a phone showing what the customer receives.
 * With a phone: product and phone side by side (never overlapping the part that matters).
 */
export function ProductScene({ kicker, title, accent, at, screen, phone, headSize }: { kicker?: string; title: string; accent?: string[]; at?: number; screen: Omit<ScreenProps, "width" | "height">; phone?: { bubbles: Bubble[]; enter: number }; headSize?: number }) {
  const f = useFormat();
  const box = phone ? f.screen : f.wide;
  return (
    <AbsoluteFill>
      <Head kicker={kicker} title={title} accent={accent} at={at} size={headSize} />
      <div style={{ position: "absolute", left: box.x, top: box.y }}>
        <Screen focusX={phone ? f.screenFocus : 0.5} {...screen} width={box.w} height={box.h} />
      </div>
      {phone && (
        <div style={{ position: "absolute", left: f.phone.x, top: f.phone.y }}>
          <Phone bubbles={phone.bubbles} enter={phone.enter} scale={f.phone.scale} />
        </div>
      )}
    </AbsoluteFill>
  );
}

// --- 4. breadth: a few capabilities at once ------------------------------------------------------------

/** Two-by-two cards that pop in on the words that name them. Better than tiny UI tiles nobody can read. */
export function Cards({ kicker, title, accent, cards }: { kicker?: string; title: string; accent?: string[]; cards: { title: string; sub: string; icon: string; at: number }[] }) {
  const t = useT();
  const f = useFormat();
  const land = isLandscape(f);
  const left = land ? f.screen.x : f.pad;
  const width = land ? f.width - f.screen.x - f.pad : f.width - f.pad * 2;
  const top = land ? f.headTop : f.headTop + f.headSize * 2.6 + f.kickerSize * 2;
  const cardH = land ? 330 : f.height > 1500 ? 380 : 300;
  return (
    <AbsoluteFill>
      <Head kicker={kicker} title={title} accent={accent} />
      <div style={{ position: "absolute", left, top, width, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {cards.slice(0, 4).map((c) => {
          const p = progress(t, c.at, 0.6);
          return (
            <div key={c.title} style={{ fontFamily, height: cardH, borderRadius: 30, background: C.surface, border: `1px solid ${C.line}`, boxShadow: shadow.card, padding: 34, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: p, transform: `translateY(${(1 - p) * 36}px) scale(${0.95 + p * 0.05})` }}>
              <span style={{ width: 76, height: 76, borderRadius: 22, background: C.accentSoft, display: "grid", placeItems: "center" }}>
                <Icon name={c.icon} color={C.accentDeep} />
              </span>
              <div>
                <div style={{ fontSize: f.bodySize * 1.3, fontWeight: 800, color: C.ink, letterSpacing: "-0.03em" }}>{c.title}</div>
                <div style={{ fontSize: f.bodySize * 0.78, fontWeight: 500, color: C.muted, marginTop: 6 }}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/** Stacked status cards sliding in: "who gets told when something needs a person". */
export function Alerts({ kicker, title, accent, items }: { kicker?: string; title: string; accent?: string[]; items: { title: string; sub: string; to: string; tone?: "danger" | "warn" | "ok"; at: number }[] }) {
  const t = useT();
  const f = useFormat();
  const land = isLandscape(f);
  const left = land ? f.screen.x : f.pad + 18;
  const width = land ? f.width - f.screen.x - f.pad : f.width - f.pad * 2 - 36;
  const top = land ? f.headTop + 20 : f.headTop + f.headSize * 2.6 + f.kickerSize * 2;
  const tone = { danger: C.danger, warn: C.warn, ok: C.accent };
  return (
    <AbsoluteFill>
      <Head kicker={kicker} title={title} accent={accent} />
      <div style={{ position: "absolute", left, top, width, display: "flex", flexDirection: "column", gap: 26 }}>
        {items.map((it) => {
          const p = progress(t, it.at, 0.7);
          const color = tone[it.tone ?? "ok"];
          return (
            <div key={it.title} style={{ fontFamily, display: "flex", alignItems: "center", gap: 22, padding: "28px 30px", borderRadius: 26, background: C.surface, border: `1px solid ${C.line}`, boxShadow: shadow.card, opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>
              <span style={{ width: 16, height: 16, borderRadius: 16, background: color, boxShadow: `0 0 0 7px ${color}22`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: f.bodySize * 0.95, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{it.title}</div>
                <div style={{ fontSize: f.bodySize * 0.68, color: C.muted, marginTop: 4 }}>{it.sub}</div>
              </div>
              <span style={{ fontSize: f.bodySize * 0.65, fontWeight: 700, color: C.accentDeep, background: C.accentSoft, padding: "10px 18px", borderRadius: 999, whiteSpace: "nowrap" }}>→ {it.to}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// --- 5. statements and the close -----------------------------------------------------------------------

/** Big centred lines, each rising on its own word. Use for transitions ("No system yet?") and the close. */
export function Statement({ lines, top }: { lines: { text: string; at: number; size?: number; weight?: number; color?: string; accent?: string[]; until?: number }[]; top?: number }) {
  const t = useT();
  const f = useFormat();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: f.pad, right: f.pad, top: top ?? f.height * 0.36, textAlign: "center" }}>
        {lines.map((l, i) => {
          if (l.until !== undefined && t > l.until) return null;
          const fade = l.until !== undefined ? 1 - progress(t, l.until - 0.4, 0.4) : 1;
          return (
            <div key={i} style={{ marginTop: i ? 24 : 0, opacity: fade }}>
              <Rise text={l.text} at={l.at} size={l.size ?? f.statement} weight={l.weight} color={l.color} accent={l.accent} align="center" stagger={0.08} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/** Logo, name, tagline and one clear next step. Hold it for ~4 s after the voice ends. */
export function EndCard({ at }: { at: number }) {
  const t = useT();
  const f = useFormat();
  const k = progress(t, at, 0.9);
  const cta = progress(t, at + 0.5, 0.7);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: k }}>
      <div style={{ transform: `scale(${0.9 + k * 0.1})` }}>
        <Logo size={Math.min(190, f.height * 0.14)} />
      </div>
      <div style={{ fontFamily, marginTop: 22, fontSize: f.statement * 1.05, fontWeight: 800, letterSpacing: "-0.04em", color: C.ink }}>{BRAND.name}</div>
      <div style={{ fontFamily, marginTop: 4, fontSize: f.bodySize, fontWeight: 600, color: C.ink2, textAlign: "center", padding: `0 ${f.pad}px` }}>{BRAND.tagline}</div>
      <div style={{ fontFamily, marginTop: 60, padding: "24px 40px", borderRadius: 999, background: C.accent, color: "white", fontSize: f.bodySize, fontWeight: 700, letterSpacing: "-0.01em", boxShadow: `0 20px 50px -18px ${C.accent}`, opacity: cta, transform: `translateY(${(1 - cta) * 20}px)` }}>
        {BRAND.cta}
      </div>
      {BRAND.ctaSub && <div style={{ fontFamily, marginTop: 26, fontSize: f.bodySize * 0.7, fontWeight: 500, color: C.muted, opacity: progress(t, at + 0.9, 0.7) }}>{BRAND.ctaSub}</div>}
    </AbsoluteFill>
  );
}

