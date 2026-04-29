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
// SPRING CONFIGS  — every designer knob lives here
// ─────────────────────────────────────────────────────────────────────────────
const SPRINGS = {
  /** Center hero: heavy, deliberate entrance */
  centerHero: { stiffness: 100, damping: 20, mass: 1 },
  /** Text characters: bouncy, organic */
  char: { stiffness: 200, damping: 10 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TIMING  (all in frames, comp runs at 60 fps)
// ─────────────────────────────────────────────────────────────────────────────
const TIMING = {
  centerAppear: 0, // frame center hero spring begins
  fringeAdjacent: 8, // frame adjacent cells (top/bottom/left/right) start
  fringeCorner: 18, // frame diagonal cells start
  fringeDuration: 32, // frames for the interpolate fringe-in travel
  iconDelay: 22, // frames after cell start → icon floats up
  iconDuration: 22, // frames for icon float + fade
  charDelay: 28, // frames after center appears → text chars begin
  charStagger: 3, // frames between each character
  shimmerStart: 120, // frame global light-sweep begins
  shimmerDuration: 28, // frames for sweep (high-speed)
} as const;

/** Pixels a surrounding cell travels inward during fringe-in */
const FRINGE_DISTANCE = 72;

// ─────────────────────────────────────────────────────────────────────────────
// GRID DATA  — swap SVG filenames or labels here without touching components
// ─────────────────────────────────────────────────────────────────────────────
export interface CellData {
  id: string;
  type: "icon" | "center" | "brand";
  /** [dx, dy] direction the cell originates from (-1 | 0 | 1) */
  offset: [number, number];
  icon?: { file: string; label: string };
}

export const GRID_DATA: CellData[] = [
  // ── Row 1 ─────────────────────────────────────────────────────────────────
  {
    id: "tl",
    type: "icon",
    offset: [-1, -1],
    icon: { file: "hotel-light-full.svg", label: "Hotels" },
  },
  {
    id: "tc",
    type: "icon",
    offset: [0, -1],
    icon: { file: "map-light-full.svg", label: "Destinations" },
  },
  {
    id: "tr",
    type: "icon",
    offset: [1, -1],
    icon: { file: "users-regular-full.svg", label: "Groups" },
  },
  // ── Row 2 ─────────────────────────────────────────────────────────────────
  {
    id: "ml",
    type: "icon",
    offset: [-1, 0],
    icon: { file: "badge-dollar-light-full.svg", label: "Budget" },
  },
  { id: "ct", type: "center", offset: [0, 0] },
  {
    id: "mr",
    type: "icon",
    offset: [1, 0],
    icon: { file: "ferris-wheel-light-full.svg", label: "Experiences" },
  },
  // ── Row 3 ─────────────────────────────────────────────────────────────────
  {
    id: "bl",
    type: "icon",
    offset: [-1, 1],
    icon: { file: "ticket-light-full.svg", label: "Bookings" },
  },
  {
    id: "bc",
    type: "icon",
    offset: [0, 1],
    icon: { file: "wallet-regular-full.svg", label: "Payments" },
  },
  { id: "br", type: "brand", offset: [1, 1] },
];

const HEADLINE = ["Introducing", "Angel Mode"];

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cubic ease-out — for the fringe-in position interpolation */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/** Returns the frame a surrounding cell starts its entrance */
const getCellDelay = ([dx, dy]: [number, number]): number => {
  if (dx === 0 && dy === 0) return TIMING.centerAppear;
  return dx !== 0 && dy !== 0 ? TIMING.fringeCorner : TIMING.fringeAdjacent;
};

// ─────────────────────────────────────────────────────────────────────────────
// MaskIcon  — pure-white icon via CSS mask-image (no SVG color dependency)
// ─────────────────────────────────────────────────────────────────────────────
const MaskIcon: React.FC<{ file: string; size?: number }> = ({
  file,
  size = 72,
}) => {
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
// GlobalShimmer  — single light-sweep overlay placed over the entire grid
// Using one overlay (vs per-cell) creates a true left-to-right beam that
// respects the grid layout instead of flashing all cells simultaneously.
// ─────────────────────────────────────────────────────────────────────────────
const GlobalShimmer: React.FC = () => {
  const frame = useCurrentFrame();

  const t = interpolate(
    frame,
    [TIMING.shimmerStart, TIMING.shimmerStart + TIMING.shimmerDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Stripe travels from fully off-screen-left → off-screen-right
  const leftPct = interpolate(t, [0, 1], [-40, 125]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {/* Angled shimmer stripe — skew gives a premium "light reflection" look */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          bottom: "-10%",
          left: `${leftPct}%`,
          width: "28%",
          transform: "skewX(-18deg)",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GlassCell  — base animated tile for surrounding cells
// `offset` drives the fringe-in direction via interpolate (not spring).
// ─────────────────────────────────────────────────────────────────────────────
interface GlassCellProps {
  offset: [number, number];
  children?: React.ReactNode;
  /** Optional style overrides (background, border, etc.) */
  overrideStyle?: React.CSSProperties;
}

const GlassCell: React.FC<GlassCellProps> = ({
  offset,
  children,
  overrideStyle,
}) => {
  const frame = useCurrentFrame();
  const delay = getCellDelay(offset);

  // Normalised 0→1 progress, eased
  const rawT = interpolate(
    frame,
    [delay, delay + TIMING.fringeDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const t = easeOutCubic(rawT);

  const [dx, dy] = offset;
  const translateX = (1 - t) * dx * FRINGE_DISTANCE;
  const translateY = (1 - t) * dy * FRINGE_DISTANCE;
  const scale = interpolate(t, [0, 1], [0.9, 1]);
  const opacity = interpolate(rawT, [0, 0.25, 1], [0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 32,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        // Allow callers to override visual styles (background, border)
        ...overrideStyle,
        // Animation always wins — must come after spread
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IconCell
// ─────────────────────────────────────────────────────────────────────────────
interface IconCellProps {
  offset: [number, number];
  icon: NonNullable<CellData["icon"]>;
}

const IconCell: React.FC<IconCellProps> = ({ offset, icon }) => {
  const frame = useCurrentFrame();
  const cellDelay = getCellDelay(offset);
  const iconStart = cellDelay + TIMING.iconDelay;

  // Float up 10 px + fade in
  const iconY = interpolate(
    frame,
    [iconStart, iconStart + TIMING.iconDuration],
    [10, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const iconOpacity = interpolate(
    frame,
    [iconStart, iconStart + TIMING.iconDuration - 5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <GlassCell offset={offset}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{ transform: `translateY(${iconY}px)`, opacity: iconOpacity }}
        >
          <MaskIcon file={icon.file} size={68} />
        </div>
        <span
          style={{
            opacity: iconOpacity,
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {icon.label}
        </span>
      </div>
    </GlassCell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CenterHeroCell  — spring entrance + per-character text stagger
// ─────────────────────────────────────────────────────────────────────────────
const CenterHeroCell: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - TIMING.centerAppear,
    fps,
    config: SPRINGS.centerHero,
    from: 0,
    to: 1,
  });

  const scale = interpolate(s, [0, 1], [0.8, 1.0]);
  const opacity = interpolate(s, [0, 0.08, 1], [0, 0, 1]);

  let globalCharIdx = 0;

  return (
    <div
      style={{
        // Purple/blue radial glow as specified (#4f46e5 at 10% opacity)
        background:
          "radial-gradient(ellipse at 50% 45%, rgba(79,70,229,0.10) 0%, rgba(17,17,17,1) 68%)",
        border: "1px solid rgba(79,70,229,0.22)",
        borderRadius: 32,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "0 28px",
        }}
      >
        {HEADLINE.map((line, li) => {
          const isSubtitle = li === 0;
          return (
            <div key={li} style={{ display: "flex", justifyContent: "center" }}>
              {line.split("").map((char) => {
                const fi = globalCharIdx++;
                const delay = TIMING.charDelay + fi * TIMING.charStagger;

                const cs = spring({
                  frame: frame - delay,
                  fps,
                  config: SPRINGS.char,
                  from: 0,
                  to: 1,
                });

                const charOpacity = interpolate(cs, [0, 1], [0, 1]);
                const charY = interpolate(cs, [0, 1], [26, 0]);

                return (
                  <span
                    key={fi}
                    style={{
                      display: "inline-block",
                      opacity: charOpacity,
                      transform: `translateY(${charY}px)`,
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                      fontSize: isSubtitle ? 17 : 54,
                      fontWeight: isSubtitle ? 300 : 800,
                      letterSpacing: isSubtitle ? "0.48em" : "-0.025em",
                      color: isSubtitle ? "rgba(255,255,255,0.42)" : "#FFFFFF",
                      lineHeight: isSubtitle ? 2.6 : 1.1,
                      whiteSpace: "pre",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BrandCell  — 8th decorative tile (bottom-right)
// ─────────────────────────────────────────────────────────────────────────────
const BrandCell: React.FC<{ offset: [number, number] }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const cellDelay = getCellDelay(offset);

  const textOpacity = interpolate(
    frame,
    [cellDelay + 22, cellDelay + 40],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <GlassCell offset={offset}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 24,
        }}
      >
        <span
          style={{
            opacity: textOpacity,
            color: "rgba(255,255,255,0.88)",
            fontSize: 24,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          StayNow
        </span>
        <span
          style={{
            opacity: textOpacity,
            color: "rgba(255,255,255,0.28)",
            fontSize: 10,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          Travel AI
        </span>
      </div>
    </GlassCell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BentoIntro  — main composition
//
// Grid layout (3 × 3):
//   [tl hotel]  [tc map]    [tr users   ]
//   [ml deals]  [CENTER]    [mr experien]
//   [bl booking][bc payments][br StayNow ]
//
// Entrance sequence:
//   1. Center hero springs in  (heavy spring, stiffness 100)
//   2. Adjacent cells fringe in from their direction  (interpolate, easeOut)
//   3. Corner cells fringe in  (same but delayed)
//   4. Icons float up 10px inside their cells
//   5. Global shimmer sweeps at frame 120
// ─────────────────────────────────────────────────────────────────────────────
export const BentoIntro: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/*
        Grid: 1000px wide × 1780px tall centered in the 1080×1920 canvas.
        Horizontal padding: 40px each side.
        Vertical padding:   70px each side.
        Per-cell size:  ~325px wide × ~586px tall.
      */}
      <div
        style={{
          position: "relative",
          width: 1000,
          height: 1780,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 12,
          overflow: "hidden", // clips GlobalShimmer at grid boundary
        }}
      >
        {GRID_DATA.map((cell) => {
          if (cell.type === "center") {
            return <CenterHeroCell key={cell.id} />;
          }
          if (cell.type === "brand") {
            return <BrandCell key={cell.id} offset={cell.offset} />;
          }
          return (
            <IconCell key={cell.id} offset={cell.offset} icon={cell.icon!} />
          );
        })}

        {/* Global shimmer — rendered last so it sits above all cells */}
        <GlobalShimmer />
      </div>
    </AbsoluteFill>
  );
};
