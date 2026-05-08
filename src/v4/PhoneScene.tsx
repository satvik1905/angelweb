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
import { COLORS, SHADOWS } from "./tokens";
import { WarmGlow } from "./components/WarmGlow";
import { AngelModeSheet } from "./components/AngelModeSheet";
import { LightBloom } from "./components/LightBloom";

const PNG_W = 1532;
const PNG_H = 3140;

// Phone screen rectangle (inside bezel) in source pixels
const SCREEN_TOP = 55;
const SCREEN_LEFT = 55;
const SCREEN_RIGHT = 1477;
const SCREEN_BOTTOM = 3085;
const SCREEN_W = SCREEN_RIGHT - SCREEN_LEFT;
const SCREEN_H = SCREEN_BOTTOM - SCREEN_TOP;
const SCREEN_RADIUS = 185;

// Content area in source pixels
const CHAT_LEFT = 120;
const BUBBLE_WIDTH = 1100;

// Kebab ⋮ position in source pixels (center of the icon)
const KEBAB_SRC_X = 1370;
const KEBAB_SRC_Y = 330;

// Bubble definitions
const BUBBLES = [
  { src: "bubbles/maya.png", startFrame: 40, srcY: 700 },
  { src: "bubbles/jay.png", startFrame: 80, srcY: 1020 },
  { src: "bubbles/sam.png", startFrame: 115, srcY: 1340 },
  { src: "bubbles/claire.png", startFrame: 142, srcY: 1560 },
];

