import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";

// ── Messages ──────────────────────────────────────────────────────────────────
const MESSAGES = [
  {
    text: "I can't do $300 per night for the hotels 😭",
    author: "Maya",
    startFrame: 80,
  },
  { text: "Dates don't work for me either", author: "Jay", startFrame: 128 },
  { text: "I'm out, sorry guys", author: "Sam", startFrame: 173 },
  { text: "what do we do now??", author: "Maya", startFrame: 218 },
];

// ── Camera system ─────────────────────────────────────────────────────────────
type CamFrame = { frame: number; x: number; y: number; zoom: number };

const MSG1_OFFSET = { x: -260, y: -110 };
const MSG2_OFFSET = { x: -270, y: 0 };
const MSG3_OFFSET = { x: -260, y: 110 };
const MSG4_OFFSET = { x: -250, y: 210 };
const TOGGLE_OFFSET = { x: 450, y: -325 };

const CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 67, x: 0, y: 0, zoom: 1.0 },
  { frame: 90, x: -MSG1_OFFSET.x * 2.0, y: -MSG1_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 120, x: -MSG1_OFFSET.x * 2.0, y: -MSG1_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 138, x: -MSG2_OFFSET.x * 2.0, y: -MSG2_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 165, x: -MSG2_OFFSET.x * 2.0, y: -MSG2_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 183, x: -MSG3_OFFSET.x * 2.0, y: -MSG3_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 210, x: -MSG3_OFFSET.x * 2.0, y: -MSG3_OFFSET.y * 2.0, zoom: 2.4 },
  // Beat: Maya's 4th message — "what do we do now??"
  { frame: 228, x: -MSG4_OFFSET.x * 2.0, y: -MSG4_OFFSET.y * 2.0, zoom: 2.4 },
  { frame: 258, x: -MSG4_OFFSET.x * 2.0, y: -MSG4_OFFSET.y * 2.0, zoom: 2.4 },
  // Pull back to wide
  { frame: 276, x: 0, y: 0, zoom: 1.05 },
  // Dramatic dolly to toggle
  {
    frame: 306,
    x: -TOGGLE_OFFSET.x * 2.6,
    y: -TOGGLE_OFFSET.y * 2.6,
    zoom: 3.2,
  },
  {
    frame: 348,
    x: -TOGGLE_OFFSET.x * 2.6,
    y: -TOGGLE_OFFSET.y * 2.6,
    zoom: 3.2,
  },
  // Pull back to wide
  { frame: 388, x: 0, y: 0, zoom: 1.0 },
];

function getCameraAt(frame: number): { x: number; y: number; zoom: number } {
  if (frame < CAMERA_KEYFRAMES[0].frame) {
    return { x: 0, y: 0, zoom: 1.0 };
  }
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    const a = CAMERA_KEYFRAMES[i];
    const b = CAMERA_KEYFRAMES[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const p = (frame - a.frame) / (b.frame - a.frame);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        zoom: a.zoom + (b.zoom - a.zoom) * eased,
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom };
}

function getMessageHighlight(messageIndex: number, frame: number): number {
  const focusRanges: Record<number, [number, number]> = {
    0: [90, 120], // Maya — "I can't do $300"
    1: [138, 165], // Jay  — "Dates don't work"
    2: [183, 210], // Sam  — "I'm out"
    3: [228, 258], // Maya — "what do we do now??"
  };
  const range = focusRanges[messageIndex];
  if (!range) return 0.85;
  if (frame >= range[0] - 10 && frame <= range[1] + 10) return 1;
  return 0.6;
}

// ── Tap indicator ─────────────────────────────────────────────────────────────
const TapIndicator = ({ tapping }: { tapping: number }) => (
  <div
    style={{
      width: 60,
      height: 60,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.25)",
      border: "2px solid rgba(255,255,255,0.85)",
      boxShadow:
        "0 0 20px rgba(255,255,255,0.4), inset 0 0 12px rgba(255,255,255,0.2)",
      backdropFilter: "blur(4px)",
      transform: `scale(${tapping})`,
      transformOrigin: "center center",
      pointerEvents: "none",
    }}
  />
);

// ── Sparkle ───────────────────────────────────────────────────────────────────
const Sparkle = ({
  size,
  opacity,
  rotation,
  gradientId,
  hero = false,
}: {
  size: number;
  opacity: number;
  rotation: number;
  gradientId: string;
  hero?: boolean;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform: `rotate(${rotation}deg)`,
      opacity,
      filter: hero
        ? "drop-shadow(0 0 80px rgba(244,114,182,0.95)) drop-shadow(0 0 200px rgba(251,113,133,0.7))"
        : "drop-shadow(0 0 6px rgba(244,114,182,0.8))",
    }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#FB923C" />
        <stop offset="70%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#F472B6" />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
      fill={`url(#${gradientId})`}
    />
  </svg>
);

