import { AbsoluteFill } from "remotion";
import { Background, Scene } from "./components/base";
import { Captions } from "./components/Captions";
import { Music, Sfx, Voice } from "./components/Sound";
import { FORMATS, FormatContext, type FormatName } from "./format";
import { BRAND } from "./brand";
import { Cards, EndCard, Hook, LogoReveal, ProductScene, Statement } from "./scenes/scenes";
import { at, TOTAL, VO_END } from "./timing";

/*
 * THE STORYBOARD. This file is the video: each <Scene> runs from one spoken phrase to the next.
 * The example below matches script.txt. Rewrite it for the real story: change the phrases in T to words
 * that are actually in the voiceover (at() throws if a phrase isn't spoken), swap scenes, add recordings.
 *
 * Rules that keep it professional:
 *   - cut on words: a scene starts ~0.25 s before the phrase that introduces it
 *   - one idea per scene; 4–8 s each; nothing on screen the product can't really do
 *   - every <Screen> (recording) sits in its own <Scene> (videos play from their scene's start)
 */

const T = {
  hook: 0,
  pains: [at("chasing"), at("copying"), at("reminding")],
  intro: at("Meet") - 0.25,
  setup: at("Set it up once") - 0.25,
  dashboard: at("Everything that matters") - 0.25,
  breadth: at("Invoices") - 0.25,
  close: at("is live today") - 0.6,
  end: VO_END,
};

export function Video({ format }: { format: FormatName }) {
  return (
    <FormatContext.Provider value={FORMATS[format]}>
      <AbsoluteFill>
        <Background />

        <Scene from={T.hook} to={T.intro}>
          <Hook
            statement={{ text: "Every week, small tasks steal hours.", at: 0.6 }}
            accent={["hours."]}
            pains={[
              { text: "Chasing", at: T.pains[0]! },
              { text: "Copying", at: T.pains[1]! },
              { text: "Reminding", at: T.pains[2]! },
            ]}
          />
        </Scene>

        <Scene from={T.intro} to={T.setup}>
          <LogoReveal at={T.intro + 0.1} tagline={BRAND.tagline} />
        </Scene>

        <Scene from={T.setup} to={T.dashboard}>
          <ProductScene
            kicker="Setup"
            title="Set it up once."
            accent={["once."]}
            screen={{ name: "overview", from: 0, rate: 1.2 }}
            phone={{ enter: T.setup + 0.8, bubbles: [{ at: T.setup + 2.2, text: "Hi Sam, your invoice #1042 is ready. Pay securely here.", time: "09:41" }] }}
          />
        </Scene>

        <Scene from={T.dashboard} to={T.breadth}>
          <ProductScene kicker="Overview" title="Everything that matters, in one place." accent={["one"]} screen={{ name: "dashboard", from: 0 }} />
        </Scene>

        <Scene from={T.breadth} to={T.close}>
          <Cards
            kicker="All in one"
            title="It handles the busywork."
            accent={["busywork."]}
            cards={[
              { title: "Invoices", sub: "Sent on time", icon: "doc", at: at("Invoices") },
              { title: "Reminders", sub: "Polite and automatic", icon: "bell", at: at("reminders") },
              { title: "Payments", sub: "Matched for you", icon: "card", at: at("payments") },
              { title: "Reports", sub: "Ready every morning", icon: "chart", at: at("reports") },
            ]}
          />
        </Scene>

        <Scene from={T.close} to={TOTAL} fade={false}>
          <Statement lines={[{ text: "Live today.", at: T.close + 0.2, accent: ["today."], until: T.end - 0.1 }]} />
          <EndCard at={T.end} />
        </Scene>

        <Captions hideBefore={T.intro} hideAfter={T.close} />

        <Voice />
        <Music />
        {[T.intro, T.setup, T.breadth, T.close].map((w) => (
          <Sfx key={w} at={w - 0.15} src={BRAND.sfx.whoosh} volume={0.18} />
        ))}
      </AbsoluteFill>
    </FormatContext.Provider>
  );
}
