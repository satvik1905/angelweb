import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
} from "remotion";
import { WarmGlow } from "./components/WarmGlow";

const PNG_W = 1660;
const PNG_H = 3372;

// Dashboard button position in chat-banner.png coords — eyeballed, will tune after render
const TAP_X_IN_PNG = 1250;
const TAP_Y_IN_PNG = 585;

// Zoom focus point — the Angel banner's center (not the Dashboard button)
const ZOOM_TARGET_X = PNG_W / 2; // horizontal center of phone image
const ZOOM_TARGET_Y = 50; // banner's vertical center

const CL = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const ChatBannerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isHorizontal = width === 1920 && height === 1080;

  // Phone fits to viewport
  const basePhoneScale = isHorizontal
    ? (height * 0.9) / PNG_H
    : (height * 0.85) / PNG_H;

  // Camera zoom timeline:
  // f0–15:   Fade in, base scale (1.0)
  // f15–50:  Hold static
  // f50–57:  Tap appear + press
  // f55:     Tap moment
  // f55–70:  Zoom in on Dashboard button (1.0 → 1.4x) + fade to white
  // f70–75:  Hold fully white

  const MAX_ZOOM = isHorizontal ? 2.0 : 1.05;
  const cameraScale = interpolate(frame, [0, 30], [1.0, MAX_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Phone dimensions at base scale
  const phoneW = PNG_W * basePhoneScale;
  const phoneH = PNG_H * basePhoneScale;

  // Zoom target offset from image center (Angel banner, not Dashboard button)
  const zoomOffsetXFromCenter = (ZOOM_TARGET_X - PNG_W / 2) * basePhoneScale;
  const zoomOffsetYFromCenter = (ZOOM_TARGET_Y - PNG_H / 2) * basePhoneScale;

  // Camera shift so Angel banner stays centered as zoom increases
  const cameraShiftX = -zoomOffsetXFromCenter * (cameraScale - 1);
  const cameraShiftYRaw = -zoomOffsetYFromCenter * (cameraScale - 1);
  // Clamp vertical shift in reel to avoid cropping bottom
  const cameraShiftY = isHorizontal ? cameraShiftYRaw : cameraShiftYRaw * 0.3;

  // ── Inline tap animation (matching PhoneScene's kebab tap pattern) ──
  // Phase 1 — Appear (f50–f53)
  const tapAppearOpacity = interpolate(frame, [50, 53], [0, 0.7], CL);
  const tapAppearScale = interpolate(frame, [50, 53], [0.8, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Phase 2 — Tap press/release (f53–f57)
  const tapPressScale = (() => {
    if (frame < 53) return 1.0;
    if (frame <= 55)
      return interpolate(frame, [53, 55], [1.0, 0.85], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 57)
      return interpolate(frame, [55, 57], [0.85, 1.0], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    return 1.0;
  })();

  // Phase 3 — Fade out circle + ripple ring (f57–f75)
  const tapFadeOpacity =
    frame < 57 ? 0.7 : interpolate(frame, [57, 65], [0.7, 0], CL);

  // Combined circle opacity
  const circleOpacity =
    frame < 50 ? 0 : frame < 53 ? tapAppearOpacity : tapFadeOpacity;

  // Combined circle scale
  const circleScale = frame < 53 ? tapAppearScale : tapPressScale;

  // Ripple ring (f57–f75)
  const rippleActive = frame >= 57 && frame <= 75;
  const rippleSize = interpolate(frame, [57, 75], [50, 220], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const rippleOpacity = interpolate(frame, [57, 75], [0.6, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const rippleStroke = interpolate(frame, [57, 75], [3, 1], CL);

  // White fade-out (f65–75)
  const whiteFadeOut = interpolate(frame, [65, 75], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Tap position in scaled phone coords
  const tapX = TAP_X_IN_PNG * basePhoneScale;
  const tapY = TAP_Y_IN_PNG * basePhoneScale;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <WarmGlow />
      {/* Phone with chat — single image, camera zoomed */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2,
          width: phoneW,
          height: phoneH,
          transform: `translate(-50%, -50%) scale(${cameraScale}) translate(${cameraShiftX / cameraScale}px, ${cameraShiftY / cameraScale}px)`,
        }}
      >
        <Img
          src={staticFile("chat-banner.png")}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {/* Inline tap — solid dark circle + pink ripple ring */}
        {frame >= 50 && (
          <>
            {/* Solid dark tap circle */}
            <div
              style={{
                position: "absolute",
                left: tapX,
                top: tapY,
                width: 80 * basePhoneScale,
                height: 80 * basePhoneScale,
                borderRadius: "50%",
                background: "#1C1C1E",
                opacity: circleOpacity,
                transform: `translate(-50%, -50%) scale(${circleScale})`,
                pointerEvents: "none",
              }}
            />

            {/* Pink ripple ring */}
            {rippleActive && (
              <div
                style={{
                  position: "absolute",
                  left: tapX,
                  top: tapY,
                  width: rippleSize * basePhoneScale,
                  height: rippleSize * basePhoneScale,
                  borderRadius: "50%",
                  border: `${rippleStroke * basePhoneScale}px solid rgba(251, 113, 133, ${rippleOpacity})`,
                  background: "transparent",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
            )}
          </>
        )}
      </div>

      {/* White fade-out overlay */}
      <AbsoluteFill style={{
        backgroundColor: "#FFFFFF",
        opacity: whiteFadeOut,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
