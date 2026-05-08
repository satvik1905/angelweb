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
// Data
// ─────────────────────────────────────────────────────────────────────────────
const PILLS = [
  { id: "budget", label: "Budget", worldX: 700,  arriveFrame: 50  },
  { id: "dates",  label: "Dates",  worldX: 1700, arriveFrame: 97  },
  { id: "work",   label: "Work",   worldX: 2700, arriveFrame: 144 },
];

const WORLD_WIDTH = 3200;
const BEAM_Y = 540;
const ICON_INITIAL_X = 100;

// Angel (pinned at top, screen-space)
const ANGEL_SIZE = 240;
const ANGEL_Y = 200;

// Traveling blob
const BLOB_SIZE = 24;
const BLOB_HALO_SIZE = 40;

// ─────────────────────────────────────────────────────────────────────────────
// Blob — single continuous traveler, same path as old Angel
// ─────────────────────────────────────────────────────────────────────────────
function getBlobX(f: number): number {
  const ez = clamp({ easing: EASE });
  if (f <= 50)  return interpolate(f, [5, 50],   [100,  700],  ez);
  if (f <= 70)  return 700;
  if (f <= 97)  return interpolate(f, [70, 97],  [700,  1700], ez);
  if (f <= 117) return 1700;
  if (f <= 144) return interpolate(f, [117, 144],[1700, 2700], ez);
  // Hold at Work, then fade out — no exit sweep
  return 2700;
}

