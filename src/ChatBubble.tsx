import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// ChatBubble — a single animated message pill
//
// How it works:
//   Every bubble has its own internal "clock" (startFrame). Before that frame
//   it's invisible. Once the clock starts, a spring drives a 0→1 progress
//   value that we map onto position, scale, and opacity.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatBubbleProps {
  message: string;
  /**
   * true  → blue (#0084FF), slides in from the RIGHT  (sent by "you")
   * false → gray (#E5E5EA), slides in from the LEFT   (sent by others)
   */
  isBlue: boolean;
  /** The frame number when this bubble starts its entrance */
  startFrame: number;
}

// ── Spring config ─────────────────────────────────────────────────────────────
// Tune these to change the motion feel for every bubble:
//   stiffness ↑  →  faster / snappier        stiffness ↓  →  slower / floatier
//   damping   ↑  →  less bounce (robotic)    damping   ↓  →  more bounce
//   mass      ↑  →  feels heavy              mass      ↓  →  feels light
//
// Current values give ~16% overshoot — energetic but controlled.
const BUBBLE_SPRING = { stiffness: 120, damping: 11, mass: 1 } as const;

// How far off-screen each bubble starts (in pixels).
const ENTRY_OFFSET_PX = 420;

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isBlue,
  startFrame,
}) => {
  const frame = useCurrentFrame(); // current frame (0, 1, 2 … 149)
  const { fps } = useVideoConfig(); // 30 for this composition

  // `frame - startFrame` makes each bubble run on its own clock.
  // When frame < startFrame the result is negative, and spring() returns
  // its `from` value (0) — so the bubble stays invisible until its turn.
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: BUBBLE_SPRING,
    from: 0,
    to: 1,
  });

  // Map 0→1 progress to a horizontal slide.
  // Blue  (right-side): starts at +420px, ends at 0.
  // Gray  (left-side):  starts at -420px, ends at 0.
  const translateX = interpolate(
    progress,
    [0, 1],
    [isBlue ? ENTRY_OFFSET_PX : -ENTRY_OFFSET_PX, 0]
  );

  // Bubble pops from 85% → 100% size as it enters.
  const scale = interpolate(progress, [0, 1], [0.85, 1]);

  // Invisible until the spring begins, then snaps to full opacity fast.
  const opacity = interpolate(progress, [0, 0.08, 1], [0, 0, 1]);

  return (
    // Full-width row that pushes the pill to the correct side
    <div
      style={{
        display: "flex",
        justifyContent: isBlue ? "flex-end" : "flex-start",
        // Indent the far side so bubbles never span the full width
        paddingLeft: isBlue ? 120 : 0,
        paddingRight: isBlue ? 0 : 120,
        transform: `translateX(${translateX}px) scale(${scale})`,
        opacity,
        // Anchor the scale to the side the bubble slides from
        transformOrigin: isBlue ? "right center" : "left center",
      }}
    >
      {/* The pill itself */}
      <div
        style={{
          backgroundColor: isBlue ? "#0084FF" : "#E5E5EA",
          borderRadius: 18,
          paddingTop: 18,
          paddingBottom: 18,
          paddingLeft: 24,
          paddingRight: 24,
          maxWidth: 680,
        }}
      >
        <span
          style={{
            display: "block",
            color: isBlue ? "#FFFFFF" : "#1C1C1E",
            fontSize: 40,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
};
