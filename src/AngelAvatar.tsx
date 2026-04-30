import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig, staticFile } from "remotion";

const AngelAvatar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance — fast slide with overshoot (car brake effect)
  const x = interpolate(frame, [0, 35], [800, 0], {
    easing: Easing.out(Easing.back(2.5)),
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Rotation — rapid burst every 2 seconds (60 frames), then rest
  const spinCycleFrame = (frame - 35) % 60;

  const rotateZ = interpolate(spinCycleFrame, [0, 15], [0, 360], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotateY = interpolate(spinCycleFrame, [0, 15], [0, 180], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotation = frame < 35 ? 0 : rotateZ;
  const flipY    = frame < 35 ? 0 : rotateY;

  // Breathing glow
  const breathe     = Math.sin((frame / fps) * 1.2);
  const glowScale   = 1.0 + breathe * 0.1;
  const glowOpacity = 0.5 + breathe * 0.15;

  // Hit pulse at frame 90 — only activates after the hit, not at frame 0
  const timeSinceHit = Math.max(0, frame - 90);
  const hitGlowExtra = frame < 90 ? 0 : interpolate(timeSinceHit, [0, 6, 25], [60, 30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowSize = Math.min(150 * glowScale + hitGlowExtra, 400);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 420,
          height: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: `perspective(600px) translateX(${x}px) rotateY(${flipY}deg) rotateZ(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        {/* Layer 1 — blurred glow blob */}
        <div
          style={{
            position: "absolute",
            width: glowSize,
            height: glowSize,
            borderRadius: "50%",
            background: "radial-gradient(circle, #FB923C, #FB7185, #F472B6)",
            filter: "blur(25px)",
            opacity: glowOpacity,
          }}
        />

        {/* Layer 2 — avatar icon */}
        <img
          src={staticFile("Avatar.svg")}
          style={{
            width: 420,
            height: 420,
            position: "relative",
            transformOrigin: "center center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default AngelAvatar;
