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

function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Concern orbs — each represents a conflict that killed the trip
// ─────────────────────────────────────────────────────────────────────────────
const ORB_DATA = [
  { author: "Jay", avatar: "jay", text: "actually... can we push it?", rotation: -2, startFrame: 5 },
  { author: "Sam", avatar: "sam", text: "is $300 ok for everyone?", rotation: 2, startFrame: 35 },
  { author: "Priya", avatar: "priya", text: "i might have a work thing", rotation: -1, startFrame: 65 },
  { author: "Alex", avatar: "alex", text: "what about my dog? 🐕", rotation: 3, startFrame: 95 },
  { author: "Jay", avatar: "jay", text: "let me check my schedule...", rotation: -2, startFrame: 125 },
];

const HORIZONTAL_ORB_POSITIONS: { x: number; y: number }[] = [
  { x: 620, y: 300 },
  { x: 1340, y: 460 },
  { x: 660, y: 740 },
  { x: 1280, y: 800 },
  { x: 480, y: 520 },
];

const V_ORB_INDICES = [0, 1, 2, 4];

const V_ORB_POSITIONS: { x: number; y: number }[] = [
  { x: 345, y: 230 },
  { x: 650, y: 540 },
  { x: 325, y: 1190 },
  { x: 600, y: 1630 },
];


// ─────────────────────────────────────────────────────────────────────────────
// FallScene — 165 frames (5.5 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function FallScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  const orbFontSize = isVertical ? 38 : 24;
  const orbFontWeight = isVertical ? 500 : 500;
  const orbLineHeight = isVertical ? 1.3 : 1.35;
  const orbAvatarSize = isVertical ? 72 : 64;
  const orbPadding = isVertical ? "22px 28px" : "18px 26px";
  const orbAuthorFont = isVertical ? 24 : 19;
  const orbAuthorMargin = isVertical ? 20 : 22;
  const orbMaxWidth = isVertical ? 560 : 700;
  const orbBorderRadius = isVertical ? 36 : 35;
  const orbGap = isVertical ? 16 : 16;
  const orbLabelGap = isVertical ? 8 : 6;
  const captionFontSize = isVertical ? 56 : 22;

  const orbs = isVertical
    ? V_ORB_INDICES.map((dataIdx, posIdx) => ({
        data: ORB_DATA[dataIdx],
        pos: V_ORB_POSITIONS[posIdx],
      }))
    : ORB_DATA.map((data, i) => ({
        data,
        pos: HORIZONTAL_ORB_POSITIONS[i],
      }));

  const drainProgress = interpolate(frame, [143, 160], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  const captionOpacity = interpolate(
    frame,
    [30, 45, 138, 150],
    [0, 1, 1, 0],
    clamp(),
  );

  // Fade to white at end
  const whiteOverlayOpacity = interpolate(frame, [158, 165], [0, 1], clamp());

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background fades in over first 15 frames (overlap window with OpeningChatScene) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.background,
          opacity: interpolate(frame, [0, 15], [0, 1], clamp()),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Concern orbs */}
      {orbs.map((entry, i) => {
        const { data: orb, pos } = entry;
        const appear = interpolate(
          frame,
          [orb.startFrame, orb.startFrame + 12],
          [0, 1],
          clamp(),
        );

        const entryDistance = isVertical ? -200 : -100;
        const entryY = interpolate(
          frame,
          [orb.startFrame, orb.startFrame + 18],
          [entryDistance, 0],
          { easing: Easing.out(Easing.cubic), ...clamp() },
        );

        const floatY = Math.sin(frame / 40 + i * 1.2) * 4;

        const drainedOpacity = 1 - drainProgress * 0.95;

        const scalePunch = (() => {
          if (frame < orb.startFrame) return 0;
          if (frame < orb.startFrame + 8)
            return interpolate(
              frame,
              [orb.startFrame, orb.startFrame + 8],
              [0, 1.08],
              { easing: Easing.out(Easing.cubic), ...clamp() },
            );
          if (frame < orb.startFrame + 16)
            return interpolate(
              frame,
              [orb.startFrame + 8, orb.startFrame + 16],
              [1.08, 1.0],
              { easing: Easing.out(Easing.cubic), ...clamp() },
            );
          return 1.0;
        })();

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y + entryY + floatY,
              transform: `translate(-50%, -50%) rotate(${orb.rotation}deg) scale(${scalePunch})`,
              opacity: appear * drainedOpacity,
              display: "flex",
              alignItems: "flex-end",
              gap: orbGap,
              maxWidth: orbMaxWidth,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: orbAvatarSize,
                height: orbAvatarSize,
                borderRadius: "50%",
                border: "2px solid rgba(0,0,0,0.1)",
                overflow: "hidden",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(251,113,133,0.08)",
              }}
            >
              <img
                src={staticFile(`avatars/${orb.avatar}.png`)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Bubble */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: orbLabelGap,
              }}
            >
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: orbAuthorFont,
                  marginLeft: orbAuthorMargin,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {orb.author}
              </div>
              <div
                style={{
                  padding: orbPadding,
                  borderRadius: orbBorderRadius,
                  background: COLORS.surfaceSubtle,
                  border: "1px solid rgba(0,0,0,0.06)",
                  color: COLORS.textPrimary,
                  fontSize: orbFontSize,
                  fontWeight: orbFontWeight,
                  lineHeight: orbLineHeight,
                  boxShadow: "0 4px 12px rgba(251,113,133,0.06)",
                  whiteSpace: "nowrap",
                }}
              >
                {orb.text}
              </div>
            </div>
          </div>
        );
      })}

      {/* "And then it falls apart." */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          ...(isVertical
            ? { top: "50%", transform: "translate(-50%, -50%)" }
            : { bottom: "18%", transform: "translateX(-50%)" }),
          color: COLORS.textPrimary,
          fontSize: captionFontSize,
          fontWeight: 600,
          letterSpacing: "0.02em",
          fontStyle: "italic",
          opacity: captionOpacity,
          zIndex: 100,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        And then it falls apart.
      </div>

      {/* Fade to white — clean exit into IntroScene */}
      {frame >= 158 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.background,
            opacity: whiteOverlayOpacity,
            zIndex: 150,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
