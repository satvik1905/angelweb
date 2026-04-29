import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// AngelIcon — the Avatar.svg hero entrance (frames 240–300)
//
// How the animation works in plain English:
//
//   1. A spring runs from frame 240 onward, producing a value 0 → 1.
//   2. We map that 0→1 value onto two things:
//        • translateY: the icon drops from -350px above center to 0px (resting).
//        • scale: the icon grows from 0 to 1 (with a slight overshoot "pop").
//   3. After the spring settles (~frame 260), a Math.sin loop takes over the
//      scale, creating a slow, barely-perceptible breathing pulse.
// ─────────────────────────────────────────────────────────────────────────────

// The frame this component "wakes up" on.
const ENTER_FRAME = 240;

// Spring config — controls the drop-in feel.
//   stiffness 180, damping 13, mass 0.8  →  ζ ≈ 0.54, ~10% overshoot.
//   Increase damping to remove the overshoot. Decrease it for more bounce.
const ICON_SPRING = { stiffness: 180, damping: 13, mass: 0.8 } as const;

export const AngelIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // `frame - ENTER_FRAME` gives this component its own clock.
  // When frame < 240, the spring returns 0 → icon is invisible (opacity = 0).
  const s = spring({
    frame: frame - ENTER_FRAME,
    fps,
    config: ICON_SPRING,
    from: 0,
    to: 1,
  });

  // Drop from 350px above the canvas center → resting at center (0px).
  // At s=0: translateY = -350  (off-screen top)
  // At s=1: translateY =    0  (perfectly centered)
  const translateY = interpolate(s, [0, 1], [-350, 0]);

  // Invisible until the spring starts, then snaps opaque quickly.
  const opacity = interpolate(s, [0, 0.06, 1], [0, 0, 1]);

  // ── Breathing pulse ────────────────────────────────────────────────────────
  // Math.sin produces a smooth wave between -1 and +1.
  // Dividing by 25 gives a very slow cycle: 2π × 25 ≈ 157 frames ≈ 5.2 s.
  // Range: 1.0 (min) to 1.05 (max) — barely visible, just alive.
  const breathe = 1 + 0.025 * Math.sin((frame - ENTER_FRAME) / 25);

  // Entry scale from spring, multiplied by the breathing factor.
  // • While spring is mid-flight (s < 1): entry animation dominates.
  // • After spring settles (s ≈ 1): only the breathing pulse remains.
  const scale = s * breathe;

  return (
    // AbsoluteFill centers the icon both horizontally and vertically.
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/*
          240px on a 1080px-wide canvas ≈ 22% of screen width.
          That reads as "large and hero-like" at this canvas size.
          Change width/height here to resize the icon.
        */}
        <Img
          src={staticFile("Avatar.svg")}
          style={{ width: 240, height: 240, objectFit: "contain" }}
        />
      </div>
    </AbsoluteFill>
  );
};
