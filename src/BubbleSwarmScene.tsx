import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, Audio, Sequence, Img } from "remotion";
import { COLORS } from "./v4/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// PRNG (mulberry32, seed=7)
// ─────────────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data — hype (center) + reality (outer)
// ─────────────────────────────────────────────────────────────────────────────
const AUTHORS = ["Maya", "Jay", "Sam", "Alex", "Priya"];
const AVATAR_KEYS = ["maya", "jay", "sam", "alex", "priya"];

const HYPE_TEXTS = [
  "which hotel?", "let's gooo", "BOOK IT", "I'm in 🔥", "send flights", "beach or jungle?", "what dates?",
  "BALI BABY", "morning flight ok?", "i'll book hotels", "i'll do itinerary", "scooter day 1", "rooftop bar list?", "warung lunch??",
];

const REALITY_TEXTS = [
  "wait i have work",
  "can't that weekend",
  "maybe next month?",
  "$$ tho 😬",
  "lemme check w/ partner",
  "flight $$$ rn",
  "i'm broke rn",
  "idk maybe",
];

type BubbleKind = "hype" | "reality";

interface Bubble {
  id: number;
  kind: BubbleKind;
  author: string;
  avatarKey: string;
  text: string;
  finalX: number;
  finalY: number;
  radius: number;
  rotation: number;
  spawnFrame: number;
  dieFrame: number;
  entryOffsetX: number;
  entryOffsetY: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parameterized placement — same logic, configurable dimensions
// ─────────────────────────────────────────────────────────────────────────────
const HYPE_COUNT = 14;
const REALITY_COUNT = 8;
const FALLOFF_POWER = 2.5;
const PLACEMENT_ATTEMPTS = 200;

interface PlacementConfig {
  centerX: number;
  centerY: number;
  viewportW: number;
  viewportH: number;
  bubbleW: number;
  bubbleH: number;
  collisionPad: number;
  hypeMaxRadius: number;
  realityMinRadius: number;
  realityMaxRadius: number;
}

function generateBubbles(cfg: PlacementConfig): Bubble[] {
  const rng = mulberry32(7);
  const bubbles: Bubble[] = [];

  function withinCanvas(c: { x: number; y: number }) {
    const halfW = cfg.bubbleW / 2;
    const halfH = cfg.bubbleH / 2;
    const SIDE_PAD = 60;
    const BOTTOM_PAD = 100;
    return (
      (cfg.centerX + c.x - halfW) >= SIDE_PAD &&
      (cfg.centerX + c.x + halfW) <= (cfg.viewportW - SIDE_PAD) &&
      (cfg.centerY + c.y - halfH) >= SIDE_PAD &&
      (cfg.centerY + c.y + halfH) <= (cfg.viewportH - BOTTOM_PAD)
    );
  }

  function collidesWithAny(c: { x: number; y: number }) {
    return bubbles.some((b) => {
      const dx = Math.abs(b.finalX - c.x);
      const dy = Math.abs(b.finalY - c.y);
      return dx < cfg.bubbleW + cfg.collisionPad && dy < cfg.bubbleH + cfg.collisionPad;
    });
  }

  function makeBubble(
    id: number,
    kind: BubbleKind,
    text: string,
    x: number,
    y: number,
    radius: number,
  ): Bubble {
    return {
      id,
      kind,
      author: AUTHORS[id % 5],
      avatarKey: AVATAR_KEYS[id % 5],
      text,
      finalX: x,
      finalY: y,
      radius,
      rotation: (rng() - 0.5) * 14,
      spawnFrame: 0,
      dieFrame: 0,
      entryOffsetX: 0,
      entryOffsetY: 0,
    };
  }

  // ── Pass 1: Hype bubbles (inner, density falloff) ─────────────────────
  for (let i = 0; i < HYPE_COUNT; i++) {
    let placed = false;
    for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
      const u = rng();
      const radius = cfg.hypeMaxRadius * Math.pow(u, FALLOFF_POWER);
      const angle = rng() * 2 * Math.PI;
      const c = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      if (!withinCanvas(c)) continue;
      if (collidesWithAny(c)) continue;
      bubbles.push(makeBubble(i, "hype", HYPE_TEXTS[i], c.x, c.y, radius));
      placed = true;
      break;
    }
    if (!placed) {
      for (let fb = 0; fb < 50; fb++) {
        const angle = rng() * 2 * Math.PI;
        const r = cfg.hypeMaxRadius * (0.5 + rng() * 0.5);
        const c = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
        if (!withinCanvas(c)) continue;
        if (!collidesWithAny(c)) {
          bubbles.push(makeBubble(i, "hype", HYPE_TEXTS[i], c.x, c.y, r));
          break;
        }
      }
    }
  }

