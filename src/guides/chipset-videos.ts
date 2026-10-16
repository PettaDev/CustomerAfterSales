import type { Chipset } from "./chipset-mobile";

export type ChipsetVideo = {
  src: string;
  title: string;
};

/**
 * Attach verified user-provided videos to the corresponding chipset and
 * zero-based guide step only after the final MP4/WebM exists in public/videos/brte/.
 *
 * For example (illustrative only, DO NOT uncomment until the file is supplied):
 * mediatek: { 6: { src: "/videos/brte/mediatek-logger.mp4", title: "DebugLoggerUI" } }
 *
 * Keep missing videos absent: this prevents broken players, misleading
 * thumbnails and 404 requests on customer devices.
 */
const videos: Record<Chipset, Partial<Record<number, ChipsetVideo>>> = {
  mediatek: {},
  qualcomm: {},
  unisoc: {},
};

export function getChipsetVideo(chipset: Chipset, step: number): ChipsetVideo | undefined {
  const video = videos[chipset][step];
  if (!video || !/^\/videos\/brte\/[a-z0-9-]+\.(mp4|webm)$/.test(video.src)) return undefined;
  return video;
}
