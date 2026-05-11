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
  const localFrame = ((frame - 30 + dotPhaseOffset) % TYPING_PERIOD + TYPING_PERIOD) % TYPING_PERIOD;
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
  const lineBreakFrame = TYPEWRITER_START + Math.round(lineBreakProgress * typingBudget);
  const pauseEndFrame = lineBreakFrame + PAUSE_FRAMES;

  if (frame <= lineBreakFrame) {
    const progress = (frame - TYPEWRITER_START) / (lineBreakFrame - TYPEWRITER_START);
    return Math.floor(LINE_BREAK_INDEX * progress);
  } else if (frame <= pauseEndFrame) {
    return LINE_BREAK_INDEX;
  } else {
    const progress = (frame - pauseEndFrame) / (TYPEWRITER_END - pauseEndFrame);
    return LINE_BREAK_INDEX + Math.floor((TOTAL_CHARS - LINE_BREAK_INDEX) * progress);
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

  // Zoom-out beat (f180–f210)
  const zoomOut = interpolate(frame, [180, 210], [MAX_ZOOM, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const shiftOut = interpolate(frame, [180, 210], [-targetLocalY * MAX_ZOOM, 0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Combined camera state
  let zoomScale: number;
  let zoomShiftY: number;

  if (frame < 180) {
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

  // Fade-to-white exit (f210–f240)
  const exitOpacity = interpolate(frame, [210, 240], [0, 1], {
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
                background: "linear-gradient(135deg, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
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

      {/* Fade-to-white exit overlay (f210–f240) */}
      {frame >= 210 && (
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
