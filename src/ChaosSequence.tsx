import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ChatBubble } from "./ChatBubble";
import { AngelIcon } from "./AngelIcon";

// ─────────────────────────────────────────────────────────────────────────────
// ChaosSequence — 8 seconds (240 frames @ 30fps)
//
// Timeline:
//   Frame   0  "I want beach!"           slides in from RIGHT
//   Frame  22  "No, mountains!"          slides in from LEFT
//   Frame  44  "What's the budget??"     slides in from LEFT
//   Frame  68  "When are we even going?" slides in from RIGHT
//   Frame  90  "I can't do July!"        slides in from LEFT
//   Frame 112  All bubbles settled → group wobble begins
//   Frame 150  HARD FREEZE — wobble cuts off, everything holds still
//   Frame 150–240  Silence. Bubbles sit frozen. Vignette holds.
// ─────────────────────────────────────────────────────────────────────────────

// ── Bubble data ───────────────────────────────────────────────────────────────
// To change a message or reorder bubbles, edit this array only.
// isBlue: true = blue/right (sender), false = gray/left (others)
const BUBBLES = [
  { message: "I want beach!",              isBlue: true,  startFrame: 0  },
  { message: "No, mountains!",             isBlue: false, startFrame: 22 },
  { message: "What's the budget??",        isBlue: false, startFrame: 44 },
  { message: "When are we even going?",    isBlue: true,  startFrame: 68 },
  { message: "I can't do July!",           isBlue: false, startFrame: 90 },
] as const;

// The last bubble starts at frame 90.
// Its spring takes ~20 frames to settle → wobble kicks in at frame 112.
const WOBBLE_START = 112;

// ─────────────────────────────────────────────────────────────────────────────
export const ChaosSequence: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Wobble ─────────────────────────────────────────────────────────────────
  // Math.sin() produces a smooth wave between -1 and +1.
  // Dividing frame by 8 or 7 controls the speed of the wave:
  //   smaller divisor → faster rocking   larger divisor → slower rocking
  //
  // We use two overlapping sin waves at slightly different speeds so the
  // motion feels organic, not mechanical.
  // Wobble is active only between WOBBLE_START and frame 150.
  // At frame 150 this condition becomes false and both values snap to exactly 0.
  // That's the hard cut — no easing, no gradual slowdown, just: stopped.
  const FREEZE_FRAME = 150;
  const active = frame >= WOBBLE_START && frame < FREEZE_FRAME;
  const t = active ? frame - WOBBLE_START : 0;

  const wobbleRotateDeg  = active ? Math.sin(t / 8)        * 1.2 : 0; // ±1.2°
  const wobbleTranslateY = active ? Math.sin(t / 7 + 0.5)  * 4   : 0; // ±4px

  // At frame 150: vignette + desaturation snap on (hard cut).
  // At frame 240: bubbles and vignette fade out as the icon arrives.
  const isFrozen = frame >= FREEZE_FRAME;

  // Bubbles fade from fully visible → invisible between frames 240–270.
  // interpolate() maps the frame number onto an opacity value:
  //   frame 240  →  opacity 1.0  (fully visible)
  //   frame 270  →  opacity 0.0  (gone)
  //   before 240 →  clamped at 1.0  (always visible during chaos + freeze)
  //   after  270 →  clamped at 0.0  (always gone after fade completes)
  const bubbleOpacity = interpolate(frame, [240, 270], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vignette fades out on the same schedule as the bubbles.
  const vignetteOpacity = interpolate(frame, [240, 270], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        // iOS Messages-style background
        background: "#F2F2F7",
        display: "flex",
        alignItems: "center",     // center the bubble stack vertically
        justifyContent: "center",
      }}
    >
      {/*
        Bubble container:
        • Takes the full canvas width minus horizontal padding (48px each side)
        • Stacks bubbles top-to-bottom with a 16px gap
        • Receives the wobble transform so ALL bubbles rock together as one unit
      */}
      {/* Bubble stack ── desaturates on freeze, fades out on icon entrance */}
      <div
        style={{
          width: "100%",
          padding: "0 48px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          transform: `rotate(${wobbleRotateDeg}deg) translateY(${wobbleTranslateY}px)`,
          filter: isFrozen ? "saturate(0.8)" : "none",
          opacity: bubbleOpacity,
        }}
      >
        {BUBBLES.map((bubble, i) => (
          <ChatBubble
            key={i}
            message={bubble.message}
            isBlue={bubble.isBlue}
            startFrame={bubble.startFrame}
          />
        ))}
      </div>

      {/*
        Vignette overlay — sits above the bubbles, pointer-events: none so
        it never blocks anything. Snaps on at frame 150 with no fade.
        It darkens the edges of the frame, drawing the eye to the center
        and signaling that the scene has "frozen."
      */}
      {/* Vignette — appears at frame 150, fades out at frame 240–270 */}
      {isFrozen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
            opacity: vignetteOpacity,
          }}
        />
      )}

      {/* Angel Mode icon — manages its own entrance from frame 240 onward */}
      <AngelIcon />
    </AbsoluteFill>
  );
};
