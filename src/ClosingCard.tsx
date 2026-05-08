import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
} from "remotion";
import { COLORS } from "./v4/tokens";

const ANGEL_MODE = "Angel Mode";
const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

// ─────────────────────────────────────────────────────────────────────────────
// BlobGlow — organic morphing gradient blob
// ─────────────────────────────────────────────────────────────────────────────
const BlobGlow = ({
  frame,
  size = 320,
  intensity = 1,
}: {
  frame: number;
  size?: number;
  intensity?: number;
}) => {
  const numPoints = 8;
  const baseRadius = size / 2;

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const freq1 = 0.025 + i * 0.003;
    const freq2 = 0.018 + i * 0.002;
    const phase = i * 0.7;
    const morph1 = Math.sin(frame * freq1 + phase) * 18;
    const morph2 = Math.sin(frame * freq2 + phase * 1.3) * 12;
    const r = baseRadius + morph1 + morph2;
    points.push({
      x: baseRadius + Math.cos(angle) * r,
      y: baseRadius + Math.sin(angle) * r,
    });
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < numPoints; i++) {
    const next = points[(i + 1) % numPoints];
    const afterNext = points[(i + 2) % numPoints];
    const midX = (next.x + afterNext.x) / 2;
    const midY = (next.y + afterNext.y) / 2;
    pathD += ` Q ${next.x} ${next.y} ${midX} ${midY}`;
  }
  pathD += " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(35px)",
        opacity: intensity,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id="blob-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FB7185" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={pathD} fill="url(#blob-gradient)" />
    </svg>
  );
};

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
      filter: "drop-shadow(0 0 8px rgba(251,113,133,0.4))",
    }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB923C" />
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
  { angle: -45, distance: 200, baseSize: 28, phase: 0, spinSpeed: 0.4 },
  { angle: 30, distance: 230, baseSize: 22, phase: 1.2, spinSpeed: -0.3 },
  { angle: 110, distance: 210, baseSize: 32, phase: 2.4, spinSpeed: 0.5 },
  { angle: 180, distance: 240, baseSize: 18, phase: 3.6, spinSpeed: -0.4 },
  { angle: 240, distance: 200, baseSize: 26, phase: 4.8, spinSpeed: 0.35 },
  { angle: -110, distance: 220, baseSize: 24, phase: 6.0, spinSpeed: -0.45 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ClosingCard — 90 frames (3 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function ClosingCard() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // ── Orientation-aware scaling ──────────────────────────────────────────────
  const s = isVertical ? 1.8 : 1.0;
  const angelSize = Math.round(280 * s);
  const blobSize = Math.round(400 * s);
  const angelBlockMargin = Math.round(16 * s);
  const wordmarkFontSize = Math.round(96 * s);
  const byGap = Math.round(12 * s);
  const logoHeight = Math.round(60 * (isVertical ? 1.5 : 1));
  const sparkleScale = isVertical ? 1.8 : 1.0;
  const floatingRadius = isVertical ? 380 : 220;

  // ── Handoff fade-in (f0–f10) ──────────────────────────────────────────────
  const handoffOpacity = interpolate(frame, [0, 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Mist transition (f0–f20) ──────────────────────────────────────────────
  const mistFloodOpacity = interpolate(frame, [0, 10], [0.25, 0], CL);
  const mistTranslate = interpolate(frame, [0, 18], [-200, 100], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const mistOpacity = interpolate(frame, [0, 3, 14, 20], [0.4, 0.5, 0.5, 0], CL);

  // ── Angel descent (f5–f30) ────────────────────────────────────────────────
  const angelY = interpolate(frame, [5, 30], [-120, 0], {
    easing: Easing.out(Easing.back(1.4)),
    ...CL,
  });
  const angelOpacity = interpolate(frame, [5, 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const angelScale = interpolate(frame, [5, 20, 30], [0.7, 1.05, 1.0], {
    easing: settleEasing,
    ...CL,
  });
  const breathe = Math.sin((frame - 30) / 30) * 0.02;
  const finalScale = frame > 30 ? 1.0 + breathe : angelScale;

  // ── BlobGlow ramp (f10–f40) ───────────────────────────────────────────────
  const blobIntensity =
    interpolate(frame, [10, 40], [0, 0.17], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    }) + Math.sin(frame / 25) * 0.015;

  // ── "Angel Mode" wordmark cascade (f25–f50) ──────────────────────────────
  // 2-frame stagger per character (was 5-frame)

  // ── "Try Angel now..." per-word cascade (f60–f99) ──────────────────────
  const TRY_ANGEL_WORDS = ["Try", "Angel", "now", "in", "your", "group", "chats"];
  const TRY_ANGEL_START = 48;
  const TRY_ANGEL_WORD_STAGGER = 4;

  // ── "Only on [logo]" per-element cascade (f90–f111) ───────────────────
  const ONLY_ON_START = 78;
  const ONLY_ON_STAGGER = 4;
  const onlyOnAnim = (elementIndex: number) => {
    const es = ONLY_ON_START + elementIndex * ONLY_ON_STAGGER;
    return {
      opacity: interpolate(frame, [es, es + 10], [0, 1], { easing: Easing.out(Easing.cubic), ...CL }),
      y: interpolate(frame, [es, es + 13], [-15, 0], { easing: Easing.out(Easing.back(1.4)), ...CL }),
      blur: interpolate(frame, [es, es + 7], [6, 0], { easing: Easing.out(Easing.cubic), ...CL }),
    };
  };

  // ── 6 orbiting sparkles (f30–f70) ─────────────────────────────────────────
  // Staggered 4f apart starting f30, fade in over 15f each

  // ── 14 floating sparkles (f20–f88) ────────────────────────────────────────

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
        opacity: handoffOpacity,
      }}
    >
      {/* ── Mist transition (f0–f20) ──────────────────────────────────── */}
      {frame < 20 && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
              opacity: mistFloodOpacity,
              zIndex: 99,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "-10%",
              width: "120%",
              height: "20%",
              transform: `translateY(${mistTranslate}%)`,
              background:
                "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 30%, transparent 65%)",
              filter: "blur(80px)",
              opacity: mistOpacity,
              zIndex: 100,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* ── Centered content column ───────────────────────────────────── */}
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
        {/* ── Angel icon block ────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            width: angelSize,
            height: angelSize,
            marginBottom: angelBlockMargin,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BlobGlow frame={frame} size={blobSize} intensity={blobIntensity} />
          <img
            src={staticFile("Avatar.svg")}
            style={{
              width: angelSize,
              height: angelSize,
              transform: `translateY(${angelY}px) scale(${finalScale})`,
              opacity: angelOpacity,
              transformOrigin: "center center",
              position: "relative",
              zIndex: 2,
            }}
          />

          {/* Sparkles — 4f stagger starting f30 */}
          {SPARKLES.map((sparkle, i) => {
            const enterStart = 30 + i * 4;
            const enterOpacity = interpolate(
              frame,
              [enterStart, enterStart + 15],
              [0, 1],
              { easing: Easing.out(Easing.cubic), ...CL },
            );
            const twinkle = Math.sin(frame / 18 + sparkle.phase);
            const twinkleOpacity = 0.5 + (twinkle + 1) * 0.25;
            const sizeScale = 0.85 + (twinkle + 1) * 0.15;
            const rotation = (frame * sparkle.spinSpeed) % 360;
            const angleRad = (sparkle.angle * Math.PI) / 180;
            const dist = sparkle.distance * sparkleScale;
            const x = Math.cos(angleRad) * dist;
            const y = Math.sin(angleRad) * dist;
            const driftX = Math.sin(frame / 40 + sparkle.phase) * 8 * sparkleScale;
            const driftY = Math.cos(frame / 35 + sparkle.phase) * 8 * sparkleScale;

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
                  size={sparkle.baseSize * sizeScale * sparkleScale}
                  opacity={1}
                  rotation={rotation}
                  gradientId={`sparkleGrad-${i}`}
                />
              </div>
            );
          })}
        </div>

        {/* ── "Angel Mode" wordmark — 2f stagger ─────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: wordmarkFontSize,
            fontWeight: 800,
            letterSpacing: isVertical ? "-0.03em" : "-0.02em",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {ANGEL_MODE.split("").map((char, i) => {
            const charStart = 25 + i * 2;
            const charOpacity = interpolate(
              frame,
              [charStart, charStart + 12],
              [0, 1],
              { easing: Easing.out(Easing.cubic), ...CL },
            );
            const charY = interpolate(
              frame,
              [charStart, charStart + 15],
              [-30, 0],
              { easing: Easing.out(Easing.back(1.4)), ...CL },
            );
            const charBlur = interpolate(
              frame,
              [charStart, charStart + 8],
              [12, 0],
              { easing: Easing.out(Easing.cubic), ...CL },
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
                    "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
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

        {/* ── "Try Angel now in your group chats" — per-word cascade ── */}
        <div
          style={{
            marginTop: 32 * s,
            fontSize: Math.round(32 * s),
            fontWeight: 600,
            color: COLORS.textPrimary,
            letterSpacing: "-0.01em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textAlign: "center",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.25em",
          }}
        >
          {TRY_ANGEL_WORDS.map((word, i) => {
            const ws = TRY_ANGEL_START + i * TRY_ANGEL_WORD_STAGGER;
            const wordOpacity = interpolate(frame, [ws, ws + 12], [0, 1], { easing: Easing.out(Easing.cubic), ...CL });
            const wordY = interpolate(frame, [ws, ws + 15], [-20, 0], { easing: Easing.out(Easing.back(1.4)), ...CL });
            const wordBlur = interpolate(frame, [ws, ws + 8], [8, 0], { easing: Easing.out(Easing.cubic), ...CL });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: wordOpacity,
                  transform: `translateY(${wordY}px)`,
                  filter: `blur(${wordBlur}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* ── "Only on [StayNow logo]" — per-element cascade ────────── */}
        {(() => {
          const a0 = onlyOnAnim(0);
          const a1 = onlyOnAnim(1);
          const a2 = onlyOnAnim(2);
          return (
            <div
              style={{
                marginTop: 20 * s,
                display: "flex",
                alignItems: "center",
                gap: byGap,
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: Math.round(26 * (isVertical ? 1.5 : 1)),
                  fontWeight: 400,
                  color: COLORS.textSecondary,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  display: "inline-block",
                  opacity: a0.opacity,
                  transform: `translateY(${a0.y}px)`,
                  filter: `blur(${a0.blur}px)`,
                }}
              >
                Only
              </span>
              <span
                style={{
                  fontSize: Math.round(26 * (isVertical ? 1.5 : 1)),
                  fontWeight: 400,
                  color: COLORS.textSecondary,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  display: "inline-block",
                  opacity: a1.opacity,
                  transform: `translateY(${a1.y}px)`,
                  filter: `blur(${a1.blur}px)`,
                }}
              >
                on
              </span>
              <Img
                src={staticFile("StayNow.jpg")}
                style={{
                  height: logoHeight,
                  opacity: a2.opacity,
                  transform: `translateY(${a2.y}px)`,
                  filter: `blur(${a2.blur}px)`,
                }}
              />
            </div>
          );
        })()}
      </div>
      {/* end centered content column */}

      {/* ── Floating sparkles (f20–f88) — magenta on white ────────────── */}
      {frame >= 20 &&
        [...Array(14)].map((_, i) => {
          const seed = i * 47;
          const angle = (i / 14) * Math.PI * 2 + frame / 80;
          const radius = floatingRadius + (seed % 80) * sparkleScale;
          const sparkX = Math.cos(angle) * radius;
          const sparkY = Math.sin(angle) * radius - 80 * sparkleScale;
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
                  "radial-gradient(circle, #F472B6, rgba(251,113,133,0.4), transparent)",
                opacity:
                  Math.max(0, sparkOpacity) *
                  interpolate(frame, [20, 35, 91, 106], [0, 1, 1, 0], {
                    easing: Easing.inOut(Easing.cubic),
                    ...CL,
                  }),
                boxShadow: "0 0 12px rgba(251,113,133,0.4)",
                pointerEvents: "none",
                zIndex: 20,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
}