// ── Scatter diamonds ──────────────────────────────────────────────────────────
// Toggle appears at screen center when camera is fully zoomed in (frames 306–348)
const TOGGLE_CENTER_X = 960;
const TOGGLE_CENTER_Y = 540;

// All sparkles erupt at frame 315 — the exact moment the toggle is clicked
// Camera is zoom=3.2 at frame 315, toggle at screen center (960, 540)
const SCATTER_DIAMONDS = [
  {
    offsetX: -160,
    offsetY: -70,
    size: 32,
    birthFrame: 315,
    phase: 0,
    rotationDrift: 0.5,
    isHero: false,
  },
  {
    offsetX: -50,
    offsetY: -90,
    size: 36,
    birthFrame: 315,
    phase: 1.2,
    rotationDrift: -0.4,
    isHero: false,
  },
  {
    offsetX: 70,
    offsetY: -85,
    size: 28,
    birthFrame: 316,
    phase: 2.4,
    rotationDrift: 0.6,
    isHero: false,
  },
  {
    offsetX: 180,
    offsetY: -60,
    size: 40,
    birthFrame: 316,
    phase: 3.6,
    rotationDrift: -0.5,
    isHero: true,
  },
  {
    offsetX: 220,
    offsetY: 10,
    size: 30,
    birthFrame: 316,
    phase: 4.8,
    rotationDrift: 0.4,
    isHero: false,
  },
  {
    offsetX: 150,
    offsetY: 80,
    size: 34,
    birthFrame: 317,
    phase: 0.9,
    rotationDrift: -0.6,
    isHero: false,
  },
  {
    offsetX: 30,
    offsetY: 95,
    size: 26,
    birthFrame: 317,
    phase: 2.1,
    rotationDrift: 0.5,
    isHero: false,
  },
  {
    offsetX: -90,
    offsetY: 90,
    size: 32,
    birthFrame: 317,
    phase: 3.3,
    rotationDrift: -0.4,
    isHero: false,
  },
  {
    offsetX: -180,
    offsetY: 70,
    size: 28,
    birthFrame: 318,
    phase: 4.5,
    rotationDrift: 0.6,
    isHero: false,
  },
  {
    offsetX: -230,
    offsetY: 0,
    size: 34,
    birthFrame: 318,
    phase: 5.7,
    rotationDrift: -0.5,
    isHero: false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function TabletScene() {
  const frame = useCurrentFrame();

  // ── Beat 1: White flash recedes (frames 0–35) — bridges from IntroScene ──
  const openingFlashOpacity = interpolate(frame, [0, 35], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Beat 2: Tablet emerges (frames 37–65) ────────────────────────────────
  const tabletScale = interpolate(frame, [37, 65], [0.4, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tabletOpacity = interpolate(frame, [37, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ambientOpacity = interpolate(frame, [25, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Camera ─────────────────────────────────────────────────────────────────
  const cam = getCameraAt(frame);
  const prevCam = getCameraAt(Math.max(0, frame - 1));
  const camSpeed =
    Math.sqrt(Math.pow(cam.x - prevCam.x, 2) + Math.pow(cam.y - prevCam.y, 2)) +
    Math.abs(cam.zoom - prevCam.zoom) * 60;
  const camBlur = Math.min(camSpeed / 8, 5);

  // ── Beat 5: Tap indicator (frames 288–345) ───────────────────────────────
  // Toggle is at screen center (960, 540) when camera is fully zoomed in
  const cursorEnterX = interpolate(frame, [293, 311], [1500, 980], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorEnterY = interpolate(frame, [293, 311], [1000, 550], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorEnterOpacity = interpolate(frame, [288, 296], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorExitOpacity = interpolate(frame, [330, 345], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalCursorOpacity = Math.min(cursorEnterOpacity, cursorExitOpacity);

  // Tap animation — shrink on press, spring back out
  const tapScale = (() => {
    if (frame < 311) return 1;
    if (frame <= 315)
      return interpolate(frame, [311, 315], [1, 0.4], {
        extrapolateRight: "clamp",
      });
    if (frame <= 323)
      return interpolate(frame, [315, 323], [0.4, 1.6], {
        extrapolateRight: "clamp",
      });
    if (frame <= 330)
      return interpolate(frame, [323, 330], [1.6, 1.0], {
        extrapolateRight: "clamp",
      });
    return 1;
  })();

  // ── Beat 6: Toggle activation (frames 305–365) ───────────────────────────
  const isToggleActive = frame >= 315;

  const togglePrePulse = interpolate(frame, [305, 310, 315], [1, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const thumbX = interpolate(frame, [315, 327], [2, 18], {
    easing: Easing.out(Easing.back(2.0)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gradientOpacity = interpolate(frame, [315, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const togglePunch = interpolate(frame, [315, 320, 335], [1, 1.15, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalToggleScale = frame < 315 ? togglePrePulse : togglePunch;
  const labelColor =
    frame >= 327 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)";

  // ── Burst shake at eruption moment (frames 313–323) ─────────────────────
  const burstShake = interpolate(frame, [313, 316, 323], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const burstShakeX = Math.sin(frame * 3.5) * 4 * burstShake;
  const burstShakeY = Math.cos(frame * 4.2) * 3 * burstShake;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${burstShakeX}px, ${burstShakeY}px)`,
        }}
      >
        {/* Ambient room glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 90%, rgba(244,114,182,0.15), transparent 60%)",
            opacity: ambientOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Opening white flash overlay — recedes over first 35 frames */}
        {frame <= 35 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, #ffffff 0%, #FFE4EC 30%, #F8B4D9 70%, #F472B6 100%)",
              opacity: openingFlashOpacity,
              zIndex: 100,
              pointerEvents: "none",
            }}
          />
        )}

        {/* ── Camera wrapper ── */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformOrigin: "center center",
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
            filter: camBlur > 0.5 ? `blur(${camBlur}px)` : "none",
            zIndex: 5,
          }}
        >
          {/* Tablet frame */}
          <div
            style={{
              width: 900,
              height: 640,
              borderRadius: 36,
              padding: 14,
              background: "linear-gradient(135deg, #2a2a2e, #1a1a1e, #2a2a2e)",
              boxShadow:
                "0 60px 120px rgba(0,0,0,0.7), 0 0 80px rgba(244,114,182,0.15), inset 0 1px 1px rgba(255,255,255,0.1)",
              transform: `scale(${tabletScale})`,
              opacity: tabletOpacity,
              transformOrigin: "center center",
            }}
          >
            {/* Inner screen */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                background: "#0a0a0c",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top bar */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <div>
                  <div
                    style={{ color: "white", fontSize: 18, fontWeight: 600 }}
                  >
                    Bali Trip 🌴
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    5 members
                  </div>
                </div>

                {/* Angel Mode toggle row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 14px",
                    borderRadius: 20,
                    background: isToggleActive
                      ? "rgba(251,146,60,0.12)"
                      : "rgba(255,255,255,0.05)",
                    border: isToggleActive
                      ? "1px solid rgba(244,114,182,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                    position: "relative",
                  }}
                >
                  {/* Glow behind toggle row on activation */}
                  {frame >= 315 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: 28,
                        background:
                          "radial-gradient(ellipse at 50% 50%, rgba(244,114,182,0.5), transparent 70%)",
                        filter: "blur(20px)",
                        opacity: interpolate(
                          frame,
                          [315, 335, 375],
                          [0, 1, 0.6],
                          { extrapolateRight: "clamp" },
                        ),
                        pointerEvents: "none",
                        zIndex: -1,
                      }}
                    />
                  )}

                  <span
                    style={{ color: labelColor, fontSize: 13, fontWeight: 500 }}
                  >
                    Angel Mode
                  </span>

                  {/* Toggle pill */}
                  <div
                    style={{
                      width: 38,
                      height: 22,
                      borderRadius: 12,
                      position: "relative",
                      background: "rgba(255,255,255,0.18)",
                      overflow: "hidden",
                      transform: `scale(${finalToggleScale})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
                        opacity: gradientOpacity,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: thumbX,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "white",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chat bubbles area */}
              <div
                style={{
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  flex: 1,
                }}
              >
                {MESSAGES.map((msg, i) => {
                  const msgOpacity = interpolate(
                    frame,
                    [msg.startFrame, msg.startFrame + 18],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  const msgY = interpolate(
                    frame,
                    [msg.startFrame, msg.startFrame + 18],
                    [20, 0],
                    {
                      easing: Easing.out(Easing.cubic),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  );
                  const highlight = getMessageHighlight(i, frame);
                  return (
                    <div
                      key={i}
                      style={{
                        opacity: msgOpacity * highlight,
                        transform: `translateY(${msgY}px)`,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 12,
                          marginLeft: 14,
                          marginBottom: 4,
                          fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                        }}
                      >
                        {msg.author}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "12px 18px",
                          borderRadius: 22,
                          backgroundImage: `
                        linear-gradient(rgba(20,20,24,0.7), rgba(20,20,24,0.7)),
                        linear-gradient(135deg, rgba(255,255,255,0.4), rgba(244,114,182,0.25), rgba(255,255,255,0.15))
                      `,
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box, border-box",
                          border: "1px solid transparent",
                          color: "rgba(255,255,255,0.92)",
                          fontSize: 15,
                          fontWeight: 400,
                          lineHeight: 1.4,
                          maxWidth: "70%",
                          boxShadow:
                            highlight === 1
                              ? "0 4px 24px rgba(244,114,182,0.3), inset 0 1px 0 rgba(255,255,255,0.12)"
                              : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                          fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* end camera wrapper */}

        {/* Burst flash at toggle center — blooms at the moment of click */}
        {frame >= 313 && frame <= 323 && (
          <div
            style={{
              position: "absolute",
              left: TOGGLE_CENTER_X,
              top: TOGGLE_CENTER_Y,
              transform: "translate(-50%, -50%)",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(244,114,182,0.7) 30%, rgba(251,113,133,0.4) 60%, transparent 100%)",
              filter: "blur(15px)",
              opacity: interpolate(frame, [313, 316, 323], [0, 1, 0], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              zIndex: 4,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Scatter diamonds — screen space, erupt from toggle center */}
        {SCATTER_DIAMONDS.map((d, i) => {
          if (frame < d.birthFrame) return null;

          // Sparkles fly outward from toggle center to their final offset
          const eruptionProgress = interpolate(
            frame,
            [d.birthFrame, d.birthFrame + 10],
            [0, 1],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const eruptedX = d.offsetX * eruptionProgress;
          const eruptedY = d.offsetY * eruptionProgress;

          // Pop-in with slight overshoot
          const burstScale = interpolate(
            frame,
            [d.birthFrame, d.birthFrame + 6, d.birthFrame + 12],
            [0, 1.3, 1.0],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const enterOpacity = interpolate(
            frame,
            [d.birthFrame, d.birthFrame + 8],
            [0, 1],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const twinkle = Math.sin(frame / 14 + d.phase);
          const twinkleOpacity = 0.6 + (twinkle + 1) * 0.2;
          const sizeScale = 0.85 + (twinkle + 1) * 0.15;

          const driftX = Math.sin(frame / 28 + d.phase) * 4;
          const driftY = Math.cos(frame / 32 + d.phase) * 4;

          const rotation = (frame * d.rotationDrift) % 360;

          // Fade out before camera pulls back at frame 348
          const exitFade = interpolate(frame, [330, 346], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const heroSize = d.isHero
            ? interpolate(
                frame,
                [345, 385, 415],
                [d.size * burstScale, 600, 4500],
                {
                  easing: Easing.inOut(Easing.cubic),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )
            : d.size * sizeScale * burstScale;

          const heroX = d.isHero
            ? interpolate(
                frame,
                [345, 370],
                [TOGGLE_CENTER_X + eruptedX + driftX, 960],
                {
                  easing: Easing.in(Easing.cubic),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )
            : TOGGLE_CENTER_X + eruptedX + driftX;

          const heroY = d.isHero
            ? interpolate(
                frame,
                [345, 370],
                [TOGGLE_CENTER_Y + eruptedY + driftY, 540],
                {
                  easing: Easing.in(Easing.cubic),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )
            : TOGGLE_CENTER_Y + eruptedY + driftY;

          const finalOpacity = d.isHero
            ? interpolate(
                frame,
                [345, 358, 410, 420],
                [twinkleOpacity, 1, 1, 0.85],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )
            : enterOpacity * twinkleOpacity * exitFade;

          const finalRotation = d.isHero
            ? interpolate(frame, [345, 420], [rotation, rotation + 720], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : rotation;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: heroX,
                top: heroY,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: d.isHero && frame >= 345 ? 250 : 5,
              }}
            >
              <Sparkle
                size={heroSize}
                opacity={finalOpacity}
                rotation={finalRotation}
                gradientId={`scatter-diamond-${i}`}
                hero={d.isHero && frame >= 345}
              />
            </div>
          );
        })}

        {/* Tap indicator — screen space, centered on toggle */}
        {frame >= 288 && frame <= 345 && (
          <div
            style={{
              position: "absolute",
              left: cursorEnterX,
              top: cursorEnterY,
              transform: "translate(-50%, -50%)",
              opacity: finalCursorOpacity,
              zIndex: 200,
              pointerEvents: "none",
            }}
          >
            <TapIndicator tapping={tapScale} />
          </div>
        )}

        {/* Color wash as diamond fills screen (frame 380+) */}
        {frame >= 380 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, #ffffff 0%, #FB923C 30%, #FB7185 60%, #F472B6 100%)",
              opacity: interpolate(frame, [380, 415], [0, 1], {
                extrapolateRight: "clamp",
              }),
              zIndex: 245,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Fade to black (frames 415–440) */}
        {frame >= 415 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
              opacity: interpolate(frame, [415, 440], [0, 1], {
                extrapolateRight: "clamp",
              }),
              zIndex: 260,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      {/* end burst shake wrapper */}
    </AbsoluteFill>
  );
}