function getBlobOpacity(f: number): number {
  if (f < 5) return 0;
  if (f < 8) return interpolate(f, [5, 8], [0, 1], clamp());
  if (f < 164) return 1;
  if (f < 176) return interpolate(f, [164, 176], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Angel pulse on chip impacts
// ─────────────────────────────────────────────────────────────────────────────
function getAngelPulse(f: number): number {
  const impacts = [50, 97, 144];
  let pulse = 1.0;
  for (const impact of impacts) {
    const pf = f - impact;
    if (pf >= -4 && pf < 4) {
      // up phase: -4 to 0
      if (pf < 0) {
        pulse *= 1.0 + 0.05 * interpolate(pf, [-4, 0], [0, 1], {
          easing: Easing.out(Easing.cubic),
          ...clamp(),
        });
      } else {
        // down phase: 0 to 4
        pulse *= 1.0 + 0.05 * interpolate(pf, [0, 4], [1, 0], {
          easing: Easing.in(Easing.cubic),
          ...clamp(),
        });
      }
    }
  }
  return pulse;
}

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

  // ── Blob state ────────────────────────────────────────────────────────────
  const blobX = getBlobX(frame);
  const blobOpacity = getBlobOpacity(frame);

  // ── Camera follows blob ───────────────────────────────────────────────────
  const worldScale = frame < 30
    ? 4.0
    : interpolate(frame, [30, 60], [4.0, 2.2], {
        easing: Easing.out(Easing.cubic),
        ...clamp(),
      });

  // Camera follows blob, then pans right past Work (f164–f200), then holds
  const camTrackX = frame < 164
    ? blobX
    : frame < 200
      ? interpolate(frame, [164, 200], [2700, 3300], {
          easing: Easing.inOut(Easing.cubic),
          ...clamp(),
        })
      : 3300;
  const camTx = isVertical
    ? width / 2 - V_BEAM_X * worldScale
    : 960 - camTrackX * worldScale;
  const camTy = isVertical
    ? height / 2 - camTrackX * worldScale
    : BEAM_Y - BEAM_Y * worldScale;

  const worldW = isVertical ? width : WORLD_WIDTH;
  const worldH = isVertical ? V_WORLD_H : 1080;

  // ── Angel (screen-space) ────────────────────────────────────────────────
  const angelOpacity = interpolate(frame, [0, 10], [0, 1], clamp());
  const breathScale = 1 + Math.sin((frame / 20) * Math.PI) * 0.03;
  const angelPulse = getAngelPulse(frame);

  // Angel descent: f200–f225, Y 200→540, scale 1.0→1.6
  const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);
  const angelDescentY = interpolate(frame, [200, 225], [ANGEL_Y, 540], {
    easing: settleEasing,
    ...clamp(),
  });
  const angelDescentScale = interpolate(frame, [200, 225], [1.0, 1.6], {
    easing: settleEasing,
    ...clamp(),
  });
  const angelCurrentY = frame < 200 ? ANGEL_Y : angelDescentY;
  const angelFinalScale = breathScale * angelPulse * (frame < 200 ? 1.0 : angelDescentScale);

  // Angel fade-out: f230–f246 (synchronized inverse with bloom)
  const angelFadeOut = interpolate(frame, [230, 246], [1, 0], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const angelCombinedOpacity = angelOpacity * angelFadeOut;

  // Full-canvas bloom: f230–f246 fade in, f246–f249 hold, f249–f255 fade to white
  const bloomFadeIn = interpolate(frame, [230, 246], [0, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const bloomFadeOut = interpolate(frame, [249, 255], [1.0, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const bloomOpacity = frame < 249 ? bloomFadeIn : bloomFadeIn * bloomFadeOut;

  // ── Beam — gray base track + progressive orange trail ──────────────────
  const beamAppear = interpolate(frame, [12, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // Trail extent: follows blob X, clamped to track end (2770)
  const trailWidth = Math.max(0, Math.min(blobX, 2700) - ICON_INITIAL_X);


  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: "hidden" }}>

      {/* World-space wrapper (camera transform) */}
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
        {/* ── HORIZONTAL track ───────────────────────────────────────────── */}
        {!isVertical && (
          <>
            {/* Gray base track (ends at Work chip right edge) */}
            <div
              style={{
                position: "absolute",
                top: BEAM_Y,
                left: ICON_INITIAL_X,
                width: (2700 - ICON_INITIAL_X) * beamAppear,
                height: 3,
                background: COLORS.divider,
                transform: "translateY(-50%)",
                zIndex: 8,
                opacity: beamAppear,
              }}
            />
            {/* Feathered halo behind illuminated trail */}
            {trailWidth > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: BEAM_Y,
                  left: ICON_INITIAL_X,
                  width: trailWidth,
                  height: 24,
                  background:
                    "linear-gradient(90deg, transparent, rgba(251,113,133,0.25), rgba(251,146,60,0.3), rgba(251,113,133,0.25), transparent)",
                  filter: "blur(8px)",
                  transform: "translateY(-50%)",
                  zIndex: 9,
                }}
              />
            )}
            {/* Illuminated trail (orange, extends to blob position) */}
            {trailWidth > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: BEAM_Y,
                  left: ICON_INITIAL_X,
                  width: trailWidth,
                  height: 3,
                  background:
                    "linear-gradient(90deg, #FB923C 0%, #FB7185 50%, #FB923C 100%)",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                }}
              />
            )}
            {/* Beam flare — follows blob, hidden during pauses */}
            {blobOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: BEAM_Y,
                  left: blobX,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  background:
                    "radial-gradient(circle, rgba(251,146,60,0.6) 0%, rgba(251,113,133,0.3) 30%, transparent 65%)",
                  opacity: blobOpacity,
                  zIndex: 11,
                }}
              />
            )}
          </>
        )}

        {/* ── VERTICAL track ──────────────────────────────────────────────── */}
        {isVertical && (
          <>
            {/* Gray base track */}
            <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y, width: V_BEAM_STROKE, height: (V_WORLD_H - V_ICON_INITIAL_Y) * beamAppear, background: COLORS.divider, transform: "translateX(-50%)", zIndex: 8, opacity: beamAppear }} />
            {/* Illuminated trail */}
            {trailWidth > 0 && (
              <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y, width: V_BEAM_STROKE, height: trailWidth, background: "linear-gradient(180deg, #FB923C 0%, #FB7185 50%, #FB923C 100%)", transform: "translateX(-50%)", zIndex: 10 }} />
            )}
            {/* Trail halo */}
            {trailWidth > 0 && (
              <div style={{ position: "absolute", left: V_BEAM_X, top: V_ICON_INITIAL_Y, width: 24, height: trailWidth, background: "linear-gradient(180deg, transparent, rgba(251,113,133,0.25), rgba(251,146,60,0.3), rgba(251,113,133,0.25), transparent)", filter: "blur(8px)", transform: "translateX(-50%)", zIndex: 9 }} />
            )}
            {blobOpacity > 0 && (
              <div style={{ position: "absolute", left: V_BEAM_X, top: blobX, width: 120, height: 120, borderRadius: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(251,146,60,0.6) 0%, rgba(251,113,133,0.3) 30%, transparent 65%)", opacity: blobOpacity, zIndex: 11 }} />
            )}
          </>
        )}

        {/* ── Traveling blob ─────────────────────────────────────────────── */}
        {blobOpacity > 0 && blobOpacity > 0 && (
          <>
            {/* Blob halo */}
            <div
              style={{
                position: "absolute",
                left: isVertical ? V_BEAM_X : blobX,
                top: isVertical ? blobX : BEAM_Y,
                width: BLOB_HALO_SIZE * 2,
                height: BLOB_HALO_SIZE * 2,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(251,146,60,0.5) 0%, transparent 70%)",
                filter: "blur(8px)",
                opacity: blobOpacity,
                zIndex: 29,
                pointerEvents: "none",
              }}
            />
            {/* Blob core */}
            <div
              style={{
                position: "absolute",
                left: isVertical ? V_BEAM_X : blobX,
                top: isVertical ? blobX : BEAM_Y,
                width: BLOB_SIZE,
                height: BLOB_SIZE,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, #FB923C 0%, #FB7185 60%, transparent 100%)",
                opacity: blobOpacity,
                zIndex: 30,
                pointerEvents: "none",
              }}
            />
          </>
        )}

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

      {/* ── Angel (screen-space — OUTSIDE world transform) ──────────────── */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: angelCurrentY,
          transform: `translate(-50%, -50%) scale(${angelFinalScale})`,
          opacity: angelCombinedOpacity,
          zIndex: 70,
          pointerEvents: "none",
        }}
      >
        {/* Warm glow halo */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: ANGEL_SIZE * 2.5,
            height: ANGEL_SIZE * 2.5,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.15) 0%, rgba(251,113,133,0.08) 40%, transparent 70%)",
          }}
        />
        <img
          src={staticFile("Avatar.svg")}
          width={ANGEL_SIZE}
          height={ANGEL_SIZE}
          style={{
            position: "relative",
            zIndex: 2,
          }}
        />
      </div>

      {/* ── Full-canvas bloom (f230–f255) — synchronized with Angel fade ── */}
      {frame >= 230 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, #FFD9A8 0%, #FBC089 25%, #FBA3AB 60%, #F8C6D5 100%)",
            opacity: bloomOpacity,
            zIndex: 45,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
