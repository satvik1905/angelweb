import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

// Material-design standard easing — accelerate out, decelerate into target
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

// ─────────────────────────────────────────────────────────────────────────────
// getBlobX — smooth per-segment motion with eased deceleration into each pill
// Holds extended to 20f per pill so each resolution feels deliberate
// ─────────────────────────────────────────────────────────────────────────────
function getBlobX(f: number): number {
  const ez = clamp({ easing: EASE });
  if (f <= 50)  return interpolate(f, [5, 50],   [100,  700],  ez); // → Budget (45f travel)
  if (f <= 70)  return 700;                                           // hold 20f
  if (f <= 97)  return interpolate(f, [70, 97],  [700,  1700], ez); // → Dates  (27f travel)
  if (f <= 117) return 1700;                                          // hold 20f
  if (f <= 144) return interpolate(f, [117, 144],[1700, 2700], ez); // → Work   (27f travel)
  if (f <= 164) return 2700;                                          // hold 20f
  return interpolate(f, [164, 186], [2700, 3500], ez);               // exit sweep (22f)
}

// ─────────────────────────────────────────────────────────────────────────────
// BlobGlow — morphing 8-point bezier aura
// ─────────────────────────────────────────────────────────────────────────────
const BlobGlow = ({
  frame,
  size = 320,
  intensity = 1,
}: {
  frame: number;
  size?: number;
  intensity?: number;
}) => {
  const numPoints = 8;
  const baseRadius = size / 2;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const freq1 = 0.025 + i * 0.003;
    const freq2 = 0.018 + i * 0.002;
    const phase = i * 0.7;
    const morph1 = Math.sin(frame * freq1 + phase) * 18;
    const morph2 = Math.sin(frame * freq2 + phase * 1.3) * 12;
    const r = baseRadius + morph1 + morph2;
    points.push({
      x: baseRadius + Math.cos(angle) * r,
      y: baseRadius + Math.sin(angle) * r,
    });
  }
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < numPoints; i++) {
    const next = points[(i + 1) % numPoints];
    const afterNext = points[(i + 2) % numPoints];
    const midX = (next.x + afterNext.x) / 2;
    const midY = (next.y + afterNext.y) / 2;
    pathD += ` Q ${next.x} ${next.y} ${midX} ${midY}`;
  }
  pathD += " Z";
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(38px)",
        opacity: intensity,
        pointerEvents: "none",
      }}
    >
      <defs>
        <radialGradient id="res-blob-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FB7185" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={pathD} fill="url(#res-blob-gradient)" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const PILLS = [
  { id: "budget", label: "Budget", worldX: 700,  arriveFrame: 50  },
  { id: "dates",  label: "Dates",  worldX: 1700, arriveFrame: 97  },
  { id: "work",   label: "Work",   worldX: 2700, arriveFrame: 144 },
];

const WORLD_WIDTH = 3200;
const BEAM_Y = 540;
const ICON_SIZE = 120;
const ICON_HALF = ICON_SIZE / 2;
// Icon's starting world X (getBlobX at frame 0 with clamp = 100)
const ICON_INITIAL_X = 100;

