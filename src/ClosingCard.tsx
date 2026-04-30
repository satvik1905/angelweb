import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

const ANGEL_MODE = "Angel Mode";

// ─────────────────────────────────────────────────────────────────────────────
// Sparkle
// ─────────────────────────────────────────────────────────────────────────────
const Sparkle = ({
  size,
  opacity,
  rotation,
  gradientId,
}: {
  size: number;
  opacity: number;
  rotation: number;
  gradientId: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform: `rotate(${rotation}deg)`,
      opacity,
      filter: "drop-shadow(0 0 8px rgba(244,114,182,0.6))",
    }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#F472B6" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
      fill={`url(#${gradientId})`}
    />
  </svg>
);

const SPARKLES = [
  { angle: -45,  distance: 200, baseSize: 28, phase: 0,   spinSpeed: 0.4   },
  { angle: 30,   distance: 230, baseSize: 22, phase: 1.2, spinSpeed: -0.3  },
  { angle: 110,  distance: 210, baseSize: 32, phase: 2.4, spinSpeed: 0.5   },
  { angle: 180,  distance: 240, baseSize: 18, phase: 3.6, spinSpeed: -0.4  },
  { angle: 240,  distance: 200, baseSize: 26, phase: 4.8, spinSpeed: 0.35  },
  { angle: -110, distance: 220, baseSize: 24, phase: 6.0, spinSpeed: -0.45 },
];

export default function ClosingCard() {
  const frame = useCurrentFrame();

  // ── Beat 2: Angel descent ───────────────────────────────────────────────
  const angelY = interpolate(frame, [20, 80], [-120, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const angelOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const angelScale = interpolate(frame, [20, 60, 80], [0.7, 1.05, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = Math.sin((frame - 80) / 30) * 0.02;
  const finalScale = frame > 80 ? 1.0 + breathe : angelScale;

  // ── Beat 3: Shimmer divider progress ────────────────────────────────────
  const dividerOpacity = interpolate(frame, [125, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dividerScaleX = interpolate(frame, [125, 160], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Beat 4: Tagline ──────────────────────────────────────────────────────
  const taglineOpacity = interpolate(frame, [130, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [130, 170], [10, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Vignette ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 90%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Ambient bottom glow ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.18), transparent 65%)",
          opacity: interpolate(frame, [30, 80], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />

      {/* ── Beat 1: Mist transition IN (frames 0–35) ────────────────────── */}
      {frame < 35 && (
        <>
          {/* Gradient color flood from previous scene */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
              opacity: interpolate(frame, [0, 15], [0.25, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              zIndex: 99,
              pointerEvents: "none",
            }}
          />
          {/* Mist layer rising out */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "-10%",
              width: "120%",
              height: "20%",
              transform: `translateY(${interpolate(
                frame,
                [0, 30],
                [-200, 100],
                {
                  easing: Easing.inOut(Easing.cubic),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )}%)`,
              background:
                "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 30%, transparent 65%)",
              filter: "blur(80px)",
              opacity: interpolate(frame, [0, 5, 25, 35], [0.4, 0.5, 0.5, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              zIndex: 100,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* ── Centered content column ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ── Angel icon block ──────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            width: 280,
            height: 280,
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glow behind */}
          <div
            style={{
              position: "absolute",
              width: 240,
              height: 240,
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 25) * 0.06})`,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #FB7185, #F472B6, transparent)",
              filter: "blur(50px)",
              opacity:
                interpolate(frame, [25, 70], [0, 0.75], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) +
                Math.sin(frame / 25) * 0.08,
              pointerEvents: "none",
            }}
          />
          {/* Angel icon */}
          <img
            src={staticFile("Avatar.svg")}
            style={{
              width: 280,
              height: 280,
              transform: `translateY(${angelY}px) scale(${finalScale})`,
              opacity: angelOpacity,
              transformOrigin: "center center",
              position: "relative",
              zIndex: 2,
            }}
          />

          {/* Sparkles */}
          {SPARKLES.map((sparkle, i) => {
            const enterStart = 80 + i * 6;
            const enterOpacity = interpolate(
              frame,
              [enterStart, enterStart + 25],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const twinkle = Math.sin(frame / 18 + sparkle.phase);
            const twinkleOpacity = 0.5 + (twinkle + 1) * 0.25;
            const sizeScale = 0.85 + (twinkle + 1) * 0.15;
            const rotation = (frame * sparkle.spinSpeed) % 360;
            const angleRad = (sparkle.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * sparkle.distance;
            const y = Math.sin(angleRad) * sparkle.distance;
            const driftX = Math.sin(frame / 40 + sparkle.phase) * 8;
            const driftY = Math.cos(frame / 35 + sparkle.phase) * 8;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${x + driftX}px), calc(-50% + ${y + driftY}px))`,
                  opacity: enterOpacity * twinkleOpacity,
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              >
                <Sparkle
                  size={sparkle.baseSize * sizeScale}
                  opacity={1}
                  rotation={rotation}
                  gradientId={`sparkleGrad-${i}`}
                />
              </div>
            );
          })}
        </div>

        {/* ── "Angel Mode" wordmark ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {ANGEL_MODE.split("").map((char, i) => {
            const charStart = 70 + i * 5;
            const charOpacity = interpolate(
              frame,
              [charStart, charStart + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const charY = interpolate(
              frame,
              [charStart, charStart + 25],
              [-30, 0],
              {
                easing: Easing.out(Easing.back(1.6)),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const charBlur = interpolate(
              frame,
              [charStart, charStart + 15],
              [12, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );

            if (char === " ")
              return (
                <span key={i} style={{ width: "0.3em" }}>
                  &nbsp;
                </span>
              );

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: charOpacity,
                  transform: `translateY(${charY}px)`,
                  filter: `blur(${charBlur}px)`,
                  backgroundImage:
                    "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #FB7185 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* ── Gradient divider ──────────────────────────────────────────── */}
        <div
          style={{
            width: 60,
            height: 1,
            marginTop: 18,
            marginBottom: 12,
            background:
              "linear-gradient(90deg, transparent, rgba(244,114,182,0.6), transparent)",
            opacity: dividerOpacity,
            transform: `scaleX(${dividerScaleX})`,
          }}
        />

        {/* ── StayNow logo ──────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            by
          </span>
          <img
            src={staticFile("StayNow.png")}
            style={{
              height: 60,
              filter: "brightness(1.1)",
            }}
          />
        </div>
      </div>
      {/* end centered content column */}

      {/* ── Beat 5: Floating sparkles (frames 60–210) ───────────────────── */}
      {frame >= 60 &&
        [...Array(14)].map((_, i) => {
          const seed = i * 47;
          const angle = (i / 14) * Math.PI * 2 + frame / 80;
          const radius = 220 + (seed % 80);
          const sparkX = Math.cos(angle) * radius;
          const sparkY = Math.sin(angle) * radius - 80;
          const sparkOpacity = Math.sin((frame + i * 8) / 30) * 0.5 + 0.4;
          const sparkSize = 4 + (i % 3) * 2;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: sparkSize,
                height: sparkSize,
                marginLeft: sparkX,
                marginTop: sparkY,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #ffffff, rgba(244,114,182,0.6), transparent)",
                opacity:
                  Math.max(0, sparkOpacity) *
                  interpolate(frame, [60, 90, 200, 220], [0, 1, 1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                boxShadow: "0 0 12px rgba(255,255,255,0.7)",
                pointerEvents: "none",
                zIndex: 20,
              }}
            />
          );
        })}

      {/* ── Beat 6: Final fade to black (frames 210–240) ────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
          opacity: interpolate(frame, [210, 240], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 200,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
