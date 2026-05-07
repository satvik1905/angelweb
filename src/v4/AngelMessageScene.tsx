import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
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
const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

// Typing dot bounce
const TYPING_PERIOD = 18;
function getDotOffset(dotIndex: number, frame: number) {
  const dotPhaseOffset = dotIndex * 4;
  const localFrame = ((frame - 75 + dotPhaseOffset) % TYPING_PERIOD + TYPING_PERIOD) % TYPING_PERIOD;
  const phase = localFrame / TYPING_PERIOD;
  const wave = Math.sin(phase * Math.PI * 2);
  return -8 * Math.max(0, wave);
}

const MESSAGE_TEXT =
  "Hey! Just a quick update — Saawan has reviewed everyone's input and the group will be going with a hotel for this trip. I've made sure to flag that communal space matters to the group, so the hotel I'm recommending has a shared lounge and common areas. Hope that helps! Let me know if you have any questions.";

export const AngelMessageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Phone base scale
  const phoneScale = (height * 0.75) / PNG_H;
  const phoneW = PNG_W * phoneScale;
  const phoneH = PNG_H * phoneScale;

  // Fade-in (f0–f15)
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Camera zoom to message area (f60–f75)
  const TARGET_SOURCE_Y = 1500;
  const targetLocalY = (TARGET_SOURCE_Y / PNG_H) * phoneH - phoneH / 2;

  const zoomScale = interpolate(frame, [60, 75], [1.0, 1.25], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });
  const zoomShiftY = interpolate(
    frame,
    [60, 75],
    [0, -targetLocalY * 1.25],
    {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    }
  );

  // Typing indicator
  const typingOpacity = (() => {
    if (frame < 75) return 0;
    if (frame <= 80)
      return interpolate(frame, [75, 80], [0, 1], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 150) return 1;
    return interpolate(frame, [150, 158], [1, 0], {
      easing: Easing.out(Easing.cubic),
      ...CL,
    });
  })();
  const typingScale = interpolate(frame, [75, 80], [0.9, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Message bubble (f150+)
  const bubbleOpacity = interpolate(frame, [150, 165], [0, 1], CL);
  const bubbleScale = interpolate(frame, [150, 165], [0.94, 1.0], {
    easing: settleEasing,
    ...CL,
  });
  const bubbleTranslateY = interpolate(frame, [150, 165], [12, 0], {
    easing: settleEasing,
    ...CL,
  });

  const s = phoneScale; // shorthand for source → screen conversion

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
          <img
            src={staticFile("bubbles/angel_message.png")}
            style={{
              position: "absolute",
              left: (60 + 48 - SCREEN_LEFT) * s,
              top: (1800 - SCREEN_TOP) * s,
              width: (1412 - 96) * s,
              height: "auto",
            }}
          />

          {/* Typing indicator (f75–f158) */}
          {frame >= 75 && frame <= 158 && (
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

          {/* Message text (f150+) — no background box */}
          {frame >= 150 && (
            <div
              style={{
                position: "absolute",
                left: (CONTENT_X - SCREEN_LEFT) * s,
                top: (CONTENT_Y - SCREEN_TOP) * s,
                maxWidth: 1200 * s,
                opacity: bubbleOpacity,
                transform: `scale(${bubbleScale}) translateY(${bubbleTranslateY * s}px)`,
                transformOrigin: "top left",
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
                }}
              >
                {MESSAGE_TEXT}
              </span>
            </div>
          )}
        </div>

        {/* Phone bezel image */}
        <img
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
    </AbsoluteFill>
  );
};
