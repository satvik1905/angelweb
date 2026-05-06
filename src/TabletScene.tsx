import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig, staticFile } from "remotion";

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

// ── Vertical iPhone PNG camera system ────────────────────────────────────────
// Wide framing throughout — no zoom-ins on individual bubbles.
// Camera holds at zoom 1.0 so the full iPhone (header → input bar) stays visible.
// Only the exit transition at f345+ is preserved.
const V_CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 0, x: 0, y: 0, zoom: 1.0 },
  // Hold wide through entire bubble sequence and beyond
  { frame: 345, x: 0, y: 0, zoom: 1.0 },
  // Exit: hold steady as sparkle takes over
  { frame: 388, x: 0, y: 0, zoom: 1.0 },
];

function getCameraAt(frame: number, keyframes: CamFrame[] = CAMERA_KEYFRAMES): { x: number; y: number; zoom: number } {
  if (frame < keyframes[0].frame) {
    return { x: 0, y: 0, zoom: 1.0 };
  }
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
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
  const last = keyframes[keyframes.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom };
}

function getMessageHighlight(messageIndex: number, frame: number): number {
  const focusRanges: Record<number, [number, number]> = {
    0: [90, 120], // Maya — "I can't do $300"
    1: [138, 165], // Jay  — "Dates don't work"
    2: [183, 210], // Sam  — "I'm out"
    3: [228, 258], // Claire — "what do we do now??"
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
    isHero: false,
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
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // In vertical mode with camera zoom, the toggle gets zoomed to screen center
  const vToggleCenterX = width / 2;
  const vToggleCenterY = height / 2;

  // ── Vertical mode: phone layout constants (used for tap indicator + modal) ──
  const phoneRenderHeight = height * 0.85;
  const phoneScale = phoneRenderHeight / 3140;
  const phoneRenderWidth = 1532 * phoneScale;
  const phoneLeft = (width - phoneRenderWidth) / 2;
  const phoneTop = (height - phoneRenderHeight) / 2;
  // Kebab menu (⋮) position in frame coordinates — PNG-internal (1380, 340)
  const kebabFrameX = phoneLeft + 1380 * phoneScale;
  const kebabFrameY = phoneTop + 340 * phoneScale;

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
  const camKeyframes = isVertical ? V_CAMERA_KEYFRAMES : CAMERA_KEYFRAMES;
  const cam = getCameraAt(frame, camKeyframes);
  const prevCam = getCameraAt(Math.max(0, frame - 1), camKeyframes);
  const camSpeed =
    Math.sqrt(Math.pow(cam.x - prevCam.x, 2) + Math.pow(cam.y - prevCam.y, 2)) +
    Math.abs(cam.zoom - prevCam.zoom) * 60;
  const camBlur = Math.min(camSpeed / 8, 5);

  // ── Beat 5a: DESKTOP tap indicator (frames 288–345) ─────────────────────
  const cursorTargetX = 980;
  const cursorTargetY = 550;
  const cursorStartX = 1500;
  const cursorStartY = 1000;

  const cursorEnterX = interpolate(frame, [293, 311], [cursorStartX, cursorTargetX], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorEnterY = interpolate(frame, [293, 311], [cursorStartY, cursorTargetY], {
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

  // Desktop tap animation — shrink on press, spring back out
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

  // ── Beat 5b: VERTICAL tap indicator → kebab menu (frames 250–290) ──────
  const vTapX = interpolate(frame, [250, 280], [width + 60, kebabFrameX], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vTapY = interpolate(frame, [250, 280], [kebabFrameY + 300, kebabFrameY], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vTapEnterOpacity = interpolate(frame, [250, 258], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vTapExitOpacity = interpolate(frame, [283, 290], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vTapOpacity = Math.min(vTapEnterOpacity, vTapExitOpacity);
  // Tap pulse at f280 — scale up then back
  const vTapScale = (() => {
    if (frame < 278) return 1;
    if (frame <= 280)
      return interpolate(frame, [278, 280], [1, 0.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    if (frame <= 284)
      return interpolate(frame, [280, 284], [0.5, 1.4], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    if (frame <= 288)
      return interpolate(frame, [284, 288], [1.4, 1.0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    return 1;
  })();

  // ── VERTICAL: Phone fade-out after kebab tap (f283–f300) ───────────────
  const phoneFadeOpacity = interpolate(frame, [283, 300], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneFadeScale = interpolate(frame, [283, 300], [1, 1.1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── VERTICAL: Fullscreen modal (f300–f345) ────────────────────────────
  const modalSlideProgress = interpolate(frame, [300, 320], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const modalTranslateY = (1 - modalSlideProgress) * 100;
  const modalBackdropOpacity = interpolate(frame, [300, 315], [0, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const modalCloseIconOpacity = interpolate(frame, [310, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        background: isVertical ? "#F5F5F5" : "#000000",
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

        {/* ── Camera wrapper — shared by both modes, each uses its own keyframes ── */}
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
          {/* ── HORIZONTAL: Full tablet frame ── */}
          {!isVertical && (
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
          )}

          {/* ── VERTICAL: iPhone PNG mockup with animated bubble PNGs ── */}
          {isVertical && frame < 300 && (() => {
            // PNG is 1532×3140, rendered at 85% of frame height
            const pScale = phoneRenderHeight / 3140;
            const pWidth = 1532 * pScale;

            const BUBBLES = [
              { src: staticFile("bubbles/maya.png"), startFrame: 80 },
              { src: staticFile("bubbles/jay.png"), startFrame: 128 },
              { src: staticFile("bubbles/sam.png"), startFrame: 173 },
              { src: staticFile("bubbles/claire.png"), startFrame: 218 },
            ];

            return (
              <div
                style={{
                  position: "relative",
                  width: pWidth,
                  height: phoneRenderHeight,
                  transform: `scale(${tabletScale * phoneFadeScale})`,
                  opacity: tabletOpacity * phoneFadeOpacity,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={staticFile("chat.png")}
                  style={{
                    width: pWidth,
                    height: phoneRenderHeight,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />

                {/* Chat content area — bubbles */}
                <div
                  style={{
                    position: "absolute",
                    top: 620 * pScale,
                    left: 120 * pScale,
                    width: 1292 * pScale,
                    height: 2180 * pScale,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: 1292,
                      height: 2180,
                      transform: `scale(${pScale})`,
                      transformOrigin: "top left",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 100,
                      padding: "30px 0",
                    }}
                  >
                    {BUBBLES.map((bubble, i) => {
                      const bubbleOpacity = interpolate(
                        frame,
                        [bubble.startFrame, bubble.startFrame + 12],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                      );
                      const bubbleY = interpolate(
                        frame,
                        [bubble.startFrame, bubble.startFrame + 12],
                        [30, 0],
                        {
                          easing: Easing.out(Easing.cubic),
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        },
                      );
                      const highlight = getMessageHighlight(i, frame);
                      return (
                        <img
                          key={i}
                          src={bubble.src}
                          style={{
                            opacity: bubbleOpacity * highlight,
                            transform: `translateY(${bubbleY}px)`,
                            filter:
                              highlight === 1
                                ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                                : "none",
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

        {/* Burst flash at toggle center — blooms at the moment of click (desktop only) */}
        {!isVertical && frame >= 313 && frame <= 323 && (
          <div
            style={{
              position: "absolute",
              left: isVertical ? vToggleCenterX : TOGGLE_CENTER_X,
              top: isVertical ? vToggleCenterY : TOGGLE_CENTER_Y,
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

        {/* Scatter diamonds — screen space, erupt from toggle center (desktop only) */}
        {!isVertical && SCATTER_DIAMONDS.map((d, i) => {
          if (frame < d.birthFrame) return null;

          // Resolve toggle center for current orientation
          const tcX = isVertical ? vToggleCenterX : TOGGLE_CENTER_X;
          const tcY = isVertical ? vToggleCenterY : TOGGLE_CENTER_Y;

          // In vertical, scale offsets up so diamonds spread across taller canvas
          const offsetScale = isVertical ? 1.6 : 1;

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
          const eruptedX = d.offsetX * offsetScale * eruptionProgress;
          const eruptedY = d.offsetY * offsetScale * eruptionProgress;

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

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: tcX + eruptedX + driftX,
                top: tcY + eruptedY + driftY,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 5,
              }}
            >
              <Sparkle
                size={d.size * sizeScale * burstScale}
                opacity={enterOpacity * twinkleOpacity * exitFade}
                rotation={rotation}
                gradientId={`scatter-diamond-${i}`}
              />
            </div>
          );
        })}

        {/* DESKTOP: Tap indicator — screen space, centered on toggle */}
        {!isVertical && frame >= 288 && frame <= 345 && (
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

        {/* VERTICAL: Tap indicator → kebab menu */}
        {isVertical && frame >= 250 && frame < 290 && (
          <div
            style={{
              position: "absolute",
              left: vTapX,
              top: vTapY,
              transform: "translate(-50%, -50%)",
              opacity: vTapOpacity,
              zIndex: 200,
              pointerEvents: "none",
            }}
          >
            <TapIndicator tapping={vTapScale} />
          </div>
        )}

        {/* VERTICAL: Fullscreen modal UI moment (f300–f345) */}
        {isVertical && frame >= 300 && frame <= 345 && (
          <>
            {/* Full-frame backdrop */}
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

            {/* Close X icon — centered above sheet */}
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

            {/* Fullscreen bottom sheet */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                background: "#FFFFFF",
                borderTopLeftRadius: 48,
                borderTopRightRadius: 48,
                boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
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
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 20px" }}>
                <div style={{ width: 48, height: 5, borderRadius: 3, background: "#D1D5DB" }} />
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
                    color: "#1a1a1a",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#F5F5F7", borderRadius: 14 }}>
                    <img src={staticFile(`icons/${item.icon}`)} width={36} height={36} />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}

              {/* Separator */}
              <div style={{ height: 1.5, background: "#E5E7EB", margin: "28px 48px" }} />

              {/* Start new chat */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "0 48px",
                  height: 100,
                  fontSize: 40,
                  color: "#1a1a1a",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                  fontWeight: 400,
                }}
              >
                <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#F5F5F7", borderRadius: 14 }}>
                  <img src={staticFile("icons/new.svg")} width={36} height={36} />
                </div>
                <span>Start new chat with this group</span>
              </div>

              {/* Angel Mode row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 48px",
                  height: 100,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#F5F5F7", borderRadius: 14 }}>
                    <img src={staticFile("icons/wings.svg")} width={36} height={36} />
                  </div>
                  <span style={{ fontSize: 40, fontWeight: 600, color: "#1a1a1a" }}>Angel Mode</span>
                </div>
                <img src={staticFile("icons/toggle_off.svg")} width={88} height={52} />
              </div>

              {/* Separator */}
              <div style={{ height: 1.5, background: "#E5E7EB", margin: "28px 48px" }} />

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
                    color: "#FF3B30",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#F5F5F7", borderRadius: 14 }}>
                    <img src={staticFile(`icons/${item.icon}`)} width={36} height={36} />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}

              {/* iOS home indicator bar */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 28 }}>
                <div style={{ width: 140, height: 5, borderRadius: 3, background: "#D0D0D0" }} />
              </div>
            </div>
          </>
        )}

        {/* ── Exit transition: sparkle spins up and engulfs the frame ──── */}
        {frame >= 345 && (() => {
          const exitStart = 345;
          const exitEnd = 390;
          const exitDuration = exitEnd - exitStart; // 45 frames (1.5s)
          const ef = frame - exitStart; // 0–45

          // Rotation: accelerates from slow to very fast (5 full spins total)
          const exitRotation = interpolate(ef, [0, exitDuration], [0, 1800], {
            easing: Easing.in(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Scale: anticipation ��� ramp → explosive expansion
          const sparkleBaseSize = 40;
          const coverageSize = Math.max(width, height) * 1.5;
          const exitSize = interpolate(
            ef,
            [0, 9, 32, 40],
            [sparkleBaseSize, sparkleBaseSize, sparkleBaseSize * 3, coverageSize],
            {
              easing: Easing.in(Easing.poly(4)),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          // Opacity: full through most of exit, fades at very end
          const exitOpacity = interpolate(ef, [0, 38, 45], [1, 1, 0], {
            easing: Easing.in(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
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

        {/* Fade to black (final 5 frames) */}
        {frame >= 385 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
              opacity: interpolate(frame, [385, 390], [0, 1], {
                extrapolateLeft: "clamp",
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
