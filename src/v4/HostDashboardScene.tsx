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

const PHONE_W = 1532;
const PHONE_H = 3140;
const CONTENT_W = 1560;
const CONTENT_H = 3092;

// Screen content area inside dashboard.png (empty area between header and button)
// Eyeballed from the image — will tune
const SCREEN_AREA_TOP = 520;
const SCREEN_AREA_BOTTOM = 2700;
const SCREEN_AREA_LEFT = 100;
const SCREEN_AREA_RIGHT = 1432;
const SCREEN_AREA_WIDTH = SCREEN_AREA_RIGHT - SCREEN_AREA_LEFT;
const SCREEN_AREA_HEIGHT = SCREEN_AREA_BOTTOM - SCREEN_AREA_TOP;

const PHONE_Y_OFFSET = 350; // shift phone down by this many pixels in viewport

const CL = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const HostDashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isHorizontal = width === 1920 && height === 1080;

  // Phone sizing — same pattern as other phone scenes
  const phoneScale = isHorizontal
    ? (height * 0.9) / PHONE_H
    : (height * 0.85) / PHONE_H;

  const phoneW = PHONE_W * phoneScale;
  const phoneH = PHONE_H * phoneScale;

  // Compute screen area in scaled coords
  const screenTop = SCREEN_AREA_TOP * phoneScale;
  const screenLeft = SCREEN_AREA_LEFT * phoneScale;
  const screenWidth = SCREEN_AREA_WIDTH * phoneScale;
  const screenHeight = SCREEN_AREA_HEIGHT * phoneScale;

  // Content sizing: scale content to match screen area width
  const contentScale = screenWidth / CONTENT_W;
  const scaledContentH = CONTENT_H * contentScale;

  // Scroll: scroll content up to reveal bottom
  const maxScroll = scaledContentH - screenHeight;

  const scrollY = interpolate(frame, [25, 80], [0, maxScroll], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Camera zoom: in f10–25, hold f25–80, out f80–95
  const MAX_ZOOM = isHorizontal ? 1.8 : 1.05;
  const cameraScale = interpolate(
    frame,
    [10, 25, 80, 95],
    [1.0, MAX_ZOOM, MAX_ZOOM, 1.0],
    {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    },
  );

  // Camera pan: shift phone up to reveal from top to bottom, then back to center
  const maxPanAtZoom = phoneH * MAX_ZOOM - height;
  const cameraPanY = interpolate(frame, [25, 79, 80, 95], [0, -maxPanAtZoom, -maxPanAtZoom, 0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Scene fade-in from white (f0–10)
  const sceneFadeIn = interpolate(frame, [0, 10], [1, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Fade-to-white at end (f95–105)
  const whiteFadeOut = interpolate(frame, [95, 105], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <WarmGlow />

      {/* Phone wrapper */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2 + (isHorizontal ? PHONE_Y_OFFSET * ((cameraScale - 1) / 0.8) + cameraPanY : 0),
          width: phoneW,
          height: phoneH,
          transform: `translate(-50%, -50%) scale(${cameraScale})`,
        }}
      >
        {/* Phone bezel — base layer */}
        <Img
          src={staticFile("dashboard.png")}
          style={{
            position: "absolute",
            width: phoneW,
            height: phoneH,
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />

        {/* Scrollable content — masked to screen area */}
        <div
          style={{
            position: "absolute",
            top: screenTop,
            left: screenLeft,
            width: screenWidth,
            height: screenHeight,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <Img
            src={staticFile("dashboard-content.png")}
            style={{
              width: "100%",
              transform: `translateY(${-scrollY}px)`,
            }}
          />
        </div>
      </div>

      {/* White fade-in overlay (fades OUT to reveal scene) */}
      <AbsoluteFill
        style={{
          backgroundColor: "#FFFFFF",
          opacity: sceneFadeIn,
          pointerEvents: "none",
        }}
      />

      {/* White fade-out overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: "#FFFFFF",
          opacity: whiteFadeOut,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
