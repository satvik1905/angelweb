import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame / fps;

  const W = 1920;
  const H = 1080;

  // Breathing scale: oscillates ±10% around 70% of screen width
  const breathe = Math.sin(t * 0.8) * 0.10;
  // Horizontal drift: each spotlight shifts left/right slightly, different phases
  const drift1 = Math.sin(t * 0.5) * 0.06;        // orange — left anchor
  const drift2 = Math.sin(t * 0.5 + 1.0) * 0.05;  // pink — center anchor
  const drift3 = Math.sin(t * 0.5 + 2.0) * 0.06;  // purple — right anchor

  // Each light sits at a fixed horizontal zone, drift shifts it slightly
  const cx1 = 18 + drift1 * 100;   // orange: left zone ~18%
  const cx2 = 50 + drift2 * 100;   // pink: center ~50%
  const cx3 = 82 + drift3 * 100;   // purple: right zone ~82%

  // Radii per layer — independent breathe phases for subtle desync
  const rx1 = (0.70 + breathe) * W;
  const rx2 = (0.70 + Math.sin(t * 0.8 + 0.8) * 0.10) * W;
  const rx3 = (0.70 + Math.sin(t * 0.8 + 1.6) * 0.10) * W;

  // Ellipse: flattened so glow only reaches ~40-50% up the screen
  const ry = (rx: number) => rx * 0.52;

  const spot = (cx: number, rx: number, r: string, g: string, b: string) =>
    `radial-gradient(${rx}px ${ry(rx)}px at ${cx}% 100%, rgba(${r},${g},${b},0.85) 0%, rgba(${r},${g},${b},0.40) 30%, rgba(${r},${g},${b},0.10) 55%, transparent 70%)`;

  return (
    <div
      style={{
        width: W,
        height: H,
        background: "#000000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Orange spotlight — bottom left */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: spot(cx1, rx1, "251", "146", "60"),  // #FB923C
        }}
      />

      {/* Pink spotlight — bottom center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: spot(cx2, rx2, "251", "113", "133"), // #FB7185
          opacity: 0.9,
        }}
      />

      {/* Purple-pink spotlight — bottom right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: spot(cx3, rx3, "244", "114", "182"), // #F472B6
          opacity: 0.85,
        }}
      />
    </div>
  );
};

export default Background;
