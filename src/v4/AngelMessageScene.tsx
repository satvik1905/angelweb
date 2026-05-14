import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
} from "remotion";
import { COLORS, SHADOWS, TYPOGRAPHY } from "./tokens";
import { WarmGlow } from "./components/WarmGlow";

const PNG_W = 1532;
const PNG_H = 3140;

// Phone screen rectangle (matches PhoneScene)
const SCREEN_TOP = 55;
const SCREEN_LEFT = 55;
const SCREEN_RIGHT = 1477;
const SCREEN_BOTTOM = 3085;
const SCREEN_W = SCREEN_RIGHT - SCREEN_LEFT;
const SCREEN_H = SCREEN_BOTTOM - SCREEN_TOP;
const SCREEN_RADIUS = 155;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ── Typing dot bounce ──────────────────────────────────────────────────────
const TYPING_PERIOD = 18;
function getDotOffset(dotIndex: number, frame: number, startFrame: number) {
  const dotPhaseOffset = dotIndex * 4;
  const localFrame =
    (((frame - startFrame + dotPhaseOffset) % TYPING_PERIOD) + TYPING_PERIOD) %
    TYPING_PERIOD;
  const phase = localFrame / TYPING_PERIOD;
  const wave = Math.sin(phase * Math.PI * 2);
  return -8 * Math.max(0, wave);
}

// ── Chat content area ──────────────────────────────────────────────────────
const CHAT_LEFT = 120;
const CHAT_RIGHT = 1412;
const CHAT_CENTER_X = (CHAT_LEFT + CHAT_RIGHT) / 2; // 766

// Message dimensions (native PNG sizes)
const MSG1_W = 1304;
const MSG1_H = 592;
const MSG2_W = 1304;

// Bottom-up positioning: typing/messages appear just above input bar area
const BOTTOM_ANCHOR_Y = 3000; // bottom edge of messages (~85px margin from SCREEN_BOTTOM)
const MSG_GAP = 50; // gap between messages

// Msg 1 initial position (where it lands after typing #1)
const MSG1_LAND_Y = BOTTOM_ANCHOR_Y;
// Msg 1 shift up amount (its own height + gap, to make room for Msg 2)
const MSG1_SHIFT_FOR_MSG2 = -472; // shift up so 72px gap between Msg 1 bottom and Msg 2 top
// Msg 2 lands at the bottom anchor (where Msg 1 was)
const MSG2_LAND_Y = BOTTOM_ANCHOR_Y;

// After both messages are in, shift everything up for options
const BOTH_SHIFT_FOR_OPTIONS = -800;

// Options appear at the bottom anchor after both messages shift up
const OPTIONS_W = 1240;
const PILL_HEIGHT = 180;
const PILL_GAP = 30;
const OPTIONS_LAND_Y = BOTTOM_ANCHOR_Y;

// Tap target on Goa pill (centered horizontally, vertically in first pill)
const PILLS_ACTUAL_Y = 1892; // hardcoded actual pill position after shifts
const TAP_X = CHAT_CENTER_X;
const TAP_Y = PILLS_ACTUAL_Y + PILL_HEIGHT / 2; // 2082

// User reply
// User reply — right-aligned, positioned below Msg 2 after shifts
// Msg 2 bottom after shifts: 2220 - 800 + 400 = 1820, + 30px gap = 1850
const USER_MSG_RIGHT_X = 1412;
const USER_MSG_TOP_Y = 1850;
const USER_MSG_W = 1304;

// ── Option pill data ───────────────────────────────────────────────────────
const OPTIONS = [
  {
    label: "Monterey, CA",
    detail: "6 of 12 members are aligned",
    bg: "#D1FAE5",
    accent: "#34D399",
    dotColor: "#22C55E",
    fillPct: 67,
  },
  {
    label: "San Francisco, CA",
    detail: "3 of 12 members are aligned",
    bg: "#FEF3C7",
    accent: "#FBBF24",
    dotColor: "#EAB308",
    fillPct: 45,
  },
  {
    label: "San Diego, CA",
    detail: "1 of 12 members are aligned",
    bg: "#FEE2E2",
    accent: "#F87171",
    dotColor: "#EF4444",
    fillPct: 12,
  },
];