  // ── Pass 2: Reality bubbles (outer band, uniform within range) ────────
  for (let i = 0; i < REALITY_COUNT; i++) {
    const globalId = HYPE_COUNT + i;
    let placed = false;
    for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
      const radius = cfg.realityMinRadius + rng() * (cfg.realityMaxRadius - cfg.realityMinRadius);
      const angle = rng() * 2 * Math.PI;
      const c = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      if (!withinCanvas(c)) continue;
      if (collidesWithAny(c)) continue;
      bubbles.push(makeBubble(globalId, "reality", REALITY_TEXTS[i], c.x, c.y, radius));
      placed = true;
      break;
    }
    if (!placed) {
      for (let fb = 0; fb < 50; fb++) {
        const angle = rng() * 2 * Math.PI;
        const r = cfg.realityMinRadius + rng() * (cfg.realityMaxRadius - cfg.realityMinRadius);
        const c = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
        if (!withinCanvas(c)) continue;
        if (!collidesWithAny(c)) {
          bubbles.push(makeBubble(globalId, "reality", REALITY_TEXTS[i], c.x, c.y, r));
          break;
        }
      }
    }
  }

  // Assign spawn frames: adaptive stagger so last spawn always at f84
  const TARGET_LAST_SPAWN = 84;
  const DIE_START = 144;
  const TARGET_LAST_DIE = 200;
  const totalBubbles = bubbles.length;

  bubbles.sort((a, b) => a.radius - b.radius);
  const spawnStagger = totalBubbles > 1 ? TARGET_LAST_SPAWN / (totalBubbles - 1) : 0;
  bubbles.forEach((b, i) => {
    b.spawnFrame = Math.floor(i * spawnStagger);
    const entryAngle = rng() * 2 * Math.PI;
    const entryDist = 25 + rng() * 15;
    b.entryOffsetX = Math.cos(entryAngle) * entryDist;
    b.entryOffsetY = Math.sin(entryAngle) * entryDist;
  });

  // Assign die frames: adaptive stagger so last die always at f200
  const dieSorted = [...bubbles].sort((a, b) => a.radius - b.radius);
  const dieRange = TARGET_LAST_DIE - DIE_START;
  const dieStagger = totalBubbles > 1 ? dieRange / (totalBubbles - 1) : 0;
  dieSorted.forEach((b, i) => {
    b.dieFrame = DIE_START + Math.floor(i * dieStagger);
  });

  return bubbles;
}

