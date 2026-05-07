import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { COLORS, SHADOWS } from "./v4/tokens";

// ── Phone PNG dimensions ─────────────────────────────────────────────────────
const PNG_W = 1532;
const PNG_H = 3140;
const CHAT_TOP = 620; // PNG-internal y below "Today" separator
const CHAT_LEFT = 120;
const CHAT_W = 1292; // 1412 - 120
const CHAT_H = 2260; // 2880 - 620

// ── Bubble definitions ───────────────────────────────────────────────────────
const BUBBLES = [
  { src: "bubbles/maya.png", startFrame: 80 },
  { src: "bubbles/jay.png", startFrame: 128 },
  { src: "bubbles/sam.png", startFrame: 173 },
  { src: "bubbles/claire.png", startFrame: 218 },
];

// ── Settle easing — overshoots then lands ────────────────────────────────────
const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

// ── Camera system ────────────────────────────────────────────────────────────
type CamFrame = { frame: number; x: number; y: number; zoom: number };

// Desktop: hold wide through Shot 1, placeholder zoom for f250+
const TOGGLE_OFFSET = { x: 450, y: -325 };
const CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 0, x: 0, y: 0, zoom: 1.0 },
  // Hold wide through Shot 1 + Shot 2 (tap on kebab)
  { frame: 300, x: 0, y: 0, zoom: 1.0 },
  // Shot 3+ placeholder — zoom to toggle area
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
  { frame: 388, x: 0, y: 0, zoom: 1.0 },
];

// Vertical: hold wide throughout, exit sparkle handles the rest
const V_CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 0, x: 0, y: 0, zoom: 1.0 },
  { frame: 345, x: 0, y: 0, zoom: 1.0 },
  { frame: 388, x: 0, y: 0, zoom: 1.0 },
];

function getCameraAt(
  frame: number,
  keyframes: CamFrame[],
): { x: number; y: number; zoom: number } {
  if (frame < keyframes[0].frame) return { x: 0, y: 0, zoom: 1.0 };
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const p = (frame - a.frame) / (b.frame - a.frame);
      const eased =
        p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        zoom: a.zoom + (b.zoom - a.zoom) * eased,
      };
    }
  }
  const last = keyframes[keyframes.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom };
}

// ── Sparkle (exit transition) ────────────────────────────────────────────────
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
        ? `drop-shadow(0 0 80px rgba(244,114,182,0.95)) drop-shadow(0 0 200px rgba(251,113,133,0.7))`
        : `drop-shadow(0 0 6px rgba(244,114,182,0.8))`,
    }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor={COLORS.brandStart} />
        <stop offset="70%" stopColor={COLORS.brandMid} />
        <stop offset="100%" stopColor={COLORS.brandEnd} />
      </linearGradient>
    </defs>
    <path
      d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
      fill={`url(#${gradientId})`}
    />
  </svg>
);


