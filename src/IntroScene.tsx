import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

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
      }}
    >
      <defs>
        <radialGradient id="intro-blob-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FB7185" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={pathD} fill="url(#intro-blob-gradient)" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IntroScene — 180 frames (6s)
// ─────────────────────────────────────────────────────────────────────────────
export default function IntroScene() {
  const frame = useCurrentFrame();
  const { width: W } = useVideoConfig();

  // ── Phase 1: "Introducing" cascade  (0–32) ─────────────────────────────────
  const introText = "Introducing";
  const introFontSize = W * 0.07;

  const introFade = interpolate(frame, [16, 28], [1, 0], clamp());

  // ── Phase 2: Mist in-wave  (8–42) ───────────────────────────────────────────
  const mistTranslate = interpolate(frame, [8, 40], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const mistOpacity = interpolate(frame, [8, 16, 32, 42], [0, 0.4, 0.4, 0], clamp());

  const mist2Translate = interpolate(frame, [11, 43], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const mist2Opacity = interpolate(frame, [11, 19, 35, 45], [0, 0.25, 0.25, 0], clamp());

  const mist3Translate = interpolate(frame, [13, 45], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const mist3Opacity = interpolate(frame, [13, 21, 37, 47], [0, 0.15, 0.15, 0], clamp());

  // ── Phase 3: Avatar + "Angel Mode" reveal (45–65) ───────────────────────────
  const avatarX = interpolate(frame, [45, 65], [-300, 0], {
    easing: Easing.out(Easing.back(1.2)),
    ...clamp(),
  });
  const avatarOpacity = interpolate(frame, [45, 58], [0, 1], clamp());

  // Breathing — gentle scale pulse
  const breathScale = 1 + Math.sin(((frame - 45) / 60) * Math.PI * 2) * 0.03;

  const angelText = "Angel Mode";
  const angelFontSize = W * 0.07;

  // ── Phase 4: Hold (65–105) — Avatar + wordmark sit on black ─────────────────

  // ── Phase 5: Avatar pulse + camera shake (105–120) ──────────────────────────
  const avatarPulse = interpolate(frame, [105, 112, 120], [1, 1.18, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  const shakeIntensity = interpolate(frame, [105, 112, 120], [0, 1, 0], clamp());
  const shakeX = Math.sin(frame * 4.2) * 3 * shakeIntensity;
  const shakeY = Math.cos(frame * 5.1) * 2.5 * shakeIntensity;

  // ── Phase 6: Clean fade to black (140–170) ──────────────────────────────────
  const wordmarkFadeOut = interpolate(frame, [140, 170], [1, 0], clamp());
  const avatarFadeOut = interpolate(frame, [140, 170], [1, 0], clamp());
  const blobExitFade = interpolate(frame, [140, 170], [1, 0], clamp());

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>

      {/* ── Shake wrapper ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* ── Phase 1: "Introducing." ───────────────────────────────────── */}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: introFade,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: introFontSize,
              fontWeight: 800,
              color: "white",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {introText.split("").map((char, i) => {
              const charStart = i * 1.5;
              const p = interpolate(frame, [charStart, charStart + 10], [0, 1], {
                easing: Easing.out(Easing.back(1.8)),
                ...clamp(),
              });
              const y = interpolate(frame, [charStart, charStart + 10], [-40, 0], {
                easing: Easing.out(Easing.back(1.8)),
                ...clamp(),
              });
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${y}px)`,
                    opacity: p,
                    whiteSpace: "pre",
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>

        {/* ── Phase 2: Mist in-wave ─────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-10%",
            width: "120%",
            height: "35%",
            transform: `translateY(${mistTranslate}%)`,
            background:
              "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 40%, #F472B6 70%, transparent 100%)",
            filter: "blur(45px)",
            opacity: mistOpacity,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-20%",
            width: "140%",
            height: "30%",
            transform: `translateY(${mist2Translate}%)`,
            background:
              "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 40%, transparent 75%)",
            filter: "blur(55px)",
            opacity: mist2Opacity,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            width: "80%",
            height: "25%",
            transform: `translateY(${mist3Translate}%)`,
            background:
              "radial-gradient(ellipse at 50% 100%, #F472B6 0%, transparent 65%)",
            filter: "blur(60px)",
            opacity: mist3Opacity,
            pointerEvents: "none",
          }}
        />

        {/* ── Phase 3: Avatar + "Angel Mode" ──────────────────────────────── */}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
              transformOrigin: "center center",
            }}
          >
            {/* Avatar with blob glow */}
            <div
              style={{
                position: "relative",
                transform: `translateX(${avatarX}px)`,
                opacity: avatarOpacity * avatarFadeOut,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 260,
                height: 260,
              }}
            >
              <BlobGlow
                frame={frame}
                size={420}
                intensity={
                  (interpolate(frame, [45, 75], [0, 0.7], clamp()) +
                    Math.sin(frame / 25) * 0.04) *
                  blobExitFade
                }
              />
              <img
                src={staticFile("Avatar.svg")}
                width={260}
                height={260}
                style={{
                  position: "relative",
                  transform: `scale(${breathScale * avatarPulse})`,
                  transformOrigin: "center center",
                }}
              />
            </div>

            {/* "Angel Mode" character cascade */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: angelFontSize,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  overflow: "visible",
                }}
              >
                {angelText.split("").map((char, i) => {
                  const charStart = 50 + i * 2;
                  const p = interpolate(
                    frame,
                    [charStart, charStart + 10],
                    [0, 1],
                    { easing: Easing.out(Easing.back(1.5)), ...clamp() },
                  );
                  const charX = interpolate(
                    frame,
                    [charStart, charStart + 10],
                    [40, 0],
                    { easing: Easing.out(Easing.cubic), ...clamp() },
                  );
                  const charY = interpolate(
                    frame,
                    [charStart, charStart + 10],
                    [15, 0],
                    { easing: Easing.out(Easing.cubic), ...clamp() },
                  );
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        transform: `translateX(${charX}px) translateY(${charY}px)`,
                        opacity: p * wordmarkFadeOut,
                        whiteSpace: "pre",
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </div>
      {/* end shake wrapper */}

      {/* ── Fade to black (160–180) ───────────────────────────────────────── */}
      {frame >= 160 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [160, 180], [0, 1], clamp()),
            zIndex: 90,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
