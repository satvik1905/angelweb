import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig } from "remotion";

const ORBS = [
  { id: 1, label: "Budget Constraints", size: 80, depth: 1.0, seed: 0 },
  { id: 2, label: "Dates Don't Work",   size: 65, depth: 0.6, seed: 1 },
  { id: 3, label: "Too Far",            size: 90, depth: 0.9, seed: 2 },
  { id: 4, label: "Need Own Room",      size: 55, depth: 0.4, seed: 3 },
  { id: 5, label: "Flight Costs",       size: 70, depth: 0.7, seed: 4 },
  { id: 6, label: "Work Conflict",      size: 85, depth: 0.5, seed: 5 },
  { id: 7, label: "Visa Issues",        size: 60, depth: 0.8, seed: 6 },
  { id: 8, label: "Pet Care",           size: 75, depth: 0.3, seed: 7 },
];

const BASE_POSITIONS = [
  { x: 0.28, y: 0.28 },
  { x: 0.55, y: 0.18 },
  { x: 0.72, y: 0.25 },
  { x: 0.20, y: 0.48 },
  { x: 0.75, y: 0.52 },
  { x: 0.30, y: 0.65 },
  { x: 0.58, y: 0.68 },
  { x: 0.70, y: 0.62 },
];

const FloatingAvatars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame / fps;

  return (
    <AbsoluteFill>
      {ORBS.map((orb, i) => {
        // Floating orbit
        const speed  = 0.3 + orb.seed * 0.08;
        const orbitX = 15 + orb.seed * 5;
        const orbitY = 10 + orb.seed * 3;
        const phase  = orb.seed * 1.1;

        const x = BASE_POSITIONS[orb.seed].x * 1920 + Math.sin(t * speed + phase) * orbitX;
        const y = BASE_POSITIONS[orb.seed].y * 1080 + Math.cos(t * speed * 0.7 + phase) * orbitY;

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

        // Depth-driven visuals
        const blurAmount = (1 - orb.depth) * 14;
        const orbOpacity = 0.25 + orb.depth * 0.75;
        const glowSize   = orb.size * 0.3;

        return (
          <div
            key={orb.id}
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
            {/* Label pill — left side, overlapping the orb */}
            <div
              style={{
                position: "absolute",
                right: orb.size * 0.35,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(15, 15, 15, 0.82)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 16,
                fontWeight: 500,
                padding: "8px 20px",
                whiteSpace: "nowrap",
                opacity: orbOpacity,
                zIndex: 2,
              }}
            >
              {orb.label}
            </div>

            {/* Avatar circle — right side */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: orb.size,
                height: orb.size,
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #ffffff, #ddd0d8, #a89aaa, #6b5f6b)",
                filter: `blur(${blurAmount}px)`,
                opacity: orbOpacity,
                boxShadow: `0 0 ${glowSize}px rgba(251, 113, 133, ${orb.depth * 0.3})`,
                overflow: "hidden",
                zIndex: 1,
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
                  background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0))",
                  filter: "blur(2px)",
                }}
              />
              {/* Bottom shadow */}
              <div
                style={{
                  position: "absolute",
                  bottom: "5%",
                  left: "15%",
                  width: "70%",
                  height: "40%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,0,0,0.35), rgba(0,0,0,0))",
                  filter: "blur(4px)",
                }}
              />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default FloatingAvatars;
