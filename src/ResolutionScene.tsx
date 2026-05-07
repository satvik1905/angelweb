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

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

// ─────────────────────────────────────────────────────────────────────────────
// getBlobX — smooth per-segment motion with eased deceleration into each pill
// ─────────────────────────────────────────────────────────────────────────────
function getBlobX(f: number): number {
  const ez = clamp({ easing: EASE });
  if (f <= 50)  return interpolate(f, [5, 50],   [100,  700],  ez);
  if (f <= 70)  return 700;
  if (f <= 97)  return interpolate(f, [70, 97],  [700,  1700], ez);
  if (f <= 117) return 1700;
  if (f <= 144) return interpolate(f, [117, 144],[1700, 2700], ez);
  if (f <= 164) return 2700;
  return interpolate(f, [164, 186], [2700, 3500], ez);
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const PILLS = [
  { id: "budget", label: "Budget", worldX: 700,  arriveFrame: 50  },
  { id: "dates",  label: "Dates",  worldX: 1700, arriveFrame: 97  },
  { id: "work",   label: "Work",   worldX: 2700, arriveFrame: 144 },
];

const WORLD_WIDTH = 3200;
const BEAM_Y = 540;
const ICON_SIZE = 220;
const ICON_HALF = ICON_SIZE / 2;
const ICON_INITIAL_X = 100;

// ─────────────────────────────────────────────────────────────────────────────
// ResolutionScene — 255 frames (8.5s)
// ─────────────────────────────────────────────────────────────────────────────
export default function ResolutionScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  const V_BEAM_X = width / 2;
  const V_WORLD_H = 3600;
  const V_ICON_INITIAL_Y = 100;
  const V_BEAM_STROKE = 4;
  const vIconSize = 170;
  const vIconHalf = vIconSize / 2;

  const pathPos = getBlobX(frame);
  const prevPathPos = getBlobX(Math.max(0, frame - 1));

  const iconSize = isVertical ? vIconSize : ICON_SIZE;
  const iconHalf = isVertical ? vIconHalf : ICON_HALF;

  const floatOffset = Math.sin(frame / 22) * (isVertical ? 4 : 3);
  const prevFloatOffset = Math.sin(Math.max(0, frame - 1) / 22) * (isVertical ? 4 : 3);

  const tangentAngle = (() => {
    if (isVertical) {
      const dx = floatOffset - prevFloatOffset;
      const dy = pathPos - prevPathPos;
      return Math.abs(dy) > 0.3
        ? Math.max(-8, Math.min(8, Math.atan2(dx, dy) * (180 / Math.PI)))
        : 0;
    } else {
      const dx = pathPos - prevPathPos;
      const dy = floatOffset - prevFloatOffset;
      return Math.abs(dx) > 0.3
        ? Math.max(-8, Math.min(8, Math.atan2(dy, dx) * (180 / Math.PI)))
        : 0;
    }
  })();

  const breathScale = 1 + Math.sin((frame / 20) * Math.PI) * 0.03;

  const worldScale = frame < 30
    ? 4.0
    : interpolate(frame, [30, 60], [4.0, 2.2], {
        easing: Easing.out(Easing.cubic),
        ...clamp(),
      });

  const camTx = isVertical
    ? width / 2 - V_BEAM_X * worldScale
    : 960 - pathPos * worldScale;
  const camTy = isVertical
    ? height / 2 - pathPos * worldScale
    : BEAM_Y - BEAM_Y * worldScale;

  const worldW = isVertical ? width : WORLD_WIDTH;
  const worldH = isVertical ? V_WORLD_H : 1080;

  const iconOpacity = interpolate(frame, [0, 10], [0, 1], clamp());

  const beamGrow = interpolate(frame, [12, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const beamMainLength = isVertical
    ? beamGrow * (V_WORLD_H - V_ICON_INITIAL_Y)
    : beamGrow * (WORLD_WIDTH - ICON_INITIAL_X);
  const beamBackLength = isVertical
    ? beamGrow * V_ICON_INITIAL_Y
    : beamGrow * ICON_INITIAL_X;

  const exitProgress = interpolate(frame, [230, 255], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  const iconTx = isVertical
    ? V_BEAM_X - iconHalf + floatOffset
    : pathPos - iconHalf;
  const iconTy = isVertical
    ? pathPos - iconHalf
    : BEAM_Y - iconHalf + floatOffset;

  const glowX = isVertical ? V_BEAM_X + floatOffset : pathPos;
  const glowY = isVertical ? pathPos : BEAM_Y;

  const nearestPillDist = PILLS.reduce((minDist, pill) => {
    return Math.min(minDist, Math.abs(pathPos - pill.worldX));
  }, Infinity);
  const angelProximityOpacity = interpolate(
    nearestPillDist,
    [0, 60, 140],
    [1.0, 1.0, 1.0],
    clamp(),
  );

  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: "hidden" }}>

      {/* World-space wrapper */}
      <div
        style={{
          position: "absolute",
          width: worldW,
          height: worldH,
          top: 0,
          left: 0,
          transform: `translateX(${camTx}px) translateY(${camTy}px) scale(${worldScale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* ── HORIZONTAL beam ────────────────────────────────────────────── */}
        {!isVertical && (
          <>
            <div
              style={{
                position: "absolute",
                top: BEAM_Y,
                left: ICON_INITIAL_X,
                width: beamMainLength,
                height: 24,
                background:
                  "linear-gradient(90deg, transparent, rgba(251,113,133,0.25), rgba(251,146,60,0.3), rgba(251,113,133,0.25), transparent)",
                filter: "blur(8px)",
                transform: "translateY(-50%)",
                zIndex: 9,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: BEAM_Y,
                left: ICON_INITIAL_X,
                width: beamMainLength,
                height: 3,
                background:
                  "linear-gradient(90deg, #FB923C 0%, #FB7185 40%, #FB923C 80%, transparent 100%)",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: BEAM_Y,
                left: ICON_INITIAL_X - beamBackLength,
                width: beamBackLength,
                height: 18,
                background:
                  "linear-gradient(270deg, rgba(251,146,60,0.25), transparent)",
                filter: "blur(8px)",
                transform: "translateY(-50%)",
                zIndex: 9,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: BEAM_Y,
                left: ICON_INITIAL_X - beamBackLength,
                width: beamBackLength,
                height: 3,
                background:
                  "linear-gradient(270deg, #FB923C 0%, transparent 100%)",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: glowY,
                left: glowX,
                width: 120,
                height: 120,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.6) 0%, rgba(251,113,133,0.3) 30%, transparent 65%)",
                opacity: iconOpacity,
                zIndex: 11,
              }}
            />
          </>
        )}

        {/* ── VERTICAL beam ──────────────────────────────────────────────── */}
        {isVertical && (
          <>
            <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y, width: 24, height: beamMainLength, background: "linear-gradient(180deg, transparent, rgba(251,113,133,0.25), rgba(251,146,60,0.3), rgba(251,113,133,0.25), transparent)", filter: "blur(8px)", transform: "translateX(-50%)", zIndex: 9 }} />
            <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y, width: V_BEAM_STROKE, height: beamMainLength, background: "linear-gradient(180deg, #FB923C 0%, #FB7185 40%, #FB923C 80%, transparent 100%)", transform: "translateX(-50%)", zIndex: 10 }} />
            <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y - beamBackLength, width: 18, height: beamBackLength, background: "linear-gradient(0deg, rgba(251,146,60,0.25), transparent)", filter: "blur(8px)", transform: "translateX(-50%)", zIndex: 9 }} />
            <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y - beamBackLength, width: V_BEAM_STROKE, height: beamBackLength, background: "linear-gradient(0deg, #FB923C 0%, transparent 100%)", transform: "translateX(-50%)", zIndex: 10 }} />
            <div style={{ position: "absolute", left: glowX, top: glowY, width: 120, height: 120, borderRadius: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(251,146,60,0.6) 0%, rgba(251,113,133,0.3) 30%, transparent 65%)", opacity: iconOpacity, zIndex: 11 }} />
          </>
        )}

        {/* ── Angel icon ─────────────────────────────────────────────────── */}
        <img
          src={staticFile("Avatar.svg")}
          width={iconSize}
          height={iconSize}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: `${iconHalf}px ${iconHalf}px`,
            transform: `translate3d(${iconTx}px, ${iconTy}px, 0) rotate(${tangentAngle}deg) scale(${breathScale})`,
            zIndex: 50,
            pointerEvents: "none",
            opacity: iconOpacity * angelProximityOpacity,
          }}
        />

        {/* ── Pills ─────────────────────────────────────────────────────── */}
        {PILLS.map((pill) => {
          const revealFrame = pill.arriveFrame - 15;

          const pillEntry = interpolate(
            frame,
            [revealFrame, revealFrame + 10],
            [0, 1],
            { easing: Easing.out(Easing.cubic), ...clamp() },
          );

          const sinceImpact = frame - pill.arriveFrame;
          const isIlluminated = frame >= pill.arriveFrame;

          const illuminateProgress = isIlluminated
            ? interpolate(sinceImpact, [0, 15], [0, 1], clamp())
            : 0;

          const pillFloat = Math.sin(frame / 40 + pill.worldX * 0.004) * 6;
          const pillX = isVertical ? V_BEAM_X + pillFloat : pill.worldX;
          const pillY = isVertical ? pill.worldX : BEAM_Y + pillFloat;

          const textColor = isIlluminated ? "transparent" : COLORS.textPrimary;
          const textBg = isIlluminated
            ? "linear-gradient(135deg, #FB923C, #FB7185)"
            : "none";

          const pillBorder = isIlluminated
            ? `1.5px solid rgba(251,146,60,${0.5 + illuminateProgress * 0.5})`
            : "1.5px solid rgba(0,0,0,0.08)";

          const pillShadow = isIlluminated
            ? `0 4px 12px rgba(251,113,133,${0.08 + illuminateProgress * 0.2}), 0 0 ${20 + illuminateProgress * 30}px rgba(251,146,60,${0.15 * illuminateProgress})`
            : "0 4px 12px rgba(251, 113, 133, 0.08)";

          return (
            <div key={pill.id}>
              {isIlluminated && (
                <div
                  style={{
                    position: "absolute",
                    left: pillX,
                    top: pillY,
                    width: 200,
                    height: 80,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(ellipse, rgba(251,146,60,0.2) 0%, rgba(251,113,133,0.15) 40%, transparent 70%)",
                    filter: "blur(10px)",
                    opacity: illuminateProgress,
                    zIndex: 39,
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: pillX,
                  top: pillY,
                  transform: "translate(-50%, -50%)",
                  opacity: pillEntry,
                  zIndex: 40,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    padding: "14px 30px",
                    borderRadius: 40,
                    background: COLORS.surfaceSubtle,
                    border: pillBorder,
                    boxShadow: pillShadow,
                    whiteSpace: "nowrap",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      color: textColor,
                      backgroundImage: textBg,
                      backgroundClip: isIlluminated ? "text" : "unset",
                      WebkitBackgroundClip: isIlluminated ? "text" : "unset",
                    }}
                  >
                    {pill.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Exit: fade to white (f230–f255) ────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.background,
          opacity: exitProgress,
          zIndex: 200,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
