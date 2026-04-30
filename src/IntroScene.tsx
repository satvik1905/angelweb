import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig, // still needed for width W
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

// ─────────────────────────────────────────────────────────────────────────────
// IntroScene
// ─────────────────────────────────────────────────────────────────────────────
export default function IntroScene() {
  const frame = useCurrentFrame();
  const { width: W } = useVideoConfig();

  // ── Phase 1: "Introducing" cascade  (0–32) ─────────────────────────────────
  const introText = "Introducing";
  const introFontSize = W * 0.07;

  // Text fades as the wave sweeps through it
  const introFade = interpolate(frame, [16, 28], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Phase 2: Mist in-wave  (8–42) ───────────────────────────────────────────
  // Layer 1 — main mist — starts rising while text is still visible
  const mistTranslate = interpolate(frame, [8, 40], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mistOpacity = interpolate(frame, [8, 16, 32, 42], [0, 0.4, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Layer 2 — wider, softer, +3 frames delayed
  const mist2Translate = interpolate(frame, [11, 43], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mist2Opacity = interpolate(frame, [11, 19, 35, 45], [0, 0.25, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Layer 3 — faint wisp, +5 frames delayed
  const mist3Translate = interpolate(frame, [13, 45], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mist3Opacity = interpolate(frame, [13, 21, 37, 47], [0, 0.15, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Phase 3: Avatar + "Angel Mode"  (45–85) ─────────────────────────────────
  const avatarX = interpolate(frame, [45, 65], [-300, 0], {
    easing: Easing.out(Easing.back(1.2)),
    ...clamp(),
  });
  const avatarOpacity = interpolate(frame, [45, 58], [0, 1], clamp());
  const avatarGlowOpacity = interpolate(frame, [45, 75], [0, 0.35], clamp());

  // Breathing — gentle scale pulse, ~2 s cycle at 30 fps
  const breathScale = 1 + Math.sin(((frame - 45) / 60) * Math.PI * 2) * 0.03;

  const angelText = "Angel Mode";
  const angelFontSize = W * 0.07;

  // ── Phase 4: Cinematic zoom — text rushes into camera, then black  (82–120) ──
  // Scale goes large enough that letters completely blow past screen edges
  const cinematicScale = interpolate(frame, [110, 120], [1, 12], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });
  // Black cuts in only after the text has filled the screen (~frame 113)
  const finalBlackOpacity = interpolate(frame, [113, 120], [0, 1], clamp());

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {/* ── Phase 1: "Introducing." ─────────────────────────────────────── */}
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

      {/* ── Phase 2: Mist in-wave ───────────────────────────────────────── */}
      {/* Layer 1 — main mist */}
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
      {/* Layer 2 — wider, softer, delayed */}
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
      {/* Layer 3 — faint trailing wisp */}
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

      {/* ── Phase 3: Avatar + "Angel Mode" — cinematic zoom out ───────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            transform: `scale(${cinematicScale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Avatar with glow */}
          <div
            style={{
              position: "relative",
              transform: `translateX(${avatarX}px) scale(${breathScale})`,
              opacity: avatarOpacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 260,
              height: 260,
            }}
          >
            {/* Glow blob behind avatar */}
            <div
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #FB923C, #FB7185, #F472B6)",
                filter: "blur(60px)",
                opacity: avatarGlowOpacity,
              }}
            />
            <img
              src={staticFile("Avatar.svg")}
              width={260}
              height={260}
              style={{ position: "relative" }}
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
                      opacity: p,
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

      {/* Final black fade ───────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: "#000000",
          opacity: finalBlackOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
