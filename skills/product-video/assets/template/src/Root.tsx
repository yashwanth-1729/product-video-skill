import { Composition } from "remotion";
import { FORMATS, type FormatName } from "./format";
import { FPS } from "./theme";
import { TOTAL } from "./timing";
import { Video } from "./Video";

/** One composition per aspect ratio: Video-4x5, Video-9x16, Video-16x9, Video-1x1. Render the one you need. */
export function Root() {
  return (
    <>
      {(Object.keys(FORMATS) as FormatName[]).map((f) => (
        <Composition
          key={f}
          id={`Video-${f.replace(":", "x")}`}
          component={Video}
          defaultProps={{ format: f }}
          durationInFrames={Math.ceil(TOTAL * FPS)}
          fps={FPS}
          width={FORMATS[f].width}
          height={FORMATS[f].height}
        />
      ))}
    </>
  );
}
