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

// Typing indicator + message position in source pixels
const CONTENT_X = 140;
const CONTENT_Y = 2080;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Typing dot bounce
const TYPING_PERIOD = 18;
function getDotOffset(dotIndex: number, frame: number) {
  const dotPhaseOffset = dotIndex * 4;
  const localFrame =
    (((frame - 30 + dotPhaseOffset) % TYPING_PERIOD) + TYPING_PERIOD) %
    TYPING_PERIOD;
  const phase = localFrame / TYPING_PERIOD;
  const wave = Math.sin(phase * Math.PI * 2);
  return -8 * Math.max(0, wave);
}

// ── Typewriter ──────────────────────────────────────────────────────────────
const MESSAGE = `Hey Maya 👋\n\nQuick update — I know your preference was $300, but everyone else can comfortably do $350. Would $350/night work for you? If not, we can keep negotiating — let me know what feels right.`;

const TYPEWRITER_START = 50;
const TYPEWRITER_END = 150;
const TOTAL_CHARS = MESSAGE.length;
const LINE_BREAK_INDEX = MESSAGE.indexOf("\n\n");
const PAUSE_FRAMES = 8;

function getVisibleCharCount(frame: number): number {
  if (frame < TYPEWRITER_START) return 0;
  if (frame >= TYPEWRITER_END) return TOTAL_CHARS;

  const typingBudget = TYPEWRITER_END - TYPEWRITER_START - PAUSE_FRAMES;
  const lineBreakProgress = LINE_BREAK_INDEX / TOTAL_CHARS;
  const lineBreakFrame =
    TYPEWRITER_START + Math.round(lineBreakProgress * typingBudget);
  const pauseEndFrame = lineBreakFrame + PAUSE_FRAMES;

  if (frame <= lineBreakFrame) {
    const progress =
      (frame - TYPEWRITER_START) / (lineBreakFrame - TYPEWRITER_START);
    return Math.floor(LINE_BREAK_INDEX * progress);
  } else if (frame <= pauseEndFrame) {
    return LINE_BREAK_INDEX;
  } else {
    const progress = (frame - pauseEndFrame) / (TYPEWRITER_END - pauseEndFrame);
    return (
      LINE_BREAK_INDEX + Math.floor((TOTAL_CHARS - LINE_BREAK_INDEX) * progress)
    );
  }
}