// ── Clamp helper ─────────────────────────────────────────────────────────────
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ══════════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════════
export default function TabletScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // ── Phone sizing ──────────────────────────────────────────────────────────
  // Desktop: phone height = 85% of viewport | Reel: phone width = 78% of viewport
  const pngScale = isVertical
    ? (width * 0.78) / PNG_W
    : (height * 0.85) / PNG_H;
  const phoneW = PNG_W * pngScale;
  const phoneH = PNG_H * pngScale;
  const phoneLeft = (width - phoneW) / 2;
  const phoneTop = (height - phoneH) / 2;


  // ── Shot 1: Opening flash bridge (f0–35) ──────────────────────────────────
  const openingFlashOpacity = interpolate(frame, [0, 35], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...CL,
  });

  // ── Shot 1: Phone entrance (f20–55) ───────────────────────────────────────
  const phoneEnterScale = interpolate(frame, [20, 55], [0.94, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const phoneEnterOpacity = interpolate(frame, [20, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Shot 1: WarmGlow breathing (3.5s / 105-frame period) ──────────────────
  const glowBreath =
    (Math.sin((frame / 105) * Math.PI * 2) + 1) / 2; // 0 → 1 → 0
  const glowIntensity = 0.6 + glowBreath * 0.4; // 0.6 → 1.0
  const glowFadeIn = interpolate(frame, [15, 60], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // ── Camera ────────────────────────────────────────────────────────────────
  const camKF = isVertical ? V_CAMERA_KEYFRAMES : CAMERA_KEYFRAMES;
  const cam = getCameraAt(frame, camKF);
  const prevCam = getCameraAt(Math.max(0, frame - 1), camKF);
  const camSpeed =
    Math.sqrt(
      Math.pow(cam.x - prevCam.x, 2) + Math.pow(cam.y - prevCam.y, 2),
    ) +
    Math.abs(cam.zoom - prevCam.zoom) * 60;
  const camBlur = Math.min(camSpeed / 8, 5);

  // ══════════════════════════════════════════════════════════════════════════
  // SHOT 2 — Zoom in on phone header (f250–f300)
  // Just the zoom. No tap, no kebab, no indicator.
  // ══════════════════════════════════════════════════════════════════════════

  // Scale: 1.0 → 1.6 over f250–f300
  const shot2Scale = interpolate(frame, [250, 300], [1.0, 1.6], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Y shift: move phone down so the header (source y≈300) ends up near viewport center
  // Header offset from phone center in source px: 300 - 3140/2 = -1270
  // At scale 1.6, header is at: viewportCenter + (-1270 * pngScale * 1.6)
  // To center it: shift = 1270 * pngScale * 1.6 (move phone down by this amount)
  // But we interpolate from 0 to this target
  const headerShiftTarget = 1270 * pngScale * 1.6;
  const shot2OffsetY = interpolate(frame, [250, 300], [0, headerShiftTarget], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  // Vertical: phone fades out for modal transition (f295–f300)
  const phoneFadeOpacity = interpolate(frame, [295, 300], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...CL,
  });

  // ── Vertical: Fullscreen modal (f300–f345) ────────────────────────────────
  const modalSlideProgress = interpolate(frame, [300, 320], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const modalTranslateY = (1 - modalSlideProgress) * 100;
  const modalBackdropOpacity = interpolate(frame, [300, 315], [0, 0.75], CL);
  const modalCloseIconOpacity = interpolate(frame, [310, 320], [0, 1], CL);

  // Desktop tap indicator removed — unified tap indicator handles both modes


  // ── Glow radius ───────────────────────────────────────────────────────────
  const glowRadius = phoneH * 1.4;

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "translate(0px, 0px)",
        }}
      >
        {/* ── WarmGlow: breathing radial behind phone ── */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: glowRadius * 2,
            height: glowRadius * 2,
            marginLeft: -glowRadius,
            marginTop: -glowRadius,
            borderRadius: "50%",
            background: `radial-gradient(circle,
              rgba(251, 113, 133, ${0.14 * glowIntensity}) 0%,
              rgba(244, 114, 182, ${0.09 * glowIntensity}) 40%,
              rgba(251, 146, 60, ${0.04 * glowIntensity}) 65%,
              transparent 85%)`,
            filter: "blur(40px)",
            opacity: glowFadeIn,
            pointerEvents: "none",
          }}
        />

        {/* ── Opening flash bridge from IntroScene (f0–35) ── */}
        {frame <= 35 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 50%,
                #ffffff 0%,
                #FFE4EC 30%,
                ${COLORS.brandEnd} 70%,
                ${COLORS.brandMid} 100%)`,
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
          {/* ── Phone + Bubbles (unified, both modes) ── */}
          {(() => {
            // Don't render phone after it's fully faded (vertical modal takes over)
            if (isVertical && frame >= 300) return null;

            const fadeOut = isVertical ? phoneFadeOpacity : 1;

            return (
              <div
                style={{
                  position: "relative",
                  width: phoneW,
                  height: phoneH,
                  transform: `scale(${phoneEnterScale * shot2Scale}) translateY(${shot2OffsetY / (phoneEnterScale * shot2Scale)}px)`,
                  // Shot 2: scale zooms in, translateY shifts phone down so header centers
                  opacity: phoneEnterOpacity * fadeOut,
                  transformOrigin: "center center",
                  boxShadow: SHADOWS.phone,
                  borderRadius: 40 * pngScale,
                }}
              >
                {/* iPhone mockup PNG */}
                <img
                  src={staticFile("chat.png")}
                  style={{
                    width: phoneW,
                    height: phoneH,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    borderRadius: 40 * pngScale,
                  }}
                />

                {/* Chat content area — bubble PNGs animate in */}
                <div
                  style={{
                    position: "absolute",
                    top: CHAT_TOP * pngScale,
                    left: CHAT_LEFT * pngScale,
                    width: CHAT_W * pngScale,
                    height: CHAT_H * pngScale,
                    overflow: "hidden",
                  }}
                >
                  {/* Inner container at PNG-space coordinates, scaled down */}
                  <div
                    style={{
                      width: CHAT_W,
                      height: CHAT_H,
                      transform: `scale(${pngScale})`,
                      transformOrigin: "top left",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 100,
                      padding: "30px 0",
                    }}
                  >
                    {BUBBLES.map((bubble, i) => {
                      const s = bubble.startFrame;
                      const dur = 18;

                      // Opacity: 0 → 1 over 18 frames, out.cubic
                      const bubbleOpacity = interpolate(
                        frame,
                        [s, s + dur],
                        [0, 1],
                        { easing: Easing.out(Easing.cubic), ...CL },
                      );

                      // TranslateY: 24px → 0 over 18 frames, out.cubic
                      const bubbleY = interpolate(
                        frame,
                        [s, s + dur],
                        [24, 0],
                        { easing: Easing.out(Easing.cubic), ...CL },
                      );

                      // Scale: 0.96 → 1.0 with settle easing (overshoots to ~1.02 then lands)
                      const bubbleScale = interpolate(
                        frame,
                        [s, s + dur],
                        [0.96, 1.0],
                        { easing: settleEasing, ...CL },
                      );

                      return (
                        <img
                          key={i}
                          src={staticFile(bubble.src)}
                          style={{
                            opacity: bubbleOpacity,
                            transform: `translateY(${bubbleY}px) scale(${bubbleScale})`,
                            transformOrigin: "left top",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* end camera wrapper */}




        {/* ── Vertical: Fullscreen modal (f300–f345) ── */}
        {isVertical && frame >= 300 && frame <= 345 && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000000",
                opacity: modalBackdropOpacity,
                zIndex: 150,
                pointerEvents: "none",
              }}
            />

            {/* Close X */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "18%",
                transform: "translate(-50%, -50%)",
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: modalCloseIconOpacity,
                zIndex: 160,
                pointerEvents: "none",
              }}
            >
              <img
                src={staticFile("icons/close.svg")}
                width={44}
                height={44}
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>

            {/* Bottom sheet */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                background: COLORS.background,
                borderTopLeftRadius: 48,
                borderTopRightRadius: 48,
                boxShadow: SHADOWS.modal,
                transform: `translateY(${modalTranslateY}%)`,
                zIndex: 155,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                paddingTop: 8,
                paddingBottom: 24,
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "16px 0 20px",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 5,
                    borderRadius: 3,
                    background: COLORS.divider,
                  }}
                />
              </div>

              {/* Menu items */}
              {[
                { icon: "details.svg", label: "View Details" },
                { icon: "mute.svg", label: "Mute Notifications" },
                { icon: "rename.svg", label: "Rename Chat" },
                { icon: "invite.svg", label: "Invite Members" },
                { icon: "itinerary.svg", label: "Itineraries (4)" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "0 48px",
                    height: 100,
                    fontSize: 40,
                    color: COLORS.textPrimary,
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: COLORS.surfaceSubtle,
                      borderRadius: 14,
                    }}
                  >
                    <img
                      src={staticFile(`icons/${item.icon}`)}
                      width={36}
                      height={36}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}

              <div
                style={{
                  height: 1.5,
                  background: COLORS.divider,
                  margin: "28px 48px",
                }}
              />

              {/* Start new chat */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "0 48px",
                  height: 100,
                  fontSize: 40,
                  color: COLORS.textPrimary,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                  fontWeight: 400,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: COLORS.surfaceSubtle,
                    borderRadius: 14,
                  }}
                >
                  <img
                    src={staticFile("icons/new.svg")}
                    width={36}
                    height={36}
                  />
                </div>
                <span>Start new chat with this group</span>
              </div>

              {/* Angel Mode */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 48px",
                  height: 100,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: COLORS.surfaceSubtle,
                      borderRadius: 14,
                    }}
                  >
                    <img
                      src={staticFile("icons/wings.svg")}
                      width={36}
                      height={36}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 40,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
                    }}
                  >
                    Angel Mode
                  </span>
                </div>
                <img
                  src={staticFile("icons/toggle_off.svg")}
                  width={88}
                  height={52}
                />
              </div>

              <div
                style={{
                  height: 1.5,
                  background: COLORS.divider,
                  margin: "28px 48px",
                }}
              />

              {/* Danger items */}
              {[
                { icon: "clear.svg", label: "Clear Chat" },
                { icon: "leave.svg", label: "Leave Chat" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "0 48px",
                    height: 100,
                    fontSize: 40,
                    color: COLORS.destructive,
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: COLORS.surfaceSubtle,
                      borderRadius: 14,
                    }}
                  >
                    <img
                      src={staticFile(`icons/${item.icon}`)}
                      width={36}
                      height={36}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}

              {/* Home indicator */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 28,
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 5,
                    borderRadius: 3,
                    background: "#D0D0D0",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Exit transition: sparkle spins up and engulfs the frame ── */}
        {frame >= 345 &&
          (() => {
            const exitStart = 345;
            const exitEnd = 390;
            const exitDuration = exitEnd - exitStart;
            const ef = frame - exitStart;

            const exitRotation = interpolate(
              ef,
              [0, exitDuration],
              [0, 1800],
              { easing: Easing.in(Easing.cubic), ...CL },
            );

            const sparkleBaseSize = 40;
            const coverageSize = Math.max(width, height) * 1.5;
            const exitSize = interpolate(
              ef,
              [0, 9, 32, 40],
              [
                sparkleBaseSize,
                sparkleBaseSize,
                sparkleBaseSize * 3,
                coverageSize,
              ],
              { easing: Easing.in(Easing.poly(4)), ...CL },
            );

            const exitOpacity = interpolate(ef, [0, 38, 45], [1, 1, 0], {
              easing: Easing.in(Easing.cubic),
              ...CL,
            });

            return (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  zIndex: 250,
                }}
              >
                <Sparkle
                  size={exitSize}
                  opacity={exitOpacity}
                  rotation={exitRotation}
                  gradientId="exit-sparkle-transition"
                  hero={true}
                />
              </div>
            );
          })()}

        {/* ── Fade to black (f385–390) ── */}
        {frame >= 385 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
              opacity: interpolate(frame, [385, 390], [0, 1], CL),
              zIndex: 260,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
}
