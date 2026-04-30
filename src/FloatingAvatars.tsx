import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const ORBS = [
  { seed: 0, label: "Budget Constraints", size: 140, depth: 1.0 },
  { seed: 1, label: "Dates Don't Work",   size: 120, depth: 0.8 },
  { seed: 2, label: "Too Far",            size: 150, depth: 0.9 },
  { seed: 3, label: "Need Own Room",      size: 115, depth: 0.6 },
  { seed: 4, label: "Flight Costs",       size: 130, depth: 0.7 },
  { seed: 5, label: "Work Conflict",      size: 145, depth: 0.85 },
  { seed: 6, label: "Visa Issues",        size: 118, depth: 0.5 },
  { seed: 7, label: "Pet Care",           size: 125, depth: 0.75 },
];

const BASE_POSITIONS = [
  { x: 960 - 220, y: 490 - 80  },  // left
  { x: 960 - 160, y: 490 + 100 },  // bottom left
  { x: 960 + 200, y: 490 - 60  },  // right
  { x: 960 + 140, y: 490 + 110 },  // bottom right
  { x: 960 - 30,  y: 490 - 180 },  // top center
  { x: 960 + 80,  y: 490 - 120 },  // top right
  { x: 960 - 100, y: 490 + 180 },  // bottom
  { x: 960 + 260, y: 490 + 60  },  // far right
];

