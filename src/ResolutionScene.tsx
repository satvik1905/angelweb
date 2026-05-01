import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const ORBS = [
  { id: "budget", label: "Budget Constraints", x: 480,  hitFrame: 30 },
  { id: "dates",  label: "Date Issues",        x: 880,  hitFrame: 50 },
  { id: "pets",   label: "Pet Care",           x: 1280, hitFrame: 70 },
  { id: "work",   label: "Work Conflict",      x: 1680, hitFrame: 90 },
];

const ANGEL_START_X = -150;
const ANGEL_END_X   = 2070;
const ANGEL_Y       = 540;

// ─────────────────────────────────────────────────────────────────────────────
// Camera shake on impacts
// ─────────────────────────────────────────────────────────────────────────────
function getCameraShake(frame: number): { shakeX: number; shakeY: number } {
  let shakeX = 0;
  let shakeY = 0;
  for (const orb of ORBS) {
    const local = frame - orb.hitFrame;
    if (local >= 0 && local <= 8) {
      const intensity = Math.max(0, 1 - local / 8);
      shakeX += Math.sin(local * 4) * 14 * intensity;
      shakeY += Math.cos(local * 5) * 10 * intensity;
    }
  }
  return { shakeX, shakeY };
}

// ─────────────────────────────────────────────────────────────────────────────
// ShatterFragments
// ─────────────────────────────────────────────────────────────────────────────
function ShatterFragments({
  centerX,
  centerY,
  timeSinceHit,
}: {
  centerX: number;
  centerY: number;
  timeSinceHit: number;
}) {
  const FRAGMENTS = 12;
  return (
    <>
      {[...Array(FRAGMENTS)].map((_, i) => {
        const angle = (i / FRAGMENTS) * Math.PI * 2 + (i % 2) * 0.3;
        const speed = 7 + (i % 3) * 2;
        const dist = timeSinceHit * speed;
        const x = centerX + Math.cos(angle) * dist;
        const y =
          centerY +
          Math.sin(angle) * dist +
          timeSinceHit * timeSinceHit * 0.2;
        const opacity = Math.max(0, 1 - timeSinceHit / 25);
        const rotation = timeSinceHit * (10 + i);
        const size = 24 + (i % 4) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size * 0.6,
              background:
                i % 2 === 0
                  ? "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(244,114,182,0.6))"
                  : "linear-gradient(135deg, rgba(251,113,133,0.6), rgba(255,255,255,0.4))",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.3)",
              opacity,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 12px rgba(244,114,182,0.4)",
              pointerEvents: "none",
              zIndex: 60,
            }}
          />
        );
      })}

      {/* Central impact flash */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9), rgba(244,114,182,0.5), transparent)",
          opacity: Math.max(0, 1 - timeSinceHit / 12),
          transform: `translate(-50%, -50%) scale(${1 + timeSinceHit / 8})`,
          pointerEvents: "none",
          zIndex: 55,
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResolvedBadge
// ─────────────────────────────────────────────────────────────────────────────
function ResolvedBadge({
  x,
  y,
  appearProgress,
}: {
  x: number;
  y: number;
  appearProgress: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.8 + appearProgress * 0.2})`,
        opacity: appearProgress,
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FB923C, #F472B6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 32,
        fontWeight: 700,
        boxShadow: "0 0 40px rgba(244,114,182,0.6)",
        zIndex: 40,
      }}
    >
      ✓
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResolutionScene — 150 frames (5s)
// ─────────────────────────────────────────────────────────────────────────────
export default function ResolutionScene() {
  const frame = useCurrentFrame();

  const { shakeX, shakeY } = getCameraShake(frame);

  // ── Angel position ───────────────────────────────────────────────────────
  const angelX = interpolate(frame, [15, 110], [ANGEL_START_X, ANGEL_END_X], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Angel rotation — 3 full rotations during roll ───────────────────────
  const angelRotation = interpolate(frame, [15, 110], [0, 1080], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Angel squash on each impact ──────────────────────────────────────────
  let squashAmount = 0;
  for (const orb of ORBS) {
    if (frame >= orb.hitFrame - 2 && frame <= orb.hitFrame + 4) {
      const local = Math.abs(frame - orb.hitFrame);
      squashAmount = Math.max(squashAmount, 1 - local / 4);
    }
  }
  const squashScaleX = 1 + squashAmount * 0.2;
  const squashScaleY = 1 - squashAmount * 0.2;

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>

      {/* Shake wrapper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Bottom ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.15), transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Trail ghosts */}
        {[1, 2, 3, 4, 5, 6].map((i) => {
          const trailFrame = Math.max(0, frame - i * 2);
          const trailX = interpolate(
            trailFrame,
            [15, 110],
            [ANGEL_START_X, ANGEL_END_X],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );
          const trailOpacity = (1 - i / 6) * 0.4;
          const trailSize = 100 - i * 8;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: trailX,
                top: ANGEL_Y,
                width: trailSize,
                height: trailSize,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,180,210,0.6), transparent)",
                filter: "blur(8px)",
                opacity: trailOpacity,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Orbs, shatter, resolved badges */}
        {ORBS.map((orb, i) => {
          const orbEntry = interpolate(
            frame,
            [15 + i * 3, 25 + i * 3],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );
          const beforeHit = frame < orb.hitFrame;
          const timeSinceHit = Math.max(0, frame - orb.hitFrame);

          return (
            <React.Fragment key={orb.id}>
              {beforeHit && (
                <>
                  {/* Orb body */}
                  <div
                    style={{
                      position: "absolute",
                      left: orb.x,
                      top: ANGEL_Y,
                      width: 110,
                      height: 110,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 30% 30%, #f8f8fc, #c8c8d2, #6a6a72)",
                      boxShadow:
                        "0 0 40px rgba(200,200,210,0.35), inset 0 1px 4px rgba(255,255,255,0.5), inset 0 -8px 16px rgba(0,0,0,0.4)",
                      transform: "translate(-50%, -50%)",
                      opacity: orbEntry,
                      zIndex: 30,
                    }}
                  />

                  {/* Label below orb */}
                  <div
                    style={{
                      position: "absolute",
                      left: orb.x,
                      top: ANGEL_Y + 80,
                      transform: "translate(-50%, 0)",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 16,
                      fontWeight: 500,
                      textShadow: "0 2px 12px rgba(0,0,0,0.95)",
                      opacity: orbEntry,
                      whiteSpace: "nowrap",
                      zIndex: 35,
                    }}
                  >
                    {orb.label}
                  </div>
                </>
              )}

              {timeSinceHit > 0 && timeSinceHit <= 25 && (
                <ShatterFragments
                  centerX={orb.x}
                  centerY={ANGEL_Y}
                  timeSinceHit={timeSinceHit}
                />
              )}

              {timeSinceHit > 18 && (
                <ResolvedBadge
                  x={orb.x}
                  y={ANGEL_Y}
                  appearProgress={Math.min(1, (timeSinceHit - 18) / 12)}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Angel icon */}
        <img
          src={staticFile("Avatar.svg")}
          style={{
            position: "absolute",
            left: angelX,
            top: ANGEL_Y,
            width: 120,
            height: 120,
            transform: `translate(-50%, -50%) rotate(${angelRotation}deg) scale(${squashScaleX}, ${squashScaleY})`,
            transformOrigin: "center center",
            zIndex: 50,
            filter: "drop-shadow(0 0 30px rgba(244,114,182,0.6))",
          }}
        />
      </div>
      {/* end shake wrapper */}

      {/* Vignette — outside shake */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 90%)",
          pointerEvents: "none",
          zIndex: 90,
        }}
      />

      {/* Final fade to black (130–150) */}
      {frame >= 130 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [130, 150], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
