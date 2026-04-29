import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// TIMING  ·  all values derived from seconds × 60fps
// ─────────────────────────────────────────────────────────────────────────────
//
//   Phase 1 · Gathering     0  →  72   (0.0 s → 1.2 s)
//   Phase 2 · Vortex       72  → 150   (1.2 s → 2.5 s)
//   Phase 3 · Singularity  150 → 168   (2.5 s → 2.8 s)
//   Phase 4 · Blast        168 → 186   (2.8 s → 3.1 s)
//   Phase 5 · Hero         186 → 240   (3.1 s → 4.0 s)
//
const F = {
  gatherStagger:     6,   // frames between each icon's entry spring

  vortexStart:      72,   // 1.2 s
  vortexEnd:       150,   // 2.5 s

  singularityStart: 150,  // 2.5 s — dot appears

  blastStart:       168,  // 2.8 s — dot begins expanding
  blastPeak:        180,  // 3.0 s — maximum scale, then fades
  blastFadeEnd:     186,  // 3.1 s — fully transparent

  // Hero starts exactly at blast peak so it emerges through the gradient flash
  heroStart:        180,  // 3.0 s — hero snaps in as blast hits max scale
} as const;

const ORBIT_RADIUS = 350; // px  — radius of the gathering circle
const ICON_SIZE    = 72;  // px  — each icon square
const DOT_SIZE     = 4;   // px  — singularity dot diameter

// Blast must cover the full 1080×1920 canvas from a 4 px base.
// Canvas corner distance from centre = √(540² + 960²) ≈ 1101 px.
// Needed scale = 1101 / (DOT_SIZE / 2) = 1101 / 2 = 551 → use 600 for margin.
const BLAST_MAX_SCALE = 600;

// ─────────────────────────────────────────────────────────────────────────────
// DATA  ·  swap file names here to change any icon
// ─────────────────────────────────────────────────────────────────────────────
const ICONS: { file: string; label: string }[] = [
  { file: "hotel-light-full.svg",        label: "Hotels"     },
  { file: "ticket-light-full.svg",       label: "Flights"    },
  { file: "badge-dollar-light-full.svg", label: "Budget"     },
  { file: "ferris-wheel-light-full.svg", label: "Activities" },
  { file: "map-light-full.svg",          label: "Explore"    },
  { file: "users-regular-full.svg",      label: "Groups"     },
];