const settleEasing = Easing.bezier(0.34, 1.56, 0.64, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PhoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Phone base scale: height ≈ 75% of viewport
  const phoneScale = (height * 0.9) / PNG_H;
  const phoneW = PNG_W * phoneScale;
  const phoneH = PNG_H * phoneScale;

  // ── Cinematic camera beat sequencer (f0–f185) ──────────────────────────
  // Compute shift needed to center a source Y on screen at a given scale:
  // shiftY = -((srcY / PNG_H) * phoneH - phoneH / 2) * scale
  const srcYToShift = (srcY: number, scale: number) =>
    -((srcY / PNG_H) * phoneH - phoneH / 2) * scale;

  // Source Y positions for camera targets
  const MAYA_SRC_Y = 850; // center of Maya bubble area
  const JAY_SRC_Y = 1170;
  const SAM_SRC_Y = 1490;
  const CLAIRE_SRC_Y = 1710;
  const HEADER_SRC_Y = 250; // kebab/header center

  const BASE_SCALE = 1.0;
  const TRACKING_SCALE = 1.7;
  const HEADER_SCALE = 2.5;

  // Beat sequencer: each beat defines target scale and source Y
  // Camera interpolates between consecutive beat endpoints
  type CameraBeat = { frame: number; srcY: number; scale: number };
  const beats: CameraBeat[] = [
    { frame: 0, srcY: PNG_H / 2, scale: BASE_SCALE }, // wide establish
    { frame: 25, srcY: PNG_H / 2, scale: BASE_SCALE }, // hold wide
    { frame: 55, srcY: MAYA_SRC_Y, scale: TRACKING_SCALE }, // arrive at Maya
    { frame: 70, srcY: MAYA_SRC_Y, scale: TRACKING_SCALE }, // hold Maya
    { frame: 95, srcY: JAY_SRC_Y, scale: TRACKING_SCALE }, // arrive at Jay
    { frame: 105, srcY: JAY_SRC_Y, scale: TRACKING_SCALE }, // hold Jay
    { frame: 125, srcY: SAM_SRC_Y, scale: TRACKING_SCALE }, // arrive at Sam
    { frame: 135, srcY: SAM_SRC_Y, scale: TRACKING_SCALE }, // hold Sam
    { frame: 150, srcY: CLAIRE_SRC_Y, scale: TRACKING_SCALE }, // arrive at Claire
    { frame: 160, srcY: CLAIRE_SRC_Y, scale: TRACKING_SCALE }, // hold Claire
    { frame: 185, srcY: HEADER_SRC_Y, scale: HEADER_SCALE }, // arrive at header
  ];

  // Find active segment and interpolate
  const getCameraState = (f: number): { scale: number; shiftY: number } => {
    if (f <= beats[0].frame) {
      const b = beats[0];
      return { scale: b.scale, shiftY: srcYToShift(b.srcY, b.scale) };
    }
    for (let i = 1; i < beats.length; i++) {
      if (f <= beats[i].frame) {
        const prev = beats[i - 1];
        const curr = beats[i];
        const t = interpolate(f, [prev.frame, curr.frame], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        });
        const scale = prev.scale + (curr.scale - prev.scale) * t;
        const srcY = prev.srcY + (curr.srcY - prev.srcY) * t;
        return { scale, shiftY: srcYToShift(srcY, scale) };
      }
    }
    const last = beats[beats.length - 1];
    return { scale: last.scale, shiftY: srcYToShift(last.srcY, last.scale) };
  };

  // ── Step 7: Camera re-targets to Angel Mode row (f240–f260) ────────────
  const ANGEL_MODE_SRC_Y = 2760;
  const angelLocalY = (ANGEL_MODE_SRC_Y / PNG_H) * phoneH - phoneH / 2;
  const zoomF260 = 1.8;
  const shiftF260 = -angelLocalY * zoomF260;

  // Camera state: sequencer for f0-185, then existing logic for f185+
  let zoom: number;
  let zoomShiftY: number;

  if (frame <= 185) {
    const cam = getCameraState(frame);
    zoom = cam.scale;
    zoomShiftY = cam.shiftY;
  } else if (frame < 240) {
    // f185-240: hold at header state (scale 1.6)
    const headerState = getCameraState(185);
    zoom = headerState.scale;
    zoomShiftY = headerState.shiftY;
  } else {
    // f240-260: retarget to Angel Mode row
    const headerState = getCameraState(185);
    zoom = interpolate(frame, [240, 260], [headerState.scale, zoomF260], {
      easing: Easing.inOut(Easing.cubic),
      ...CL,
    });
    zoomShiftY = interpolate(
      frame,
      [240, 260],
      [headerState.shiftY, shiftF260],
      {
        easing: Easing.inOut(Easing.cubic),
        ...CL,
      },
    );
  }

  // ── Step 4: Kebab screen position (derived from phone transform) ──────
  // Kebab offset from phone div center, in phone-div pixels
  const kebabLocalX = (KEBAB_SRC_X / PNG_W) * phoneW - phoneW / 2;
  const kebabLocalY = (KEBAB_SRC_Y / PNG_H) * phoneH - phoneH / 2;
  // After scale(zoom) and translateY(zoomShiftY/zoom):
  // Screen position = phone screen center + local offset * zoom + shift
  const kebabScreenX = width / 2 + kebabLocalX * zoom;
  const kebabScreenY = height / 2 + kebabLocalY * zoom + zoomShiftY;

  // ── Step 4: Tap sequence (f200–f225) ────────────────────────────────────
  // Phase 1 — Appear (f200–f205)
  const tapAppearOpacity = interpolate(frame, [200, 205], [0, 0.7], CL);
  const tapAppearScale = interpolate(frame, [200, 205], [0.8, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Phase 2 — Tap press/release (f205–f211)
  const tapPressScale = (() => {
    if (frame < 205) return 1.0;
    if (frame <= 208)
      return interpolate(frame, [205, 208], [1.0, 0.85], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 211)
      return interpolate(frame, [208, 211], [0.85, 1.0], {
        easing: settleEasing,
        ...CL,
      });
    return 1.0;
  })();

  // Phase 3 — Fade out circle + ripple ring (f211–f225)
  const tapFadeOpacity =
    frame < 211 ? 0.7 : interpolate(frame, [211, 218], [0.7, 0], CL);

  // Combined circle opacity
  const circleOpacity =
    frame < 200 ? 0 : frame < 205 ? tapAppearOpacity : tapFadeOpacity;

  // Combined circle scale
  const circleScale = frame < 205 ? tapAppearScale : tapPressScale;

  // Ripple ring (f211–f225)
  const rippleActive = frame >= 211 && frame <= 225;
  const rippleSize = interpolate(frame, [211, 225], [50, 220], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const rippleOpacity = interpolate(frame, [211, 225], [0.6, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const rippleStroke = interpolate(frame, [211, 225], [3, 1], CL);

  // ── Step 8: Toggle tap sequence (f270–f295) ───────────────────────────
  // Toggle center in source pixels (right: 80 from screen edge, toggle height 128 → width ~256)
  const TOGGLE_SRC_X = 1315;
  const TOGGLE_SRC_Y = ANGEL_MODE_SRC_Y;

  const toggleLocalX = (TOGGLE_SRC_X / PNG_W) * phoneW - phoneW / 2;
  const toggleLocalY = (TOGGLE_SRC_Y / PNG_H) * phoneH - phoneH / 2;
  const toggleScreenX = width / 2 + toggleLocalX * zoom;
  const toggleScreenY = height / 2 + toggleLocalY * zoom + zoomShiftY;

  // Phase 1 — Appear (f270–f275)
  const toggleAppearOpacity = interpolate(frame, [270, 275], [0, 0.7], CL);
  const toggleAppearScale = interpolate(frame, [270, 275], [0.8, 1.0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Phase 2 — Tap press/release (f275–f281)
  const togglePressScale = (() => {
    if (frame < 275) return 1.0;
    if (frame <= 278)
      return interpolate(frame, [275, 278], [1.0, 0.85], {
        easing: Easing.out(Easing.cubic),
        ...CL,
      });
    if (frame <= 281)
      return interpolate(frame, [278, 281], [0.85, 1.0], {
        easing: settleEasing,
        ...CL,
      });
    return 1.0;
  })();

  // Phase 3 — Fade out circle + ripple ring (f281–f295)
  const toggleFadeOpacity =
    frame < 281 ? 0.7 : interpolate(frame, [281, 288], [0.7, 0], CL);

  // Combined toggle circle opacity
  const toggleCircleOpacity =
    frame < 270 ? 0 : frame < 275 ? toggleAppearOpacity : toggleFadeOpacity;

  // Combined toggle circle scale
  const toggleCircleScale = frame < 275 ? toggleAppearScale : togglePressScale;

  // Toggle ripple ring (f281–f295)
  const toggleRippleActive = frame >= 281 && frame <= 295;
  const toggleRippleSize = interpolate(frame, [281, 295], [40, 200], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const toggleRippleOpacity = interpolate(frame, [281, 295], [0.6, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const toggleRippleStroke = interpolate(frame, [281, 295], [3, 1], CL);

  // ── Flap animation — continuous squash-stretch cycle ─────────────────
  const FLAP_PERIOD = 14;
  const getFlap = (localFrame: number) => {
    const phase = (localFrame % FLAP_PERIOD) / FLAP_PERIOD;
    const angle = phase * Math.PI * 2;
    return {
      scaleX: 1.0 - 0.12 * Math.sin(angle),
      scaleY: 1.0 + 0.04 * Math.cos(angle),
    };
  };

  // ── Step 9b: Wing burst from toggle (f445–f475) ───────────────────────
  const WING_COUNT = 7;
  const WING_SIZE = 40;
  const WING_EMIT = 305;
  const WING_BURST_END = 315;
  const WING_DRIFT_END = 330;
  const HERO_INDEX = 3; // straight-up wing, becomes the hero

  const wingParticles = Array.from({ length: WING_COUNT }, (_, i) => {
    const isHero = i === HERO_INDEX;
    const angleDeg = -90 + (i / (WING_COUNT - 1) - 0.5) * 200;
    const angleRad = (angleDeg * Math.PI) / 180;
    const burstDistance = 80 + (i % 3) * 20;
    const driftExtra = 60 + (i % 4) * 10;
    const swayPhase = i * 0.7;
    const rotEnd = (i % 2 === 0 ? 1 : -1) * (15 + (i % 3) * 5);

    // Burst phase (f445–f455)
    const burstT = interpolate(frame, [WING_EMIT, WING_BURST_END], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...CL,
    });
    const burstX = Math.cos(angleRad) * burstDistance * burstT;
    const burstY = Math.sin(angleRad) * burstDistance * burstT;
    const burstScale = interpolate(
      frame,
      [WING_EMIT, WING_BURST_END],
      [0.4, 1.0],
      {
        easing: Easing.out(Easing.cubic),
        ...CL,
      },
    );
    const burstRot = rotEnd * burstT;
    const burstOpacity = interpolate(
      frame,
      [WING_EMIT, WING_EMIT + 4],
      [0, 1],
      CL,
    );

    // Drift phase (f455–f475)
    const driftT = interpolate(
      frame,
      [WING_BURST_END, WING_DRIFT_END],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        ...CL,
      },
    );
    const driftY = -driftExtra * driftT;
    // Hero wing: minimal sway, no fade. Others: normal sway + fade.
    const sway = isHero
      ? 0
      : Math.sin((frame - WING_BURST_END) * 0.15 + swayPhase) * 15 * driftT;
    const driftRot = isHero
      ? 0
      : Math.sin((frame - WING_BURST_END) * 0.1 + swayPhase) * 10;
    const driftOpacity = isHero
      ? 1
      : interpolate(frame, [WING_EMIT + 15, WING_DRIFT_END], [1, 0], CL);

    // Combine: burst position is the base, drift adds on top
    const x = toggleScreenX + burstX + (frame >= WING_BURST_END ? sway : 0);
    const y = toggleScreenY + burstY + (frame >= WING_BURST_END ? driftY : 0);
    const scale = burstScale;
    const rotation = burstRot + (frame >= WING_BURST_END ? driftRot : 0);
    const opacity = frame < WING_BURST_END ? burstOpacity : driftOpacity;

    // Flap animation — staggered per wing
    const flapLocal = frame - WING_EMIT + i * 3;
    const flap = getFlap(flapLocal);

    return { x, y, scale, rotation, opacity, isHero, flap };
  });

  // ── Step 9c: Hero wing growth + wash to white (f330–f369) ──────────────
  const HERO_GROWTH_START = 330;
  const HERO_GROWTH_MID = 350;
  const HERO_GROWTH_END = 369;

  const heroParticle = wingParticles[HERO_INDEX];
  const heroHandoffX = heroParticle.x;
  const heroHandoffY = heroParticle.y;
  const heroHandoffRot = heroParticle.rotation;

  // Hero wing position: migrates from hand-off to viewport center
  const heroGrowthX = interpolate(
    frame,
    [HERO_GROWTH_START, HERO_GROWTH_MID],
    [heroHandoffX, width / 2],
    { easing: Easing.inOut(Easing.cubic), ...CL },
  );
  const heroGrowthY = interpolate(
    frame,
    [HERO_GROWTH_START, HERO_GROWTH_MID],
    [heroHandoffY, height / 2],
    { easing: Easing.inOut(Easing.cubic), ...CL },
  );

  // Hero wing scale: 1.0 → 15 → 55
  const heroGrowthScale =
    frame < HERO_GROWTH_MID
      ? interpolate(frame, [HERO_GROWTH_START, HERO_GROWTH_MID], [1.0, 15], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        })
      : interpolate(frame, [HERO_GROWTH_MID, HERO_GROWTH_END], [15, 55], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        });

  // Hero rotation: freeze at hand-off value
  const heroGrowthRot = heroHandoffRot;

  // White overlay: fades in during f360–f369
  const heroWipeOpacity = interpolate(frame, [360, HERO_GROWTH_END], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

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
          transform: `translate(-50%, -50%) scale(${zoom}) translateY(${zoomShiftY / zoom}px)`,
          boxShadow: SHADOWS.phone,
          borderRadius: 220 * phoneScale,
          overflow: "hidden",
        }}
      >
        {/* Screen clipping area — masks content to phone display */}
        <div
          style={{
            position: "absolute",
            left: SCREEN_LEFT * phoneScale,
            top: SCREEN_TOP * phoneScale,
            width: SCREEN_W * phoneScale,
            height: SCREEN_H * phoneScale,
            borderRadius: SCREEN_RADIUS * phoneScale,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          {BUBBLES.map((bubble, i) => {
            const s = bubble.startFrame;
            const dur = 18;
            const opacity = interpolate(frame, [s, s + dur], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            });
            const translateY = interpolate(frame, [s, s + dur], [24, 0], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            });
            const scale = interpolate(frame, [s, s + dur], [0.96, 1.0], {
              easing: settleEasing,
              ...CL,
            });
            return (
              <Img
                key={i}
                src={staticFile(bubble.src)}
                style={{
                  position: "absolute",
                  left: (CHAT_LEFT - SCREEN_LEFT) * phoneScale,
                  top: (bubble.srcY - SCREEN_TOP) * phoneScale,
                  width: BUBBLE_WIDTH * phoneScale,
                  height: "auto",
                  transform: `translateY(${translateY * phoneScale}px) scale(${scale})`,
                  transformOrigin: "top left",
                  opacity,
                }}
              />
            );
          })}
        </div>

        {/* Dim + Bottom sheet — clipped to screen rect, above bezel */}
        {frame >= 225 &&
          (() => {
            const dimOpacity = interpolate(frame, [225, 240], [0, 0.5], {
              easing: Easing.out(Easing.cubic),
              ...CL,
            });
            const sheetSlide = interpolate(frame, [225, 240], [100, 0], {
              easing: settleEasing,
              ...CL,
            });
            return (
              <div
                style={{
                  position: "absolute",
                  left: SCREEN_LEFT * phoneScale,
                  top: SCREEN_TOP * phoneScale,
                  width: SCREEN_W * phoneScale,
                  height: SCREEN_H * phoneScale,
                  borderRadius: SCREEN_RADIUS * phoneScale,
                  overflow: "hidden",
                  zIndex: 14,
                  pointerEvents: "none",
                }}
              >
                {/* Dim overlay — fades in f330–f350 */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background: `rgba(0, 0, 0, ${dimOpacity})`,
                  }}
                />
                {/* Sheet slides up from bottom */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    transform: `translateY(${sheetSlide}%)`,
                  }}
                >
                  <AngelModeSheet
                    phoneScale={phoneScale}
                    phoneW={SCREEN_W * phoneScale}
                    phoneH={SCREEN_H * phoneScale}
                    activationFrame={295}
                  />
                </div>
              </div>
            );
          })()}

        {/* Phone bezel image — on top, framing the clipped content */}
        <Img
          src={staticFile("chat.png")}
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

      {/* Tap sequence — appear, press, ripple (f200–f225) */}
      {frame >= 200 && frame <= 225 && (
        <>
          {/* Solid dark tap circle */}
          <div
            style={{
              position: "absolute",
              left: kebabScreenX,
              top: kebabScreenY,
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: COLORS.textPrimary,
              opacity: circleOpacity,
              transform: `translate(-50%, -50%) scale(${circleScale})`,
              pointerEvents: "none",
              zIndex: 200,
            }}
          />

          {/* Ripple ring */}
          {rippleActive && (
            <div
              style={{
                position: "absolute",
                left: kebabScreenX,
                top: kebabScreenY,
                width: rippleSize,
                height: rippleSize,
                borderRadius: "50%",
                border: `${rippleStroke}px solid rgba(251, 113, 133, ${rippleOpacity})`,
                background: "transparent",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 199,
              }}
            />
          )}
        </>
      )}
      {/* Toggle tap sequence — appear, press, ripple (f270–f295) */}
      {frame >= 270 && frame <= 295 && (
        <>
          {/* Solid dark tap circle */}
          <div
            style={{
              position: "absolute",
              left: toggleScreenX,
              top: toggleScreenY,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: COLORS.textPrimary,
              opacity: toggleCircleOpacity,
              transform: `translate(-50%, -50%) scale(${toggleCircleScale})`,
              pointerEvents: "none",
              zIndex: 200,
            }}
          />

          {/* Ripple ring */}
          {toggleRippleActive && (
            <div
              style={{
                position: "absolute",
                left: toggleScreenX,
                top: toggleScreenY,
                width: toggleRippleSize,
                height: toggleRippleSize,
                borderRadius: "50%",
                border: `${toggleRippleStroke}px solid rgba(251, 113, 133, ${toggleRippleOpacity})`,
                background: "transparent",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 199,
              }}
            />
          )}
        </>
      )}

      {/* LightBloom behind Angel Mode row during activation (f295–f320) */}
      {frame >= 295 && frame <= 320 && (
        <LightBloom
          x={width / 2}
          y={height / 2 + angelLocalY * zoom + zoomShiftY}
          activationFrame={295}
          maxRadius={400}
          duration={25}
        />
      )}

      {/* Step 9b: Wing burst from toggle (f445+) — non-hero wings fade by f475 */}
      {frame >= WING_EMIT &&
        wingParticles.map((w, i) => {
          // Non-hero wings: only render during burst+drift (f445–f475)
          if (!w.isHero && frame > WING_DRIFT_END) return null;
          // Hero wing during growth phase: rendered separately below
          if (w.isHero && frame >= HERO_GROWTH_START) return null;
          return (
            <img
              key={i}
              src={staticFile("icons/angel-halo.svg")}
              style={{
                position: "absolute",
                left: w.x - WING_SIZE / 2,
                top: w.y - WING_SIZE / 2,
                width: WING_SIZE,
                height: WING_SIZE,
                opacity: w.opacity,
                transform: `scale(${w.scale * w.flap.scaleX}, ${w.scale * w.flap.scaleY}) rotate(${w.rotation}deg)`,
                transformOrigin: "center center",
                pointerEvents: "none",
                zIndex: 300,
                objectFit: "contain",
              }}
            />
          );
        })}

      {/* Step 9c: Hero wing growth (f330–f369) */}
      {frame >= HERO_GROWTH_START &&
        frame <= HERO_GROWTH_END &&
        (() => {
          const heroFlapLocal = frame - WING_EMIT + HERO_INDEX * 3;
          const heroFlap = getFlap(heroFlapLocal);
          const hfsx = heroGrowthScale * heroFlap.scaleX;
          const hfsy = heroGrowthScale * heroFlap.scaleY;
          return (
            <img
              src={staticFile("icons/angel-halo.svg")}
              style={{
                position: "absolute",
                left: heroGrowthX - (WING_SIZE * hfsx) / 2,
                top: heroGrowthY - (WING_SIZE * hfsy) / 2,
                width: WING_SIZE * hfsx,
                height: WING_SIZE * hfsy,
                opacity: 1,
                transform: `rotate(${heroGrowthRot}deg)`,
                transformOrigin: "center center",
                pointerEvents: "none",
                zIndex: 400,
                objectFit: "contain",
              }}
            />
          );
        })()}

      {/* Step 9c: White wipe overlay (f360–f369) */}
      {frame >= 360 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "#FFFFFF",
            opacity: heroWipeOpacity,
            zIndex: 500,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
