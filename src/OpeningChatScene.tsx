import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { COLORS } from "./v4/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({
  name,
  size = 40,
  dimmed = false,
}: {
  name: string;
  size?: number;
  dimmed?: boolean;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: "2px solid rgba(0,0,0,0.1)",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(251,113,133,0.08)",
      filter: dimmed
        ? "grayscale(80%) brightness(0.5)"
        : "saturate(1.15) brightness(1.05)",
      opacity: dimmed ? 0.4 : 1,
      transition: "filter 0.3s ease, opacity 0.3s ease",
    }}
  >
    <img
      src={staticFile(`avatars/${name}.png`)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Size config per bubble size tier
// ─────────────────────────────────────────────────────────────────────────────
type BubbleSize = "hero" | "shout" | "emoji" | "normal";

const SIZE_CONFIG: Record<
  BubbleSize,
  { fontSize: number; fontWeight: number; padding: string; avatarSize: number }
> = {
  hero: { fontSize: 20, fontWeight: 600, padding: "14px 22px", avatarSize: 48 },
  shout: {
    fontSize: 19,
    fontWeight: 700,
    padding: "12px 18px",
    avatarSize: 44,
  },
  emoji: {
    fontSize: 28,
    fontWeight: 400,
    padding: "10px 16px",
    avatarSize: 40,
  },
  normal: {
    fontSize: 15,
    fontWeight: 500,
    padding: "11px 16px",
    avatarSize: 40,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatBubble
// ─────────────────────────────────────────────────────────────────────────────
const ChatBubble = ({
  author,
  avatar,
  text,
  position,
  rotation,
  startFrame,
  frame,
  variant = "normal",
  size = "normal",
  drainProgress = 0,
  scale = 1,
}: {
  author: string;
  avatar: string;
  text: string;
  position: { x: number; y: number };
  rotation: number;
  startFrame: number;
  frame: number;
  variant?: "hero" | "normal" | "hesitant";
  size?: BubbleSize;
  drainProgress?: number;
  scale?: number;
}) => {
  const rawCfg = SIZE_CONFIG[size];
  const cfg = {
    fontSize: rawCfg.fontSize * scale,
    fontWeight: rawCfg.fontWeight,
    padding: rawCfg.padding
      .split(" ")
      .map((v) => `${Math.round(parseFloat(v) * scale)}px`)
      .join(" "),
    avatarSize: Math.round(rawCfg.avatarSize * scale),
  };

  const baseOpacity = interpolate(
    frame,
    [startFrame, startFrame + 18],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const ageFalloff = interpolate(
    frame - startFrame,
    [0, 30, 80],
    [1, 1, 0.78],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const finalOpacity =
    variant === "hero" ? baseOpacity : baseOpacity * ageFalloff;

  const drainedOpacity =
    variant === "hero" ? 1 - drainProgress * 0.5 : 1 - drainProgress * 0.55;
  const drainedSaturation = 1 - drainProgress * 0.7;
  const drainedBrightness = 1 - drainProgress * 0.3;

  const finalSceneFade = 1;

  const scalePunch = (() => {
    if (frame < startFrame) return 0;
    if (frame < startFrame + 10) {
      return interpolate(frame, [startFrame, startFrame + 10], [0, 1.08], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    if (frame < startFrame + 24) {
      return interpolate(
        frame,
        [startFrame + 10, startFrame + 24],
        [1.08, 1.0],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
    }
    return 1.0;
  })();

  const breathe =
    frame >= startFrame + 24
      ? Math.sin(frame / 45 + startFrame * 0.03) * 0.012
      : 0;

  const drift = Math.sin(frame / 35 + startFrame * 0.04) * 3;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + drift,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scalePunch + breathe})`,
        opacity: finalOpacity * drainedOpacity * finalSceneFade,
        filter: `saturate(${drainedSaturation}) brightness(${drainedBrightness})`,
        display: "flex",
        alignItems: "flex-end",
        gap: 10 * scale,
        maxWidth: 440 * scale,
      }}
    >
      <Avatar name={avatar} size={cfg.avatarSize} dimmed={false} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4 * scale,
        }}
      >
        <div
          style={{
            color: COLORS.textSecondary,
            fontSize: Math.round(12 * scale),
            marginLeft: Math.round(14 * scale),
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {author}
        </div>
        <div
          style={{
            padding: cfg.padding,
            borderRadius: Math.round(22 * scale),
            background:
              variant === "hero"
                ? COLORS.surfaceSubtle
                : COLORS.surfaceSubtle,
            border:
              variant === "hero"
                ? "1px solid rgba(251,113,133,0.2)"
                : "1px solid rgba(0,0,0,0.06)",
            color: COLORS.textPrimary,
            fontSize: variant === "hesitant" ? 15 * scale : cfg.fontSize,
            fontWeight: variant === "hesitant" ? 400 : cfg.fontWeight,
            lineHeight: 1.35,
            boxShadow:
              variant === "hero"
                ? "0 8px 32px rgba(251,113,133,0.18)"
                : "0 4px 12px rgba(251,113,133,0.06)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cold open bubble data
// ─────────────────────────────────────────────────────────────────────────────
type BubbleData = {
  author: string;
  avatar: string;
  text: string;
  rotation: number;
  startFrame: number;
  variant: "hero" | "normal" | "hesitant";
  size: BubbleSize;
};

const BUBBLE_DATA: BubbleData[] = [
  { author: "Maya", avatar: "maya", text: "Bali next month?? 🌴", rotation: 0, startFrame: 5, variant: "hero", size: "hero" },
  { author: "Jay", avatar: "jay", text: "OMGGG YES 🔥", rotation: -8, startFrame: 15, variant: "normal", size: "shout" },
  { author: "Sam", avatar: "sam", text: "I'M IN", rotation: 7, startFrame: 25, variant: "normal", size: "shout" },
  { author: "Alex", avatar: "alex", text: "lets goooo", rotation: 4, startFrame: 35, variant: "normal", size: "shout" },
  { author: "Priya", avatar: "priya", text: "BOOK IT NOW", rotation: -6, startFrame: 45, variant: "normal", size: "shout" },
  { author: "Jay", avatar: "jay", text: "best idea ever", rotation: 9, startFrame: 55, variant: "normal", size: "normal" },
  { author: "Alex", avatar: "alex", text: "🌴🌴🌴", rotation: -5, startFrame: 65, variant: "normal", size: "emoji" },
  { author: "Sam", avatar: "sam", text: "passport ready 🛂", rotation: -3, startFrame: 75, variant: "normal", size: "normal" },
  { author: "Priya", avatar: "priya", text: "i'll start the spreadsheet", rotation: 6, startFrame: 85, variant: "normal", size: "normal" },
  { author: "Sam", avatar: "sam", text: "BOOKING FLIGHTS RN ✈️", rotation: 5, startFrame: 95, variant: "normal", size: "shout" },
];

const HORIZONTAL_POSITIONS: { x: number; y: number }[] = [
  { x: 960, y: 540 },
  { x: 480, y: 320 },
  { x: 1480, y: 460 },
  { x: 540, y: 760 },
  { x: 1380, y: 240 },
  { x: 1180, y: 770 },
  { x: 740, y: 230 },
  { x: 380, y: 880 },
  { x: 1320, y: 880 },
  { x: 1180, y: 380 },
];

const V_BUBBLE_INDICES = [0, 1, 2, 3, 4];

const V_BUBBLE_POSITIONS: { x: number; y: number }[] = [
  { x: 540, y: 920 },
  { x: 310, y: 360 },
  { x: 770, y: 560 },
  { x: 300, y: 1420 },
  { x: 760, y: 1600 },
];


// ─────────────────────────────────────────────────────────────────────────────
// OpeningChatScene — 150 frames (5 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function OpeningChatScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  const vScale = 1.8;
  const vMayaScale = 2.0;

  const bubbles = isVertical
    ? V_BUBBLE_INDICES.map((dataIdx, posIdx) => ({
        data: BUBBLE_DATA[dataIdx],
        pos: V_BUBBLE_POSITIONS[posIdx],
        scale: dataIdx === 0 ? vMayaScale : vScale,
      }))
    : BUBBLE_DATA.map((data, i) => ({
        data,
        pos: HORIZONTAL_POSITIONS[i],
        scale: 1,
      }));

  const drainProgress = interpolate(frame, [100, 150], [0, 0.6], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cameraZoom = interpolate(frame, [0, 60], [1.0, 1.04], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heroFloat = Math.sin(frame / 45) * 4;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >

      {/* Camera-zoomed wrapper — cold open bubbles */}
      <div
        style={{
          width,
          height,
          position: "relative",
          transform: `scale(${cameraZoom})`,
          transformOrigin: "center center",
          zIndex: 1,
        }}
      >
        {bubbles.map((entry, i) => {
          const { data: b, pos, scale: bubbleScale } = entry;
          const yOffset = b.variant === "hero" ? heroFloat : 0;
          return (
            <ChatBubble
              key={i}
              author={b.author}
              avatar={b.avatar}
              text={b.text}
              position={{ x: pos.x, y: pos.y + yOffset }}
              rotation={b.rotation}
              startFrame={b.startFrame}
              variant={b.variant}
              size={b.size}
              frame={frame}
              drainProgress={drainProgress}
              scale={bubbleScale}
            />
          );
        })}

      </div>

      {/* Caption */}
      {frame >= 88 && frame < 148 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: isVertical ? 100 : "8%",
            transform: "translateX(-50%)",
            color: COLORS.textSecondary,
            fontSize: isVertical ? 34 : 22,
            fontWeight: 600,
            letterSpacing: "0.02em",
            fontStyle: "italic",
            opacity: interpolate(frame, [88, 103, 120, 145], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          Every great trip starts here.
        </div>
      )}

    </AbsoluteFill>
  );
}