export const AngelMessageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isHorizontal = width === 1920 && height === 1080;

  // Phone base scale
  const phoneScale = (height * 0.75) / PNG_H;
  const phoneW = PNG_W * phoneScale;
  const phoneH = PNG_H * phoneScale;

  // Fade-in (f0–f9)
  const fadeIn = interpolate(frame, [0, 9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Camera zoom to message area (f9–f30)
  const TARGET_SOURCE_Y = isHorizontal ? 2200 : 1800;
  const targetLocalY = (TARGET_SOURCE_Y / PNG_H) * phoneH - phoneH / 2;

  const MAX_ZOOM = isHorizontal ? 1.6 : 1.2;

  const zoomIn = interpolate(frame, [9, 30], [1.0, MAX_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const shiftIn = interpolate(frame, [9, 30], [0, -targetLocalY * MAX_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Zoom-out beat (f245–f275)
  const zoomOut = interpolate(frame, [245, 275], [MAX_ZOOM, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const shiftOut = interpolate(
    frame,
    [245, 275],
    [-targetLocalY * MAX_ZOOM, 0],
    {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    },
  );

  // Combined camera state
  let zoomScale: number;
  let zoomShiftY: number;

  if (frame < 245) {
    zoomScale = zoomIn;
    zoomShiftY = shiftIn;
  } else {
    zoomScale = zoomOut;
    zoomShiftY = shiftOut;
  }

  // Typing indicator (f30–f55)
  const typingOpacity = (() => {
    if (frame < 30) return 0;
    if (frame <= 35)
      return interpolate(frame, [30, 35], [0, 1], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 48) return 1;
    return interpolate(frame, [48, 55], [1, 0], {
      easing: Easing.out(Easing.cubic),
      ...CL,
    });
  })();
  const typingScale = interpolate(frame, [30, 35], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Typewriter
  const visibleChars = getVisibleCharCount(frame);
  const visibleText = MESSAGE.slice(0, visibleChars);

  // Fade-to-white exit (f275–f305)
  const exitOpacity = interpolate(frame, [275, 305], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Input bar position ─────────────────────────────────────────────────
  const INPUT_BAR_BOTTOM_Y = 3000;
  const INPUT_BAR_HEIGHT = 280;
  const INPUT_BAR_TOP_Y = INPUT_BAR_BOTTOM_Y - INPUT_BAR_HEIGHT; // 2720
  const INPUT_BAR_LEFT_X = SCREEN_LEFT; // 55
  const INPUT_BAR_RIGHT_X = SCREEN_RIGHT; // 1477
  const INPUT_BAR_WIDTH = INPUT_BAR_RIGHT_X - INPUT_BAR_LEFT_X; // 1422

  // ── Quick-reply card — same edge-to-edge style as input bar, taller ──
  const CARD_BOTTOM_Y = INPUT_BAR_BOTTOM_Y; // 3000
  const CARD_HEIGHT = 800;
  const CARD_TOP_Y = CARD_BOTTOM_Y - CARD_HEIGHT; // 2250
  const CARD_LEFT_X = INPUT_BAR_LEFT_X; // 55
  const CARD_RIGHT_X = INPUT_BAR_RIGHT_X; // 1477
  const CARD_WIDTH = INPUT_BAR_WIDTH; // 1422

  // Tap target on Option 1
  const TAP_X_IN_CARD = (CARD_LEFT_X + CARD_RIGHT_X) / 2;
  const TAP_Y_IN_CARD = CARD_TOP_Y + 220;

  // Angel message shift amount when card appears
  const MESSAGE_SHIFT_UP = 500;

  // User message bubble position (after card tap)
  const USER_BUBBLE_RIGHT_X = 1432;
  const USER_BUBBLE_TOP_Y = 2250;

  // Angel typing indicator position (below user bubble)
  const TYPING_INDICATOR_TOP_Y = 2500;
  const TYPING_INDICATOR_LEFT_X = 140;
  const USER_BUBBLE_MAX_WIDTH = 900;

  // Input bar fades OUT as card fades IN (f180-195), back IN (f235-245)
  const inputBarOpacity = interpolate(
    frame,
    [180, 195, 235, 245],
    [1, 0, 0, 1],
    {
      ...CL,
    },
  );

  // Card slide-up + fade-in (f180-195), hold, fade-out (f235-245)
  const cardSlideY = interpolate(frame, [180, 195], [200, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const cardOpacity = interpolate(frame, [180, 195, 235, 245], [0, 1, 1, 0], {
    ...CL,
  });

  // Angel message shift UP when card appears, back DOWN when card disappears
  const messageShiftY = interpolate(frame, [180, 195], [0, -MESSAGE_SHIFT_UP], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Tap animation on Option 1 (f225-245)
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

  // Option 1 background highlight after tap (f228+)
  const option1BgOpacity = interpolate(frame, [228, 235, 245], [0, 1, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Angel typing indicator (f275+)
  const typing2Opacity = interpolate(frame, [275, 285], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const typing2Scale = interpolate(frame, [275, 280], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // User bubble appears after card tap (f240-260)
  const userBubbleSlideY = interpolate(frame, [240, 260], [80, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const userBubbleOpacity = interpolate(frame, [240, 260], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  const s = phoneScale;

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
          transform: `translate(-50%, -50%) scale(${zoomScale}) translateY(${zoomShiftY / zoomScale}px)`,
          boxShadow: SHADOWS.phone,
          borderRadius: 220 * phoneScale,
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
          {/* Chat metadata: Today divider, Angel avatar, name, timestamp */}
          <Img
            src={staticFile("bubbles/angel_message.png")}
            style={{
              position: "absolute",
              left: (60 + 48 - SCREEN_LEFT) * s,
              top: (1800 - SCREEN_TOP) * s,
              width: (1412 - 96) * s,
              height: "auto",
              transform: `translateY(${messageShiftY * s}px)`,
            }}
          />

          {/* Typing indicator (f30–f55) */}
          {frame >= 30 && frame <= 55 && (
            <div
              style={{
                position: "absolute",
                left: (CONTENT_X - SCREEN_LEFT) * s,
                top: (CONTENT_Y - SCREEN_TOP) * s,
                width: 110 * s,
                height: 65 * s,
                borderRadius: 32 * s,
                background:
                  "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
                opacity: typingOpacity,
                transform: `scale(${typingScale})`,
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
                    transform: `translateY(${getDotOffset(dotIdx, frame) * s}px)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Message text — typewriter reveal (f50+) */}
          {frame >= TYPEWRITER_START && visibleChars > 0 && (
            <div
              style={{
                position: "absolute",
                left: (CONTENT_X - SCREEN_LEFT) * s,
                top: (CONTENT_Y - SCREEN_TOP) * s,
                maxWidth: 1200 * s,
                transform: `translateY(${messageShiftY * s}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: 56 * s,
                  fontWeight: TYPOGRAPHY.chatMessage.weight,
                  color: COLORS.textPrimary,
                  lineHeight: 1.5,
                  display: "block",
                  whiteSpace: "pre-wrap",
                }}
              >
                {visibleText}
              </span>
            </div>
          )}

          {/* Input bar — rendered in code */}
          <div
            style={{
              position: "absolute",
              left: (INPUT_BAR_LEFT_X - SCREEN_LEFT) * s,
              top: (INPUT_BAR_TOP_Y - SCREEN_TOP) * s,
              width: INPUT_BAR_WIDTH * s,
              height: INPUT_BAR_HEIGHT * s,
              backgroundColor: "transparent",
              borderTop: `${1 * s}px solid #D4D4D8`,
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "none",
              borderRadius: `${64 * s}px ${64 * s}px 0 0`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: 64 * s,
              paddingRight: 64 * s,
              zIndex: 3,
              opacity: inputBarOpacity,
            }}
          >
            <div
              style={{
                fontSize: 48 * s,
                color: "#53596A",
                fontFamily: TYPOGRAPHY.fontFamily,
                fontWeight: 300,
              }}
            >
              Reply to Angel
            </div>
            <Img
              src={staticFile("icons/send.svg")}
              style={{
                width: 80 * s,
                height: 80 * s,
              }}
            />
          </div>

          {/* Quick-reply card — replaces input bar (f180-245) */}
          {frame >= 180 && frame <= 245 && (
            <div
              style={{
                position: "absolute",
                left: (CARD_LEFT_X - SCREEN_LEFT) * s,
                top: (CARD_TOP_Y - SCREEN_TOP) * s,
                width: CARD_WIDTH * s,
                height: CARD_HEIGHT * s,
                transform: `translateY(${cardSlideY * s}px)`,
                opacity: cardOpacity,
                backgroundColor: "transparent",
                borderTop: `${1 * s}px solid #D4D4D8`,
                borderLeft: "none",
                borderRight: "none",
                borderBottom: "none",
                borderRadius: `${64 * s}px ${64 * s}px 0 0`,
                paddingLeft: 48 * s,
                paddingRight: 48 * s,
                paddingTop: 140 * s,
                paddingBottom: 60 * s,
                display: "flex",
                flexDirection: "column" as const,
                gap: 8 * s,
                zIndex: 4,
              }}
            >
              {/* Close button — top right */}
              <div
                style={{
                  position: "absolute" as const,
                  top: 24 * s,
                  right: 64 * s,
                  width: 90 * s,
                  height: 90 * s,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 5,
                }}
              >
                <Img
                  src={staticFile("icons/block.svg")}
                  style={{ width: 90 * s, height: 90 * s }}
                />
              </div>

              {/* Option 1 (tap target) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 36 * s,
                  padding: `${28 * s}px ${12 * s}px`,
                  borderBottom: `${1 * s}px solid rgba(0,0,0,0.06)`,
                  backgroundColor: option1BgOpacity > 0 ? '#F3F3FE' : 'transparent',
                  borderRadius: 16 * s,
                }}
              >
                <div
                  style={{
                    width: 72 * s,
                    height: 72 * s,
                    borderRadius: "50%",
                    backgroundColor: "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 38 * s,
                    fontWeight: 500,
                    color: "#1C1C1E",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div
                  style={{
                    fontSize: 54 * s,
                    color: "#1C1C1E",
                    fontFamily: TYPOGRAPHY.fontFamily,
                  }}
                >
                  Yes, $350 works 👍
                </div>
              </div>

              {/* Option 2 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 36 * s,
                  padding: `${28 * s}px ${12 * s}px`,
                  borderBottom: `${1 * s}px solid rgba(0,0,0,0.06)`,
                }}
              >
                <div
                  style={{
                    width: 72 * s,
                    height: 72 * s,
                    borderRadius: "50%",
                    backgroundColor: "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 38 * s,
                    fontWeight: 500,
                    color: "#1C1C1E",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div
                  style={{
                    fontSize: 54 * s,
                    color: "#1C1C1E",
                    fontFamily: TYPOGRAPHY.fontFamily,
                  }}
                >
                  Can we meet at $325?
                </div>
              </div>

              {/* Option 3 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 36 * s,
                  padding: `${28 * s}px ${12 * s}px`,
                  borderBottom: `${1 * s}px solid rgba(0,0,0,0.06)`,
                }}
              >
                <div
                  style={{
                    width: 72 * s,
                    height: 72 * s,
                    borderRadius: "50%",
                    backgroundColor: "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 38 * s,
                    fontWeight: 500,
                    color: "#1C1C1E",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div
                  style={{
                    fontSize: 54 * s,
                    color: "#1C1C1E",
                    fontFamily: TYPOGRAPHY.fontFamily,
                  }}
                >
                  I'd prefer $300
                </div>
              </div>

              {/* "Something else" row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 36 * s,
                  padding: `${28 * s}px ${12 * s}px`,
                  marginTop: 4 * s,
                }}
              >
                <div
                  style={{
                    width: 72 * s,
                    height: 72 * s,
                    borderRadius: "50%",
                    backgroundColor: "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Img
                    src={staticFile("icons/pen.svg")}
                    style={{ width: 38 * s, height: 38 * s }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 54 * s,
                    color: "#999",
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontStyle: "italic" as const,
                  }}
                >
                  Something else
                </div>
              </div>
            </div>
          )}

          {/* Tap indicator on Option 1 */}
          {frame >= 225 && frame <= 245 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: (TAP_X_IN_CARD - SCREEN_LEFT) * s,
                  top: (TAP_Y_IN_CARD - SCREEN_TOP) * s,
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
                    left: (TAP_X_IN_CARD - SCREEN_LEFT) * s,
                    top: (TAP_Y_IN_CARD - SCREEN_TOP) * s,
                    width: rippleSize * s,
                    height: rippleSize * s,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    border: `${3 * s}px solid rgba(251, 113, 133, ${rippleOpacity})`,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              )}
            </>
          )}
          {/* User message bubble — appears after tap (f240+) */}
          {frame >= 240 && (
            <div
              style={{
                position: "absolute",
                right: (SCREEN_RIGHT - USER_BUBBLE_RIGHT_X) * s,
                top: (USER_BUBBLE_TOP_Y - SCREEN_TOP) * s,
                transform: `translateY(${userBubbleSlideY * s}px)`,
                opacity: userBubbleOpacity,
                maxWidth: USER_BUBBLE_MAX_WIDTH * s,
                backgroundColor: "#F3F3FE",
                color: COLORS.textPrimary,
                padding: `${28 * s}px ${36 * s}px`,
                borderRadius: 32 * s,
                fontSize: 56 * s,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontWeight: TYPOGRAPHY.chatMessage.weight,
                lineHeight: 1.5,
                zIndex: 5,
              }}
            >
              Yes, $350 works 👍
            </div>
          )}

          {/* Angel typing indicator (f275+) */}
          {frame >= 275 && (
            <div
              style={{
                position: "absolute",
                left: (TYPING_INDICATOR_LEFT_X - SCREEN_LEFT) * s,
                top: (TYPING_INDICATOR_TOP_Y - SCREEN_TOP) * s,
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
                zIndex: 5,
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
                    transform: `translateY(${getDotOffset(dotIdx, frame) * s}px)`,
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
            borderRadius: 250 * phoneScale,
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