// ─────────────────────────────────────────────────────────────────────────────
// MaskIcon  ·  pure-white icon via CSS mask (color-swappable via backgroundColor)
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
// OrbitIcon  ·  one icon on the gathering circle (handles phases 1 & 2)
// ─────────────────────────────────────────────────────────────────────────────
const OrbitIcon: React.FC<{ index: number; file: string }> = ({
  index,
  file,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const gatherDelay = index * F.gatherStagger; // 0, 6, 12, 18, 24, 30

  // ── Phase 1: spring pop-in ─────────────────────────────────────────────────
  const entryS = spring({
    frame: frame - gatherDelay,
    fps,
    config: { stiffness: 200, damping: 16, mass: 0.8 },
    from: 0,
    to: 1,
  });

  // ── Phase 2: vortex — all driven by interpolate ────────────────────────────
  const vT = interpolate(frame, [F.vortexStart, F.vortexEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const radius   = frame < F.vortexStart
    ? ORBIT_RADIUS
    : interpolate(vT, [0, 1], [ORBIT_RADIUS, 0]);

  // 1080° = 3 full rotations = 6π radians
  const rotation = frame < F.vortexStart
    ? 0
    : interpolate(vT, [0, 1], [0, 6 * Math.PI]);

  // Blur accelerates toward the end (eased via squared t)
  const blur = frame < F.vortexStart
    ? 0
    : interpolate(vT * vT, [0, 1], [0, 28]);

  const scale = frame < F.vortexStart
    ? entryS
    : interpolate(vT, [0, 1], [1, 0]);

  const opacity = frame < F.vortexStart
    ? interpolate(entryS, [0, 0.1, 1], [0, 0, 1])
    : interpolate(vT, [0, 0.8, 1], [1, 0.1, 0]);

  // ── Position ──────────────────────────────────────────────────────────────
  const baseAngle = (index / ICONS.length) * 2 * Math.PI;
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
        transform: `scale(${scale})`,
      }}
    >
      <MaskIcon file={file} size={ICON_SIZE} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SingularityDot  ·  4px white circle → pulse (phase 3) → screen-filling
//                    white blast (phase 4)
// ─────────────────────────────────────────────────────────────────────────────
const SingularityDot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 3: sharply underdamped spring → visible overshoot "pulse"
  // (ζ ≈ 0.26 → overshoots to ~1.7× before settling at 1.0)
  const pulseS = spring({
    frame: frame - F.singularityStart,
    fps,
    config: { stiffness: 320, damping: 8, mass: 0.3 },
    from: 0,
    to: 1,
  });

  // Phase 4: fast ramp to BLAST_MAX_SCALE over 12 frames
  const blastScale = interpolate(
    frame,
    [F.blastStart, F.blastPeak],
    [1, BLAST_MAX_SCALE],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = frame < F.blastStart ? pulseS : blastScale;

  // Opacity: tied to pulse during phase 3, then fades post-peak
  const blastOpacity = interpolate(
    frame,
    [F.blastPeak, F.blastFadeEnd],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity =
    frame < F.blastStart
      ? interpolate(pulseS, [0, 0.05, 1], [0, 0, 1])
      : blastOpacity;

  // Blur only applies during the blast so colours bleed like light energy.
  // The singularity pulse (phase 3) keeps the dot sharp and glowing.
  const blastBlur = frame >= F.blastStart ? "blur(30px)" : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width:  DOT_SIZE,
        height: DOT_SIZE,
        marginLeft: -(DOT_SIZE / 2),
        marginTop:  -(DOT_SIZE / 2),
        borderRadius: "50%",
        // Radial gradient: orange core → pink mid → fuchsia edge
        background:
          "radial-gradient(circle, #FB923C 0%, #FB7185 50%, #F472B6 100%)",
        filter: blastBlur,
        transform: `scale(${scale})`,
        opacity,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HeroReveal  ·  Avatar + staggered text (phase 5, from F.heroStart)
//
// Layout (top → bottom):
//   Avatar  — springs in, breathes via Math.sin, soft blur + drop-shadow
//   "Introducing"  — secondary label, springs in 4 frames after Avatar
//   "Angel Mode"   — hero title, springs in same frame as Avatar
//
// All springs share stiffness 250 / damping 15.
// ─────────────────────────────────────────────────────────────────────────────
const HERO_SPRING = { stiffness: 250, damping: 15 } as const;

const HeroReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Avatar spring (frame 0 of hero phase) ─────────────────────────────────
  const avatarS = spring({
    frame: frame - F.heroStart,
    fps,
    config: HERO_SPRING,
    from: 0,
    to: 1,
  });

  // ── "Angel Mode" spring — same frame as Avatar ────────────────────────────
  const angelS = spring({
    frame: frame - F.heroStart,
    fps,
    config: HERO_SPRING,
    from: 0,
    to: 1,
  });

  // ── "Introducing" spring — staggered 4 frames later ──────────────────────
  const introS = spring({
    frame: frame - (F.heroStart + 4),
    fps,
    config: HERO_SPRING,
    from: 0,
    to: 1,
  });

  // Shared helpers: Y entrance (40px → 0) and opacity gating
  const makeY       = (s: number) => interpolate(s, [0, 1], [40, 0]);
  const makeOpacity = (s: number) => interpolate(s, [0, 0.05, 1], [0, 0, 1]);

  // ── Avatar breathing: Math.sin(frame / 15), scale 1.0 ↔ 1.05 ─────────────
  const breathe     = 1.025 + 0.025 * Math.sin(frame / 15);
  const avatarScale = avatarS * breathe;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Sits above blast and orbit layers via DOM order (rendered last)
      }}
    >
      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          transform: `translateY(${makeY(avatarS)}px) scale(${avatarScale})`,
          opacity: makeOpacity(avatarS),
          filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
          marginBottom: 28,
        }}
      >
        <Img
          src={staticFile("Avatar.SVG")}
          style={{ width: 220, height: 220, objectFit: "contain" }}
        />
      </div>

      {/* ── "Introducing" label ────────────────────────────────────────────── */}
      <div
        style={{
          transform: `translateY(${makeY(introS)}px)`,
          opacity: makeOpacity(introS),
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 32,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.06em",
          }}
        >
          Introducing
        </span>
      </div>

      {/* ── "Angel Mode" hero title ────────────────────────────────────────── */}
      <div
        style={{
          transform: `translateY(${makeY(angelS)}px)`,
          opacity: makeOpacity(angelS),
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 90,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
          }}
        >
          Angel Mode
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VortexBlast  ·  main composition
//
// Render order (bottom → top):
//   OrbitIcons      — visible frames 0–150
//   SingularityDot  — visible frames 150–186
//   HeroReveal      — visible frames 186–240
//
// Each layer is opacity-0 until its phase, so render order never causes
// visible overlap outside intended transition windows.
// ─────────────────────────────────────────────────────────────────────────────
export const VortexBlast: React.FC = () => (
  <AbsoluteFill style={{ background: "#000000" }}>
    {ICONS.map((icon, i) => (
      <OrbitIcon key={icon.file} index={i} file={icon.file} />
    ))}

    <SingularityDot />

    <HeroReveal />
  </AbsoluteFill>
);
