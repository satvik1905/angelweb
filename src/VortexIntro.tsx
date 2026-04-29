import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// TIMING  (frames at 60 fps — 240 total = 4 s)
//
//  Phase 1 · Gathering    0  →  90   icons spring into orbit, staggered 8f each
//  Phase 2 · Vortex      90  → 150   radius 300→0, rotation 0→1440°, blur, fade
//  Phase 3 · Singularity 150 → 168   white circle pulse (spring, underdamped)
//  Phase 4 · Explosion   168 → 190   circle scales 50×, white flash fades
//  Phase 5 · Hero        185 → 240   text + icon snap in
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  gatherStagger:     8,   // frames between each icon's entrance
  vortexStart:      90,
  vortexEnd:       150,
  vortexFadeEnd:   145,   // icons fully gone slightly before radius hits 0
  singularityStart:150,
  explosionStart:  168,
  explosionEnd:    180,
  flashFadeEnd:    190,
  heroStart:       185,
} as const;

const ORBIT_RADIUS     = 300; // px — radius of the gathering circle
const ICON_SIZE        = 72;  // px — each orbit icon
const SINGULARITY_SIZE = 80;  // px — base diameter of the white circle
const VORTEX_SPINS     = 4;   // full rotations during vortex phase (= 1440°)

// ─────────────────────────────────────────────────────────────────────────────
// DATA  — swap filenames here, order sets the circle positions
// ─────────────────────────────────────────────────────────────────────────────
const ORBIT_ICONS: string[] = [
  "map-light-full.svg",
  "users-regular-full.svg",
  "badge-dollar-light-full.svg",
  "ferris-wheel-light-full.svg",
  "ticket-light-full.svg",
  "wallet-regular-full.svg",
];

/** Hero icon that reveals after the explosion */
const HERO_ICON = "hotel-light-full.svg";

// ─────────────────────────────────────────────────────────────────────────────
// MaskIcon — pure-white icon using CSS mask-image (no SVG colour dependency)
// ─────────────────────────────────────────────────────────────────────────────
const MaskIcon: React.FC<{ file: string; size: number }> = ({ file, size }) => {
  const url = staticFile(`icons/${file}`);
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: "#FFFFFF",
        WebkitMaskImage: `url("${url}")`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url("${url}")`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OrbitIcon — single icon on the gathering circle
// ─────────────────────────────────────────────────────────────────────────────
const OrbitIcon: React.FC<{ index: number; file: string }> = ({
  index,
  file,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const gatherDelay = index * T.gatherStagger;

  // ── Phase 1: spring entrance ───────────────────────────────────────────────
  const gatherS = spring({
    frame: frame - gatherDelay,
    fps,
    config: { stiffness: 120, damping: 18, mass: 1 },
    from: 0,
    to: 1,
  });
  // Icon scales in and travels from centre to ORBIT_RADIUS
  const iconScale    = gatherS;
  const gatherRadius = interpolate(gatherS, [0, 1], [0, ORBIT_RADIUS]);

  // ── Phase 2: vortex ────────────────────────────────────────────────────────
  // Use interpolate (not spring) as specified
  const vortexT = interpolate(
    frame,
    [T.vortexStart, T.vortexEnd],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const vortexRadius   = interpolate(vortexT, [0, 1], [ORBIT_RADIUS, 0]);
  const vortexRotation = interpolate(
    vortexT,
    [0, 1],
    [0, VORTEX_SPINS * 2 * Math.PI]   // 1440° in radians
  );
  const blur = interpolate(vortexT, [0, 1], [0, 20]);

  // Unified radius / rotation across phases
  const radius   = frame < T.vortexStart ? gatherRadius   : vortexRadius;
  const rotation = frame < T.vortexStart ? 0              : vortexRotation;

  // ── Opacity: fade in on gather, fade out on vortex ─────────────────────────
  const entryOpacity = interpolate(gatherS, [0, 0.1, 1], [0, 0, 1]);
  const vortexOpacity = interpolate(
    frame,
    [T.vortexStart, T.vortexFadeEnd],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(entryOpacity, vortexOpacity);

  // ── Position ───────────────────────────────────────────────────────────────
  const baseAngle = (index / ORBIT_ICONS.length) * 2 * Math.PI;
  const angle     = baseAngle + rotation;
  const ox        = Math.cos(angle) * radius;
  const oy        = Math.sin(angle) * radius;

  const left = width  / 2 + ox - ICON_SIZE / 2;
  const top  = height / 2 + oy - ICON_SIZE / 2;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: ICON_SIZE,
        height: ICON_SIZE,
        opacity,
        filter: `blur(${blur}px)`,
        transform: `scale(${iconScale})`,
      }}
    >
      <MaskIcon file={file} size={ICON_SIZE} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SingularityBurst — white circle: pulse → explosion → flash fade
// ─────────────────────────────────────────────────────────────────────────────
const SingularityBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 3 — underdamped spring → overshoots ~1.45 before settling at 1.2
  // This is the "pulse" effect
  const pulseS = spring({
    frame: frame - T.singularityStart,
    fps,
    config: { stiffness: 250, damping: 10, mass: 0.5 },
    from: 0,
    to: 1.2,
  });

  // Phase 4 — hard interpolate 1.2 → 50× (covers 1080 px wide at 50×80 = 4000 px)
  const explosionScale = interpolate(
    frame,
    [T.explosionStart, T.explosionEnd],
    [1.2, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const circleScale = frame < T.explosionStart ? pulseS : explosionScale;

  // Opacity: full through explosion peak, fades to 0 by frame 190
  const opacity = interpolate(
    frame,
    [T.explosionEnd, T.flashFadeEnd],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: SINGULARITY_SIZE,
        height: SINGULARITY_SIZE,
        marginLeft: -SINGULARITY_SIZE / 2,
        marginTop:  -SINGULARITY_SIZE / 2,
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        transform: `scale(${circleScale})`,
        opacity,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HeroReveal — icon + text snap in through the receding white flash
// Spring spec: mass 0.5, stiffness 200, damping 10  (sharp, snappy, slight
// overshoot — the hero "clicks" into place)
// ─────────────────────────────────────────────────────────────────────────────
const HeroReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - T.heroStart,
    fps,
    config: { mass: 0.5, stiffness: 200, damping: 10 },
    from: 0,
    to: 1,
  });

  const scale   = interpolate(s, [0, 1], [0.75, 1]);
  const opacity = interpolate(s, [0, 0.06, 1], [0, 0, 1]);
  const y       = interpolate(s, [0, 1], [38, 0]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Single transform wrapper so icon + text move as one unit */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          transform: `translateY(${y}px) scale(${scale})`,
          opacity,
        }}
      >
        <MaskIcon file={HERO_ICON} size={128} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.48)",
              fontSize: 16,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
              fontWeight: 300,
              letterSpacing: "0.46em",
              textTransform: "uppercase",
            }}
          >
            Introducing
          </span>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 62,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Angel Mode
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VortexIntro — main composition
//
// Render order (bottom → top):
//   1. Orbit icons       (phases 1–2, become invisible by frame ~145)
//   2. SingularityBurst  (phases 3–4, white circle + flash)
//   3. HeroReveal        (phase 5, appears through receding flash)
// ─────────────────────────────────────────────────────────────────────────────
export const VortexIntro: React.FC = () => (
  <AbsoluteFill style={{ background: "#000000" }}>
    {ORBIT_ICONS.map((file, i) => (
      <OrbitIcon key={file} index={i} file={file} />
    ))}

    <SingularityBurst />

    <HeroReveal />
  </AbsoluteFill>
);