// ─────────────────────────────────────────────────────────────────────────────
// ResolutionScene — 255 frames (8.5s)
// ─────────────────────────────────────────────────────────────────────────────
export default function ResolutionScene() {
  const frame = useCurrentFrame();

  // ── Smooth per-segment blob position ─────────────────────────────────────
  const blobWorldX = getBlobX(frame);
  const prevBlobX  = getBlobX(Math.max(0, frame - 1));

  // ── Secondary float — sine-wave Y offset, felt not seen ──────────────────
  const floatY     = Math.sin(frame / 22) * 3;
  const prevFloatY = Math.sin(Math.max(0, frame - 1) / 22) * 3;

  // ── Tangent rotation — angle of travel direction ──────────────────────────
  const dx = blobWorldX - prevBlobX;
  const dy = floatY - prevFloatY;
  // Only rotate when actually moving (not during holds) and cap to ±8deg
  const tangentAngle = Math.abs(dx) > 0.3
    ? Math.max(-8, Math.min(8, Math.atan2(dy, dx) * (180 / Math.PI)))
    : 0;

  // ── Breathing pulse ───────────────────────────────────────────────────────
  const breathScale = 1 + Math.sin((frame / 20) * Math.PI) * 0.03;

  // ── Camera — 4× tight cold open on Angel → pull back to 2.2× travel ───────
  // Piecewise: flat hold at 4.0, then independent ease-out to 2.2
  const worldScale = frame < 30
    ? 4.0
    : interpolate(frame, [30, 60], [4.0, 2.2], {
        easing: Easing.out(Easing.cubic),
        ...clamp(),
      });
  const cameraCenterX = blobWorldX;
  const camTx = 960 - cameraCenterX * worldScale;
  const camTy = BEAM_Y - BEAM_Y * worldScale;

  // ── Icon opacity — fades in during cold open ──────────────────────────────
  const iconOpacity = interpolate(frame, [0, 10], [0, 1], clamp());

  // ── Beam ignites outward from Angel after icon is visible (~1s hold) ──────
  const beamGrow = interpolate(frame, [12, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const beamRightWidth = beamGrow * (WORLD_WIDTH - ICON_INITIAL_X);
  const beamLeftWidth  = beamGrow * ICON_INITIAL_X;

  // ── Contemplative exit — pull-back + desaturation into black ─────────────
  const exitProgress = interpolate(frame, [230, 255], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const exitScale      = 1 - exitProgress * 0.3;  // 1.0 → 0.7
  const exitSaturate   = 1 - exitProgress;          // 1.0 → 0.0
  const exitBrightness = 1 - exitProgress;          // 1.0 → 0.0

  // ── Sub-pixel icon position (translate3d, float precision) ────────────────
  const iconTx = blobWorldX - ICON_HALF;
  const iconTy = BEAM_Y - ICON_HALF + floatY;

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>

      {/* Exit wrapper — scale pull-back + desaturation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${exitScale})`,
          filter: `saturate(${exitSaturate}) brightness(${exitBrightness})`,
          transformOrigin: "50% 50%",
        }}
      >

      {/* Cinematic dark amber atmosphere */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 110%, #2a0e00 0%, #120500 45%, #000000 80%)",
          opacity: iconOpacity * 0.92,
          pointerEvents: "none",
        }}
      />

      {/* World-space wrapper */}
      <div
        style={{
          position: "absolute",
          width: WORLD_WIDTH,
          height: 1080,
          top: 0,
          left: 0,
          transform: `translateX(${camTx}px) translateY(${camTy}px) scale(${worldScale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* ── Beam right arm — grows from icon rightward ───────────────────── */}
        <div
          style={{
            position: "absolute",
            top: BEAM_Y,
            left: ICON_INITIAL_X,
            width: beamRightWidth,
            height: 3,
            background:
              "linear-gradient(90deg, #FB923C 0%, #FB7185 40%, #FB923C 80%, transparent 100%)",
            boxShadow:
              "0 0 20px rgba(251,146,60,0.9), 0 0 55px rgba(251,113,133,0.5)",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        />

        {/* ── Beam left arm — grows from icon leftward ────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: BEAM_Y,
            left: ICON_INITIAL_X - beamLeftWidth,
            width: beamLeftWidth,
            height: 3,
            background:
              "linear-gradient(270deg, #FB923C 0%, transparent 100%)",
            boxShadow:
              "0 0 20px rgba(251,146,60,0.7)",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        />

        {/* ── Beam flare at blob position ───────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: BEAM_Y,
            left: blobWorldX,
            width: 400,
            height: 3,
            transform: "translate(-50%, -50%)",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,220,180,0.8) 35%, #ffffff 50%, rgba(255,220,180,0.8) 65%, transparent 100%)",
            boxShadow:
              "0 0 18px rgba(255,210,140,0.95), 0 0 45px rgba(251,146,60,0.6)",
            opacity: iconOpacity,
            zIndex: 11,
          }}
        />

        {/* ── BlobGlow aura — centered on blob position ────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: blobWorldX,
            top: BEAM_Y,
            width: 0,
            height: 0,
            zIndex: 29,
            pointerEvents: "none",
          }}
        >
          <BlobGlow
            frame={frame}
            size={260}
            intensity={interpolate(frame, [0, 10, 203, 225], [0, 0.45, 0.45, 0], clamp())}
          />
        </div>

        {/* ── Warm ambient halo — icon emits light outward ─────────────────── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: ICON_SIZE + 20,
            height: ICON_SIZE + 20,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.25) 0%, rgba(244,114,182,0.15) 50%, transparent 100%)",
            transformOrigin: `${(ICON_SIZE + 20) / 2}px ${(ICON_SIZE + 20) / 2}px`,
            transform: `translate3d(${blobWorldX - (ICON_SIZE + 20) / 2}px, ${BEAM_Y - (ICON_SIZE + 20) / 2 + floatY}px, 0)`,
            zIndex: 33,
            pointerEvents: "none",
            opacity: iconOpacity,
          }}
        />

        {/* ── Angel icon — translate3d sub-pixel, tangent-rotated ───────────── */}
        <img
          src={staticFile("Avatar.svg")}
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: `${ICON_HALF}px ${ICON_HALF}px`,
            transform: `translate3d(${iconTx}px, ${iconTy}px, 0) rotate(${tangentAngle}deg) scale(${breathScale})`,
            zIndex: 35,
            pointerEvents: "none",
            opacity: iconOpacity,
          }}
        />

        {/* ── Pills ─────────────────────────────────────────────────────────── */}
        {PILLS.map((pill) => {
          const revealFrame = pill.arriveFrame - 15;

          const pillEntry = interpolate(
            frame,
            [revealFrame, revealFrame + 10],
            [0, 1],
            { easing: Easing.out(Easing.cubic), ...clamp() }
          );

          const sinceImpact = frame - pill.arriveFrame;
          const isIlluminated = frame >= pill.arriveFrame;

          const illuminateProgress = isIlluminated
            ? interpolate(sinceImpact, [0, 15], [0, 1], clamp())
            : 0;

          const floatPillY = Math.sin(frame / 40 + pill.worldX * 0.004) * 6;

          const textColor = isIlluminated ? "transparent" : "rgba(255,255,255,0.35)";
          const textBg = isIlluminated
            ? "linear-gradient(135deg, #FB923C, #FB7185)"
            : "none";

          const pillBorder = isIlluminated
            ? `1.5px solid rgba(251,146,60,${0.5 + illuminateProgress * 0.5})`
            : "1.5px solid rgba(255,255,255,0.2)";

          const pillGlow = isIlluminated
            ? [
                "0 0 0 4px rgba(0,0,0,0.6)",
                `0 0 ${30 + illuminateProgress * 50}px rgba(251,146,60,${0.4 * illuminateProgress})`,
                `0 0 ${20 + illuminateProgress * 30}px rgba(244,114,182,${0.4 * illuminateProgress})`,
              ].join(", ")
            : "0 0 0 4px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)";

          return (
            <div key={pill.id}>
              <div
                style={{
                  position: "absolute",
                  left: pill.worldX,
                  top: BEAM_Y + floatPillY,
                  transform: "translate(-50%, -50%)",
                  opacity: pillEntry,
                  zIndex: 25,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    padding: "14px 30px",
                    borderRadius: 40,
                    background: "#0d0d10",
                    border: pillBorder,
                    boxShadow: pillGlow,
                    whiteSpace: "nowrap",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      color: textColor,
                      backgroundImage: textBg,
                      backgroundClip: isIlluminated ? "text" : "unset",
                      WebkitBackgroundClip: isIlluminated ? "text" : "unset",
                    }}
                  >
                    {pill.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
          zIndex: 80,
        }}
      />

      </div>
      {/* end exit wrapper */}
    </AbsoluteFill>
  );
}