const HIT_FRAME   = 90;
const HIT_FRAME_2 = 130;
const ANGEL_X     = 960;
const ANGEL_Y     = 490;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FloatingAvatars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame / fps;

  // ── Orb 0 collision (hits at frame 90) ──────────────────────────────────
  const frozen0T = 60 / fps;
  const frozen0X = BASE_POSITIONS[0].x + Math.sin(frozen0T * 0.3) * 8;
  const frozen0Y = BASE_POSITIONS[0].y + Math.cos(frozen0T * 0.3 * 0.7) * 6;

  const rushProgress0 = interpolate(frame, [60, HIT_FRAME], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity0 = interpolate(frame, [60, 72], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const burstProgress0 = interpolate(frame, [HIT_FRAME, 115], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Orb 1 collision (hits at frame 130) ──────────────────────────────────
  const frozen1T = 100 / fps;
  const seed1 = ORBS[1].seed;
  const frozen1X =
    BASE_POSITIONS[seed1].x +
    Math.sin(frozen1T * (0.3 + seed1 * 0.08) + seed1 * 1.1) * (8 + seed1 * 2);
  const frozen1Y =
    BASE_POSITIONS[seed1].y +
    Math.cos(frozen1T * (0.3 + seed1 * 0.08) * 0.7 + seed1 * 1.1) *
      (6 + seed1 * 1.5);

  const rushProgress1 = interpolate(frame, [100, HIT_FRAME_2], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity1 = interpolate(frame, [100, 112], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const burstProgress1 = interpolate(frame, [HIT_FRAME_2, 155], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Burst particles — orb 0 */}
      {frame >= HIT_FRAME &&
        frame <= 115 &&
        [...Array(12)].map((_, p) => {
          const angle = (p / 12) * Math.PI * 2;
          const dist = burstProgress0 * 220;
          const size = interpolate(burstProgress0, [0, 0.3, 1], [28, 22, 6]);
          const particleOpacity = interpolate(
            burstProgress0,
            [0, 0.15, 0.7, 1],
            [0, 1, 0.9, 0],
          );
          return (
            <div
              key={p}
              style={{
                position: "absolute",
                left: ANGEL_X + Math.cos(angle) * dist,
                top: ANGEL_Y + Math.sin(angle) * dist,
                width: size,
                height: size,
                borderRadius: "50%",
                background: p % 2 === 0
                  ? "radial-gradient(circle, #ffffff, #FB923C)"
                  : "radial-gradient(circle, #ffffff, #F472B6)",
                opacity: particleOpacity,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 ${size * 2}px rgba(251,113,133,0.8)`,
                pointerEvents: "none",
              }}
            />
          );
        })}

      {/* Central flash — orb 0 impact */}
      {frame >= HIT_FRAME && frame <= 100 && (
        <div
          style={{
            position: "absolute",
            left: ANGEL_X,
            top: ANGEL_Y,
            width: interpolate(frame, [90, 100], [20, 180], { extrapolateRight: "clamp" }),
            height: interpolate(frame, [90, 100], [20, 180], { extrapolateRight: "clamp" }),
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(251,113,133,0.4), transparent)",
            opacity: interpolate(frame, [90, 95, 100], [1, 0.8, 0], { extrapolateRight: "clamp" }),
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Burst particles — orb 1 */}
      {frame >= HIT_FRAME_2 &&
        frame <= 155 &&
        [...Array(12)].map((_, p) => {
          const angle = (p / 12) * Math.PI * 2;
          const dist = burstProgress1 * 220;
          const size = interpolate(burstProgress1, [0, 0.3, 1], [28, 22, 6]);
          const particleOpacity = interpolate(
            burstProgress1,
            [0, 0.15, 0.7, 1],
            [0, 1, 0.9, 0],
          );
          return (
            <div
              key={p}
              style={{
                position: "absolute",
                left: ANGEL_X + Math.cos(angle) * dist,
                top: ANGEL_Y + Math.sin(angle) * dist,
                width: size,
                height: size,
                borderRadius: "50%",
                background: p % 2 === 0
                  ? "radial-gradient(circle, #ffffff, #FB923C)"
                  : "radial-gradient(circle, #ffffff, #F472B6)",
                opacity: particleOpacity,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 ${size * 2}px rgba(251,113,133,0.8)`,
                pointerEvents: "none",
              }}
            />
          );
        })}

      {/* Central flash — orb 1 impact */}
      {frame >= HIT_FRAME_2 && frame <= 140 && (
        <div
          style={{
            position: "absolute",
            left: ANGEL_X,
            top: ANGEL_Y,
            width: interpolate(frame, [130, 140], [20, 180], { extrapolateRight: "clamp" }),
            height: interpolate(frame, [130, 140], [20, 180], { extrapolateRight: "clamp" }),
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(251,113,133,0.4), transparent)",
            opacity: interpolate(frame, [130, 135, 140], [1, 0.8, 0], { extrapolateRight: "clamp" }),
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}

      {ORBS.map((orb, i) => {
        const speed  = 0.3 + orb.seed * 0.08;
        const orbitX = 8 + orb.seed * 3;
        const orbitY = 6 + orb.seed * 2;
        const phase  = orb.seed * 1.1;

        const floatX = BASE_POSITIONS[orb.seed].x + Math.sin(t * speed + phase) * orbitX;
        const floatY = BASE_POSITIONS[orb.seed].y + Math.cos(t * speed * 0.7 + phase) * orbitY;

        // Collision treatment
        if (i === 0 && frame >= HIT_FRAME)   return null;
        if (i === 1 && frame >= HIT_FRAME_2) return null;

        const x =
          i === 0 && frame >= 60
            ? lerp(frozen0X, ANGEL_X, rushProgress0)
            : i === 1 && frame >= 100
              ? lerp(frozen1X, ANGEL_X, rushProgress1)
              : floatX;

        const y =
          i === 0 && frame >= 60
            ? lerp(frozen0Y, ANGEL_Y, rushProgress0)
            : i === 1 && frame >= 100
              ? lerp(frozen1Y, ANGEL_Y, rushProgress1)
              : floatY;

        const labelOp = i === 0 ? labelOpacity0 : i === 1 ? labelOpacity1 : 1;

        // Staggered entrance
        const enterStart = i * 4;
        const enterEnd   = enterStart + 20;

        const entranceScale = interpolate(frame, [enterStart, enterEnd], [0, 1], {
          easing: Easing.out(Easing.back(1.2)),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const entranceOpacity = interpolate(frame, [enterStart, enterEnd], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const blurAmount = (1 - orb.depth) * 6;
        const orbOpacity = 0.55 + orb.depth * 0.35;

        return (
          <div
            key={orb.seed}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${entranceScale})`,
              opacity: entranceOpacity,
              width: orb.size,
              height: orb.size,
              overflow: "visible",
            }}
          >
            {/* Orb sphere */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: orb.size,
                height: orb.size,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(200,190,205,0.5), rgba(140,120,140,0.25))",
                filter: `blur(${blurAmount}px)`,
                opacity: orbOpacity,
                boxShadow: `0 0 ${orb.size * 0.4}px rgba(251,113,133,${orb.depth * 0.25})`,
                overflow: "hidden",
              }}
            >
              {/* Glassy shine */}
              <div
                style={{
                  position: "absolute",
                  top: "8%",
                  left: "12%",
                  width: "45%",
                  height: "40%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0))",
                  filter: "blur(2px)",
                }}
              />
            </div>

            {/* Label — plain white text, no pill */}
            <div
              style={{
                position: "absolute",
                left: orb.size * 0.9,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                fontSize: 18,
                fontWeight: 500,
                whiteSpace: "nowrap",
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                letterSpacing: "-0.01em",
                opacity: labelOp * orbOpacity,
                pointerEvents: "none",
              }}
            >
              {orb.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default FloatingAvatars;
