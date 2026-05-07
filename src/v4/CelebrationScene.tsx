import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { COLORS, SHADOWS } from "./tokens";
import { WarmGlow } from "./components/WarmGlow";

const PNG_W = 1532;
const PNG_H = 3140;

// Phone screen rectangle (matches PhoneScene)
const SCREEN_TOP = 55;
const SCREEN_LEFT = 55;
const SCREEN_RIGHT = 1477;
const SCREEN_BOTTOM = 3085;
const SCREEN_W = SCREEN_RIGHT - SCREEN_LEFT;
const SCREEN_H = SCREEN_BOTTOM - SCREEN_TOP;
const SCREEN_RADIUS = 185;

// Content area in source pixels
const CHAT_LEFT = 120;
const BUBBLE_WIDTH = 1100;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

// Celebration bubbles — stacked top-to-bottom
const CELEBRATION_BUBBLES = [
  { src: "bubbles/final/angel.png", startFrame: 20, srcY: 720 },
  { src: "bubbles/final/maya.png", startFrame: 92, srcY: 1107 },
  { src: "bubbles/final/jay.png", startFrame: 104, srcY: 1312 },
  { src: "bubbles/final/sam.png", startFrame: 116, srcY: 1517 },
  { src: "bubbles/final/claire.png", startFrame: 128, srcY: 1722 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CelebrationScene — 210 frames (7 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export const CelebrationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const phoneScale = (height * 0.9) / PNG_H;
  const phoneW = PNG_W * phoneScale;
  const phoneH = PNG_H * phoneScale;

  // ── Camera state ──────────────────────────────────────────────────────────
  const BASE_SCALE = 1.0;
  const ZOOM_SCALE = 1.6;
  const ANGEL_SOURCE_Y = 889;

  const srcYToShift = (srcY: number, scale: number) =>
    -((srcY / PNG_H) * phoneH - phoneH / 2) * scale;

  const angelZoomedShift = srcYToShift(ANGEL_SOURCE_Y, ZOOM_SCALE);

  // Fade-in (f15–f27) — delayed past 15f overlap with ResolutionScene
  const fadeIn = interpolate(frame, [15, 27], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  let camScale: number;
  let camShiftY: number;

  if (frame < 12) {
    // Wide establish
    camScale = BASE_SCALE;
    camShiftY = 0;
  } else if (frame < 37) {
    // Track + zoom to Angel
    camScale = interpolate(frame, [12, 37], [BASE_SCALE, ZOOM_SCALE], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
    camShiftY = interpolate(frame, [12, 37], [0, angelZoomedShift], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
  } else if (frame < 72) {
    // Hold zoomed on Angel
    camScale = ZOOM_SCALE;
    camShiftY = angelZoomedShift;
  } else if (frame < 92) {
    // Pull back to wide
    camScale = interpolate(frame, [72, 92], [ZOOM_SCALE, BASE_SCALE], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
    camShiftY = interpolate(frame, [72, 92], [angelZoomedShift, 0], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
  } else if (frame < 155) {
    // Held wide — reactions cascade
    camScale = BASE_SCALE;
    camShiftY = 0;
  } else {
    // f155–f210: cinematic pull-back (scale only, no Y motion)
    camScale = interpolate(frame, [155, 210], [BASE_SCALE, BASE_SCALE * 0.85], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
    camShiftY = 0;
  }

  const s = phoneScale;

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <WarmGlow />

      {/* Phone container */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2 + camShiftY,
          width: phoneW,
          height: phoneH,
          transform: `translate(-50%, -50%) scale(${camScale})`,
          boxShadow: SHADOWS.phone,
          borderRadius: 220 * phoneScale,
          overflow: "hidden",
          opacity: fadeIn,
        }}
      >
        {/* Screen clipping area */}
        <div
          style={{
            position: "absolute",
            left: SCREEN_LEFT * s,
            top: SCREEN_TOP * s,
            width: SCREEN_W * s,
            height: SCREEN_H * s,
            borderRadius: SCREEN_RADIUS * s,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          {CELEBRATION_BUBBLES.map((bubble, i) => {
            const start = bubble.startFrame;
            const dur = 18;
            const opacity = interpolate(frame, [start, start + dur], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            });
            const translateY = interpolate(frame, [start, start + dur], [24, 0], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            });
            const scale = interpolate(frame, [start, start + dur], [0.96, 1.0], {
              easing: settleEasing,
              ...CL,
            });
            return (
              <img
                key={i}
                src={staticFile(bubble.src)}
                style={{
                  position: "absolute",
                  left: (CHAT_LEFT - SCREEN_LEFT) * s,
                  top: (bubble.srcY - SCREEN_TOP) * s,
                  width: BUBBLE_WIDTH * s,
                  height: "auto",
                  transform: `translateY(${translateY * s}px) scale(${scale})`,
                  transformOrigin: "top left",
                  opacity,
                }}
              />
            );
          })}
        </div>

        {/* Phone bezel image */}
        <img
          src={staticFile("chat.png")}
          style={{
            width: phoneW,
            height: phoneH,
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 250 * phoneScale,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Fade-to-white exit overlay (f175–f210) */}
      {frame >= 175 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.background,
            opacity: interpolate(frame, [175, 210], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            }),
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
