import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

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

// ── Component ─────────────────────────────────────────────────────────────────
export default function TabletScene() {
  const frame = useCurrentFrame();

  // ── Beat 1: Angel pulse + flash (frames 0–60) ──────────────────────────────
  const angelScale = interpolate(frame, [0, 25, 40], [1.0, 1.4, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowScale = interpolate(frame, [0, 25, 40], [1.0, 2.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowOpacity = interpolate(frame, [0, 25, 40], [0.6, 1.0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashOpacity = interpolate(frame, [25, 35, 60], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
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
  const ambientOpacity = interpolate(frame, [27, 65], [0, 1], {
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
  const cursorEnterX = interpolate(frame, [293, 311], [1500, 960], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorEnterY = interpolate(frame, [293, 311], [1000, 540], {
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

      {/* Pulse glow behind angel (Beat 1) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FB7185, #F472B6, transparent)",
          filter: "blur(50px)",
          opacity: glowOpacity,
          transform: `scale(${glowScale})`,
          pointerEvents: "none",
        }}
      />

      {/* Angel icon — only during initial pulse */}
      {frame < 25 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "45%",
            marginLeft: -160,
            marginTop: -160,
            width: 320,
            height: 320,
            opacity: 1,
            transform: `scale(${angelScale})`,
            transformOrigin: "center center",
            zIndex: 10,
          }}
        >
          <img
            src={staticFile("Avatar.svg")}
            style={{ width: 320, height: 320 }}
          />
        </div>
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
                <div style={{ color: "white", fontSize: 18, fontWeight: 600 }}>
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

                {/* Shockwave rings (frames 315–365) */}
                {frame >= 315 && frame <= 365 && (
                  <>
                    {[0, 1, 2].map((ringIdx) => {
                      const ringStart = 315 + ringIdx * 8;
                      if (frame < ringStart) return null;
                      const ringSize = interpolate(
                        frame,
                        [ringStart, ringStart + 40],
                        [40, 200],
                        { extrapolateRight: "clamp" },
                      );
                      const ringOpacity = interpolate(
                        frame,
                        [ringStart, ringStart + 40],
                        [0.9, 0],
                        { extrapolateRight: "clamp" },
                      );
                      return (
                        <div
                          key={ringIdx}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: ringSize,
                            height: ringSize,
                            marginLeft: -ringSize / 2,
                            marginTop: -ringSize / 2,
                            borderRadius: "50%",
                            border: "2px solid rgba(244,114,182,0.9)",
                            opacity: ringOpacity,
                            pointerEvents: "none",
                          }}
                        />
                      );
                    })}
                  </>
                )}

                {/* Burst sparkles — Gemini-style diamonds (frames 315–365) */}
                {frame >= 315 &&
                  frame <= 365 &&
                  [...Array(12)].map((_, p) => {
                    const angle = (p / 12) * Math.PI * 2;
                    const sparkProgress = interpolate(
                      frame,
                      [315, 365],
                      [0, 1],
                      { extrapolateRight: "clamp" },
                    );
                    const dist = sparkProgress * 130;
                    const sparkOpacity = interpolate(
                      sparkProgress,
                      [0, 0.15, 1],
                      [0, 1, 0],
                    );
                    const sparkSize = interpolate(
                      sparkProgress,
                      [0, 0.4, 1],
                      [22, 16, 6],
                    );
                    const rotation = sparkProgress * 360 + p * 30;
                    return (
                      <div
                        key={p}
                        style={{
                          position: "absolute",
                          left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                          top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                          transform: "translate(-50%, -50%)",
                          opacity: sparkOpacity,
                          pointerEvents: "none",
                        }}
                      >
                        <Sparkle
                          size={sparkSize}
                          opacity={1}
                          rotation={rotation}
                          gradientId={`toggleSparkle-${p}`}
                        />
                      </div>
                    );
                  })}
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

      {/* White flash overlay (Beat 1) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 45%, #ffffff, #FFE4EC, #F472B6, transparent)",
          opacity: flashOpacity,
          pointerEvents: "none",
          zIndex: 100,
        }}
      />

      {/* Hero diamond — rises directly from burst (frame 355+) */}
      {frame >= 355 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translateY(${interpolate(frame, [355, 405], [0, -60], { extrapolateRight: "clamp" })}px)`,
            zIndex: 250,
            pointerEvents: "none",
          }}
        >
          <Sparkle
            size={interpolate(frame, [355, 430, 480], [40, 600, 3000], {
              easing: Easing.inOut(Easing.cubic),
              extrapolateRight: "clamp",
            })}
            opacity={interpolate(frame, [355, 370, 465, 475], [0, 1, 1, 0.95], {
              extrapolateRight: "clamp",
            })}
            rotation={interpolate(frame, [355, 475], [0, 360], {
              extrapolateRight: "clamp",
            })}
            gradientId="hero-diamond"
            hero
          />
        </div>
      )}

      {/* Color wash as diamond fills screen (frame 430+) */}
      {frame >= 430 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 50%, #ffffff 0%, #FB923C 30%, #FB7185 60%, #F472B6 100%)",
            opacity: interpolate(frame, [430, 475], [0, 1], {
              extrapolateRight: "clamp",
            }),
            zIndex: 245,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Fade to black (frames 475–510) */}
      {frame >= 475 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [475, 510], [0, 1], {
              extrapolateRight: "clamp",
            }),
            zIndex: 260,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