export const AngelMessageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isHorizontal = width === 1920 && height === 1080;

  // Phone base scale
  const phoneScale = (height * 0.75) / PNG_H;
  const phoneW = PNG_W * phoneScale;
  const phoneH = PNG_H * phoneScale;
  const s = phoneScale;

  // ── Camera fade-in (f0–f9) ───────────────────────────────────────────────
  const fadeIn = interpolate(frame, [0, 9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Subtle camera zoom (centered, no Y shift) ───────────────────────────
  const MAX_ZOOM = isHorizontal ? 1.3 : 1.05;
  const zoomIn = interpolate(frame, [9, 30], [1.0, MAX_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const zoomOut = interpolate(frame, [245, 275], [MAX_ZOOM, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const zoomScale = frame < 245 ? zoomIn : zoomOut;

  // ── Typing #1 (f30–f65) — at bottom anchor ──────────────────────────────
  const typing1Opacity = (() => {
    if (frame < 30) return 0;
    if (frame <= 35)
      return interpolate(frame, [30, 35], [0, 1], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 55) return 1;
    return interpolate(frame, [55, 65], [1, 0], {
      easing: Easing.out(Easing.cubic),
      ...CL,
    });
  })();
  const typing1Scale = interpolate(frame, [30, 35], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Msg 1 fade+slide in (f65–f80) at bottom anchor ──────────────────────
  const msg1Opacity = interpolate(frame, [65, 80], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const msg1SlideY = interpolate(frame, [65, 80], [20, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Msg 1 shifts up for Msg 2 (f110–f130) ───────────────────────────────
  const msg1ShiftForMsg2 = interpolate(
    frame,
    [130, 145],
    [0, MSG1_SHIFT_FOR_MSG2],
    {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    },
  );

  // ── Typing #2 (f110–f140) — at bottom anchor ───────────────────────────
  const typing2Opacity = (() => {
    if (frame < 110) return 0;
    if (frame <= 115)
      return interpolate(frame, [110, 115], [0, 1], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 130) return 1;
    return interpolate(frame, [130, 140], [1, 0], {
      easing: Easing.out(Easing.cubic),
      ...CL,
    });
  })();
  const typing2Scale = interpolate(frame, [110, 115], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Msg 2 fade+slide in (f140–f155) at bottom anchor ────────────────────
  const msg2Opacity = interpolate(frame, [140, 155], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const msg2SlideY = interpolate(frame, [140, 155], [20, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Both messages shift up for options (f185–f210) ──────────────────────
  const bothShiftForOptions = interpolate(
    frame,
    [185, 210],
    [0, BOTH_SHIFT_FOR_OPTIONS],
    {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    },
  );

  // ── Options fade in (f185–f210) ──────────────────────────────────────────
  const optionsOpacity = interpolate(frame, [195, 210], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const optionsSlideY = interpolate(frame, [195, 210], [15, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Tap on Goa (f225–f245) ───────────────────────────────────────────────
  const tapAppear = interpolate(frame, [225, 228], [0, 0.7], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const tapPress = interpolate(frame, [228, 230, 233], [1, 0.85, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const tapFade = interpolate(frame, [233, 245], [0.7, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const tapCircleOpacity = frame < 233 ? tapAppear : tapFade;
  const tapCircleScale = frame < 228 ? 1 : tapPress;

  const rippleActive = frame >= 233 && frame <= 245;
  const rippleSize = interpolate(frame, [233, 245], [50, 220], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const rippleOpacity = interpolate(frame, [233, 245], [0.6, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Goa pill highlight on tap
  // Goa pill border color on tap: #D4D4D8 → #10B981
  const goaBorderT = interpolate(frame, [228, 235], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Options disappear (f245–f248) ────────────────────────────────────────
  const optionsFadeOut = interpolate(frame, [245, 248], [1, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const optionsFinalOpacity = frame < 245 ? optionsOpacity : optionsFadeOut;

  // ── User reply fade+slide in (f245–f265) ─────────────────────────────────
  const userReplyOpacity = interpolate(frame, [248, 260], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Typing #3 (f270+) — after user reply ─────────────────────────────────
  const typing3Opacity = interpolate(frame, [270, 280], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const typing3Scale = interpolate(frame, [270, 275], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Fade-to-white exit (f275–f305) ───────────────────────────────────────
  const exitOpacity = interpolate(frame, [275, 305], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <WarmGlow />

      {/* Phone container */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2,
          width: phoneW,
          height: phoneH,
          transform: `translate(-50%, -50%) scale(${zoomScale})`,
          boxShadow: SHADOWS.phone,
          borderRadius: 220 * s,
          overflow: "hidden",
          opacity: fadeIn,
        }}
      >
        {/* Screen clipping area */}
        <div
          style={{
            position: "absolute",
            left: SCREEN_LEFT * s,
            top: SCREEN_TOP * s,
            width: SCREEN_W * s,
            height: SCREEN_H * s,
            borderRadius: SCREEN_RADIUS * s,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          {/* ── Typing #1 (f30–f65) — at bottom anchor ───────────────── */}
          {frame >= 30 && frame <= 65 && (
            <div
              style={{
                position: "absolute",
                left: (114 - SCREEN_LEFT) * s,
                top: (BOTTOM_ANCHOR_Y - 495 - SCREEN_TOP) * s,
                width: 110 * s,
                height: 65 * s,
                borderRadius: 32 * s,
                background:
                  "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
                opacity: typing1Opacity,
                transform: `scale(${typing1Scale})`,
                transformOrigin: "bottom left",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12 * s,
              }}
            >
              {[0, 1, 2].map((dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    width: 11 * s,
                    height: 11 * s,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.85)",
                    transform: `translateY(${getDotOffset(dotIdx, frame, 30) * s}px)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Msg 1: angel-message.png (f65+) ─────────────────────────── */}
          {frame >= 65 && (
            <Img
              src={staticFile("bubbles/angel-message.png")}
              style={{
                position: "absolute",
                left: (CHAT_CENTER_X - MSG1_W / 2 - SCREEN_LEFT) * s,
                top: (BOTTOM_ANCHOR_Y - 972 - SCREEN_TOP) * s,
                width: MSG1_W * s,
                height: "auto",
                opacity: msg1Opacity,
                transform: `translateY(${(msg1SlideY + msg1ShiftForMsg2 + bothShiftForOptions) * s}px)`,
              }}
            />
          )}

          {/* ── Typing #2 (f110–f140) — at bottom anchor ────────────────── */}
          {frame >= 110 && frame <= 140 && (
            <div
              style={{
                position: "absolute",
                left: (114 - SCREEN_LEFT) * s,
                top: (BOTTOM_ANCHOR_Y - 395 - SCREEN_TOP) * s,
                width: 110 * s,
                height: 65 * s,
                borderRadius: 32 * s,
                background:
                  "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
                opacity: typing2Opacity,
                transform: `scale(${typing2Scale})`,
                transformOrigin: "bottom left",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12 * s,
              }}
            >
              {[0, 1, 2].map((dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    width: 11 * s,
                    height: 11 * s,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.85)",
                    transform: `translateY(${getDotOffset(dotIdx, frame, 110) * s}px)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Msg 2: angel-message1.png (f140+) ────────────────────────── */}
          {frame >= 140 && (
            <Img
              src={staticFile("bubbles/angel-message1.png")}
              style={{
                position: "absolute",
                left: (CHAT_CENTER_X - MSG2_W / 2 - SCREEN_LEFT) * s,
                top: (BOTTOM_ANCHOR_Y - 780 - SCREEN_TOP) * s,
                width: MSG2_W * s,
                height: "auto",
                opacity: msg2Opacity,
                transform: `translateY(${(msg2SlideY + bothShiftForOptions) * s}px)`,
              }}
            />
          )}

          {/* ── Option pills (f195–f248) ─────────────────────────────────── */}
          {frame >= 195 && optionsFinalOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                left: (CHAT_CENTER_X - MSG2_W / 2 + 118 - SCREEN_LEFT) * s,
                top: (1892 - SCREEN_TOP) * s,
                width: (OPTIONS_W - 118) * s,
                opacity: optionsFinalOpacity,
                transform: `translateY(${optionsSlideY * s}px)`,
                display: "flex",
                flexDirection: "column" as const,
                gap: PILL_GAP * s,
              }}
            >
              {OPTIONS.map((opt, i) => {
                const isGoa = i === 0;
                const borderColor = isGoa
                  ? interpolateColor("#D4D4D8", "#10B981", goaBorderT)
                  : "#D4D4D8";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: PILL_HEIGHT * s,
                      borderRadius: 24 * s,
                      background: `linear-gradient(to right, ${opt.bg} ${opt.fillPct}%, #FFFFFF ${opt.fillPct}%)`,
                      border: `${1 * s}px solid ${borderColor}`,
                      overflow: "hidden",
                    }}
                  >
                    {/* Content */}
                    <div
                      style={{
                        flex: 1,
                        padding: `0px ${28 * s}px`,
                        display: "flex",
                        flexDirection: "column" as const,
                        justifyContent: "center",
                        gap: 8 * s,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 50 * s,
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          fontFamily: TYPOGRAPHY.fontFamily,
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8 * s,
                        }}
                      >
                        <div
                          style={{
                            width: 15 * s,
                            height: 15 * s,
                            borderRadius: "50%",
                            backgroundColor: opt.dotColor,
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 36 * s,
                            color: COLORS.textSecondary,
                            fontFamily: TYPOGRAPHY.fontFamily,
                          }}
                        >
                          {opt.detail}
                        </div>
                      </div>
                    </div>
                    {/* Chevron */}
                    <Img
                      src={staticFile("icons/chevron.svg")}
                      style={{
                        width: 56 * s,
                        height: 56 * s,
                        marginRight: 24 * s,
                        flexShrink: 0,
                      }}
                    />
                  </div>
                );
              })}

              {/* "or type your own" divider — hybrid: code lines + text PNG */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 24 * s,
                marginTop: 32 * s,
                width: "100%",
              }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "#D4D4D8" }} />
                <img
                  src={staticFile("bubbles/type-own.png")}
                  style={{
                    width: 505 * s,
                    height: 45 * s,
                  }}
                />
                <div style={{ flex: 1, height: 1, backgroundColor: "#D4D4D8" }} />
              </div>
            </div>
          )}

          {/* ── Tap indicator on Goa pill (f225–f245) ────────────────────── */}
          {frame >= 225 && frame <= 245 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: (TAP_X - SCREEN_LEFT) * s,
                  top: (TAP_Y - SCREEN_TOP) * s,
                  width: 50 * s,
                  height: 50 * s,
                  transform: `translate(-50%, -50%) scale(${tapCircleScale})`,
                  borderRadius: "50%",
                  backgroundColor: "#1C1C1E",
                  opacity: tapCircleOpacity,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
              {rippleActive && (
                <div
                  style={{
                    position: "absolute",
                    left: (TAP_X - SCREEN_LEFT) * s,
                    top: (TAP_Y - SCREEN_TOP) * s,
                    width: rippleSize * s,
                    height: rippleSize * s,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    border: `${3 * s}px solid rgba(34, 197, 94, ${rippleOpacity})`,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              )}
            </>
          )}

          {/* ── User reply: user-message.png (f245+) ─────────────────────── */}
          {frame >= 245 && (
            <Img
              src={staticFile("bubbles/user-message.png")}
              style={{
                position: "absolute",
                right: (SCREEN_RIGHT - USER_MSG_RIGHT_X) * s,
                top: (USER_MSG_TOP_Y - SCREEN_TOP) * s,
                width: USER_MSG_W * s,
                height: "auto",
                opacity: userReplyOpacity,
              }}
            />
          )}

          {/* ── Typing #3 (f270+) — after user reply ────────────────────── */}
          {frame >= 270 && (
            <div
              style={{
                position: "absolute",
                left: (114 - SCREEN_LEFT) * s,
                top: (2120 - SCREEN_TOP) * s,
                width: 110 * s,
                height: 65 * s,
                borderRadius: 32 * s,
                background:
                  "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
                opacity: typing3Opacity,
                transform: `scale(${typing3Scale})`,
                transformOrigin: "bottom left",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12 * s,
              }}
            >
              {[0, 1, 2].map((dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    width: 11 * s,
                    height: 11 * s,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.85)",
                    transform: `translateY(${getDotOffset(dotIdx, frame, 270) * s}px)`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Phone bezel image */}
        <Img
          src={staticFile("Angel_Chat.png")}
          style={{
            width: phoneW,
            height: phoneH,
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 250 * s,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Fade-to-white exit overlay (f275–f305) */}
      {frame >= 275 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.background,
            opacity: exitOpacity,
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Simple linear color interpolation between two hex colors
function interpolateColor(from: string, to: string, t: number): string {
  const f = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const r = Math.round(f.r + (toRgb.r - f.r) * t);
  const g = Math.round(f.g + (toRgb.g - f.g) * t);
  const b = Math.round(f.b + (toRgb.b - f.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
