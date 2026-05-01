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
// IntroScene — 255 frames (8.5s)
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

  // ── Phase 3: Avatar + "Angel Mode" reveal (45–REVEAL_END) ───────────────────
  const avatarX = interpolate(frame, [45, 65], [-300, 0], {
    easing: Easing.out(Easing.back(1.2)),
    ...clamp(),
  });
  const avatarOpacity = interpolate(frame, [45, 58], [0, 1], clamp());

  // Breathing — gentle scale pulse
  const breathScale = 1 + Math.sin(((frame - 45) / 60) * Math.PI * 2) * 0.03;

  const angelText = "Angel Mode";
  const angelFontSize = W * 0.07;

  // ── Phase 4: Hold (REVEAL_END–120) ──────────────────────────────────────────

  // ── Phase 5: Wordmark exits (120–140) ───────────────────────────────────────
  const wordmarkExitFade = interpolate(frame, [120, 140], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });

  // ── Phase 6: Avatar slides to center (145–175) ──────────────────────────────
  // Avatar is in a flex row; ~380px offset brings it to true screen center
  const centerOffset = interpolate(frame, [145, 175], [0, 380], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // ── Phase 7: Avatar pulse + big glow halo (185–225) ─────────────────────────
  const avatarBigPulse = interpolate(frame, [185, 205, 225], [1, 1.4, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const glowHaloScale = interpolate(frame, [185, 205, 225], [1.0, 2.5, 1.5], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const glowHaloOpacity = interpolate(frame, [175, 185, 205, 225], [0, 0.8, 1.0, 0.6], clamp());

  // ── Phase 8: Avatar hides (225–235) ─────────────────────────────────────────
  const avatarHideFade = interpolate(frame, [225, 235], [1, 0], clamp());

  // ── Phase 9: White flash (215–255, stays at 1.0) ────────────────────────────
  const whiteFlashOpacity = interpolate(frame, [215, 235, 255], [0, 1, 1], clamp());

  // Combined avatar opacity
  const avatarFinalOpacity = avatarOpacity * avatarHideFade;

  // Combined avatar scale
  const avatarScale = breathScale * avatarBigPulse;

  const normalBlobIntensity =
    (interpolate(frame, [45, 75], [0, 0.7], clamp()) +
      Math.sin(frame / 25) * 0.04) *
    avatarHideFade;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>

      {/* ── Phase 1: "Introducing." ───────────────────────────────────────── */}
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

      {/* ── Phase 2: Mist in-wave ─────────────────────────────────────────── */}
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

      {/* ── Phase 3–7: Avatar + "Angel Mode" ──────────────────────────────── */}
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
              transform: `translateX(${avatarX + centerOffset}px)`,
              opacity: avatarFinalOpacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 260,
              height: 260,
            }}
          >
            {/* Normal blob glow (phases 3–7) */}
            <BlobGlow
              frame={frame}
              size={420}
              intensity={normalBlobIntensity}
            />

            {/* Big pulse halo (phase 7) */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 400,
                height: 400,
                marginLeft: -200,
                marginTop: -200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.9) 0%, rgba(251,113,133,0.7) 40%, rgba(244,114,182,0.4) 70%, transparent 100%)",
                filter: "blur(50px)",
                opacity: glowHaloOpacity,
                transform: `scale(${glowHaloScale})`,
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />

            <img
              src={staticFile("Avatar.svg")}
              width={260}
              height={260}
              style={{
                position: "relative",
                transform: `scale(${avatarScale})`,
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
                      opacity: p * wordmarkExitFade,
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

      {/* ── White flash — reaches 1.0 at frame 235 and holds through end ─── */}
      {frame >= 210 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 50%, #ffffff 0%, #FFE4EC 30%, #F8B4D9 70%, #F472B6 100%)",
            opacity: whiteFlashOpacity,
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
