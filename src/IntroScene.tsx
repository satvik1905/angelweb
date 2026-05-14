import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { COLORS } from "./v4/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

// ─────────────────────────────────────────────────────────────────────────────
// BlobGlow — organic morphing gradient blob (reduced intensity for white)
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
// IntroScene — 120 frames (4 seconds)
//
// Phase 1 (0–55f  / 0–1.8s):  Mist + Angel avatar forms slowly (contemplative)
// Phase 2 (55–88f / 1.8–2.9s): "Angel Mode" character cascade
// Phase 3 (88–120f/ 2.9–4s):   Wordmark exit → avatar centers → big pulse → flash
//
// VO sync: "Until now." plays over the silent visual buildup (Angel forming)
//          "Introducing Angel Mode" plays over the wordmark reveal
// ─────────────────────────────────────────────────────────────────────────────
export default function IntroScene() {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const isVertical = H > W;

  // ── Phase 1: Subtle warm wash from bottom (replaces 3 mist layers) ────────
  const mistTranslate = interpolate(frame, [5, 40], [100, -200], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const mistOpacity = interpolate(
    frame,
    [5, 12, 30, 50],
    [0, 0.4, 0.4, 0],
    clamp(),
  );

  // ── Phase 1: Avatar entrance (12–55f) — slow, contemplative formation ──────
  const avatarX = interpolate(frame, [12, 55], [-300, 0], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const avatarOpacity = interpolate(frame, [12, 48], [0, 1], clamp());

  // Breathing — gentle scale pulse (starts after avatar settles at ~55f)
  const breathScale = 1 + Math.sin(((frame - 55) / 50) * Math.PI * 2) * 0.03;

  const angelText = "Angel Mode";
  const angelFontSize = isVertical ? W * 0.146 : W * 0.07;

  // Avatar + glow sizing — scale up 1.6x for vertical
  const avatarSize = isVertical ? 504 : 280;
  const blobSize = isVertical ? 670 : 420;
  const haloSize = isVertical ? 640 : 400;

  // ── Phase 3: Wordmark exits (88–100f) ───────────────────────────────────────
  const wordmarkExitFade = interpolate(frame, [88, 100], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });

  // ── Phase 3: Avatar slides to center (95–108f) ──────────────────────────────
  const centerOffset = isVertical
    ? 0
    : interpolate(frame, [95, 108], [0, 380], {
        easing: Easing.inOut(Easing.cubic),
        ...clamp(),
      });

  // ── Phase 3: Big pulse + glow halo (100–115f) ───────────────────────────────
  const avatarBigPulse = interpolate(frame, [100, 108, 115], [1, 1.4, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const glowHaloScale = interpolate(frame, [100, 108, 115], [1.0, 2.5, 1.5], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const glowHaloOpacity = interpolate(
    frame,
    [95, 100, 108, 115],
    [0, 0.3, 0.4, 0.2],
    clamp(),
  );

  // ── Phase 3: Avatar hides (110–118f) ────────────────────────────────────────
  const avatarHideFade = interpolate(frame, [110, 118], [1, 0], clamp());

  // ── Phase 3: Brand gradient bloom flash (replaces white flash) ──────────────
  const flashScale = interpolate(frame, [105, 113], [0.3, 2.5], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const flashOpacity = interpolate(
    frame,
    [105, 109, 113, 120],
    [0, 0.85, 0.85, 0],
    clamp(),
  );
  // White overlay after flash dissipates — hold white through end
  const whiteHoldOpacity = interpolate(frame, [115, 120], [0, 1], clamp());

  // Combined
  const avatarFinalOpacity = avatarOpacity * avatarHideFade;
  const avatarScale = breathScale * avatarBigPulse;

  // BlobGlow at ~30% of original intensity for white bg
  const normalBlobIntensity =
    (interpolate(frame, [15, 55], [0, 0.21], clamp()) +
      Math.sin(frame / 25) * 0.012) *
    avatarHideFade;

  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: "hidden" }}>

      {/* Phase 1: Subtle warm gradient wash from bottom (single layer) */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: "-20%",
          width: "140%",
          height: "70%",
          transform: `translateY(${mistTranslate}%)`,
          background:
            "linear-gradient(to top, rgba(251,113,133,0.08) 0%, rgba(244,114,182,0.04) 40%, transparent 100%)",
          filter: "blur(40px)",
          opacity: mistOpacity,
          pointerEvents: "none",
        }}
      />

      {/* ── Phases 2–3: Avatar + "Angel Mode" ───────────────────────────────── */}
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
            flexDirection: isVertical ? "column" : "row",
            alignItems: "center",
            gap: isVertical ? 48 : 40,
            transformOrigin: "center center",
          }}
        >
          {/* Avatar with blob glow */}
          <div
            style={{
              position: "relative",
              transform: isVertical
                ? `translateX(${avatarX}px)`
                : `translateX(${avatarX + centerOffset}px)`,
              opacity: avatarFinalOpacity,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: avatarSize,
              height: avatarSize,
            }}
          >
            {/* Normal blob glow — reduced for white */}
            <BlobGlow
              frame={frame}
              size={blobSize}
              intensity={normalBlobIntensity}
            />

            {/* Big pulse halo (phase 3) — warm brand gradient, reduced for white */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: haloSize,
                height: haloSize,
                marginLeft: -haloSize / 2,
                marginTop: -haloSize / 2,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.4) 0%, rgba(251,113,133,0.2) 40%, transparent 80%)",
                filter: "blur(8px)",
                opacity: glowHaloOpacity,
                transform: `scale(${glowHaloScale})`,
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />

            <img
              src={staticFile("Avatar.svg")}
              width={avatarSize}
              height={avatarSize}
              style={{
                position: "relative",
                transform: `scale(${avatarScale})`,
                transformOrigin: "center center",
              }}
            />
          </div>

          {/* "Angel Mode" character cascade — brand gradient text */}
          <div style={{
            position: "relative",
            marginLeft: isVertical ? 0 : -60,
            marginTop: isVertical ? -95 : 0,
          }}>
            <div
              style={{
                display: "flex",
                justifyContent: isVertical ? "center" : "flex-start",
                fontSize: angelFontSize,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                overflow: "visible",
              }}
            >
              {angelText.split("").map((char, i) => {
                const charStart = 55 + i * 3;
                const p = interpolate(
                  frame,
                  [charStart, charStart + 14],
                  [0, 1],
                  { easing: Easing.out(Easing.back(1.5)), ...clamp() },
                );
                const charX = interpolate(
                  frame,
                  [charStart, charStart + 14],
                  [40, 0],
                  { easing: Easing.out(Easing.cubic), ...clamp() },
                );
                const charY = interpolate(
                  frame,
                  [charStart, charStart + 14],
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
          </div>
        </div>
      </AbsoluteFill>

      {/* ── Phase 3: Brand gradient bloom flash ──────────────────────────────── */}
      {frame >= 100 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: Math.max(W, H),
              height: Math.max(W, H),
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #FB923C 0%, #FB7185 30%, #F472B6 60%, transparent 100%)",
              transform: `scale(${flashScale})`,
              opacity: flashOpacity,
              filter: "blur(20px)",
            }}
          />
        </div>
      )}

      {/* White hold — resolves to pure white after flash */}
      {frame >= 115 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.background,
            opacity: whiteHoldOpacity,
            zIndex: 101,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