// ─────────────────────────────────────────────────────────────────────────────
// BubbleNode — entry → idle → die phases
// ─────────────────────────────────────────────────────────────────────────────
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function BubbleNode({ bubble: b, frame, centerX, centerY, isHorizontal }: { bubble: Bubble; frame: number; centerX: number; centerY: number; isHorizontal: boolean }) {
  const local = frame - b.spawnFrame;
  const dieLocal = frame - b.dieFrame;

  if (local < 0) return null;
  if (dieLocal >= 30) return null;

  let offsetX: number;
  let offsetY: number;
  let scale: number;
  let opacity: number;
  let currentRotation: number;

  if (local < 10) {
    offsetX = interpolate(local, [0, 10], [b.entryOffsetX, 0], { easing: Easing.out(Easing.cubic), ...CL });
    offsetY = interpolate(local, [0, 10], [b.entryOffsetY, 0], { easing: Easing.out(Easing.cubic), ...CL });
    scale = interpolate(local, [0, 6, 10], [0.7, 1.05, 1.0], {
      easing: Easing.bezier(0.34, 1.56, 0.64, 1), ...CL,
    });
    opacity = interpolate(local, [0, 5], [0, 1], { easing: Easing.out(Easing.cubic), ...CL });
    currentRotation = b.rotation;
  } else if (dieLocal < 0) {
    offsetX = 0;
    offsetY = Math.sin(frame / 38 + b.id * 1.1) * 3;
    scale = 1.0 + Math.sin(frame / 45 + b.id * 0.07) * 0.012;
    opacity = 1;
    currentRotation = b.rotation;
  } else {
    offsetX = 0;
    offsetY = 0;
    scale = interpolate(dieLocal, [0, 30], [1.0, 0.94], { easing: Easing.inOut(Easing.cubic), ...CL });
    opacity = interpolate(dieLocal, [0, 30], [1, 0], { easing: Easing.inOut(Easing.cubic), ...CL });
    currentRotation = b.rotation * (1 + (dieLocal / 30) * 0.15);
  }

  const pillBg = b.kind === "reality" ? "#FAFAFA" : COLORS.surfaceSubtle;
  const pillColor = b.kind === "reality" ? "#48484A" : COLORS.textPrimary;

  // Sizing — horizontal values locked, vertical scaled up
  const avatarSize = isHorizontal ? 44 : 80;
  const authorFontSize = isHorizontal ? 13 : 22;
  const authorMarginLeft = isHorizontal ? 14 : 20;
  const authorMarginBottom = isHorizontal ? 4 : 6;
  const pillFontSize = isHorizontal ? 15 : 28;
  const pillPadding = isHorizontal ? "10px 16px" : "16px 26px";
  const pillRadius = isHorizontal ? 22 : 32;
  const rowGap = isHorizontal ? 10 : 14;

  return (
    <div
      style={{
        position: "absolute",
        left: centerX + b.finalX + offsetX,
        top: centerY + b.finalY + offsetY,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${currentRotation}deg)`,
        transformOrigin: "center center",
        opacity,
        zIndex: Math.floor(1000 - b.radius),
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        gap: rowGap,
      }}
    >
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          border: "2px solid rgba(0,0,0,0.1)",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(251,113,133,0.08)",
        }}
      >
        <Img
          src={staticFile(`avatars/${b.avatarKey}.png`)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            color: COLORS.textSecondary,
            fontSize: authorFontSize,
            fontWeight: 600,
            letterSpacing: "0.04em",
            marginLeft: authorMarginLeft,
            marginBottom: authorMarginBottom,
          }}
        >
          {b.author}
        </div>
        <div
          style={{
            padding: pillPadding,
            borderRadius: pillRadius,
            background: pillBg,
            border: "1px solid rgba(0,0,0,0.06)",
            color: pillColor,
            fontSize: pillFontSize,
            fontWeight: 500,
            lineHeight: 1.35,
            boxShadow: "0 4px 12px rgba(251,113,133,0.06)",
            whiteSpace: "nowrap",
          }}
        >
          {b.text}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BubbleSwarmScene
// ─────────────────────────────────────────────────────────────────────────────
export default function BubbleSwarmScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isHorizontal = width === 1920 && height === 1080;
  const centerX = width / 2;
  const centerY = height / 2;

  const bubbles = useMemo(() => {
    if (isHorizontal) {
      // LOCKED horizontal path — exact same values as before
      return generateBubbles({
        viewportW: 1920,
        viewportH: 1080,
        centerX: 960,
        centerY: 540,
        bubbleW: 240,
        bubbleH: 75,
        collisionPad: 8,
        hypeMaxRadius: 420,
        realityMinRadius: 350,
        realityMaxRadius: 480,
      });
    }
    // Vertical / other viewport — bigger bubbles, wider spread
    return generateBubbles({
      viewportW: width,
      viewportH: height,
      centerX: width / 2,
      centerY: height / 2,
      bubbleW: 320,
      bubbleH: 95,
      collisionPad: 16,
      hypeMaxRadius: 480,
      realityMinRadius: 420,
      realityMaxRadius: 720,
    });
  }, [width, height, isHorizontal]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {bubbles.map((b) => (
        <BubbleNode key={b.id} bubble={b} frame={frame} centerX={centerX} centerY={centerY} isHorizontal={isHorizontal} />
      ))}

      {/* VO — plays from frame 0 */}
      <Sequence from={6}>
        <Audio src={staticFile("audio/01_new.mp3")} volume={1.0} />
      </Sequence>
    </AbsoluteFill>
  );
}
