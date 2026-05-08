import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, staticFile, Audio, Sequence, Img } from "remotion";
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
  "YESSS", "let's gooo", "BOOK IT", "I'm in 🔥", "omg yes", "🌴🌴🌴", "DOWN",
  "BALI BABY", "✈️✈️", "hyped", "GO GO GO", "yes please", "🍹🍹", "😍",
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
// Two-pass placement: hype (inner) then reality (outer)
// ─────────────────────────────────────────────────────────────────────────────
const HYPE_COUNT = 14;
const REALITY_COUNT = 8;
const BUBBLE_W = 240;
const BUBBLE_H = 75;
const COLLISION_PAD = 8;
const HYPE_MAX_RADIUS = 420;
const REALITY_MIN_RADIUS = 350;
const REALITY_MAX_RADIUS = 480;
const FALLOFF_POWER = 2.5;
const PLACEMENT_ATTEMPTS = 200;

function generateBubbles(): Bubble[] {
  const rng = mulberry32(7);
  const bubbles: Bubble[] = [];

  function withinCanvas(c: { x: number; y: number }) {
    const halfW = BUBBLE_W / 2;
    const halfH = BUBBLE_H / 2;
    const SIDE_PAD = 60;
    const BOTTOM_PAD = 100;
    return (
      (960 + c.x - halfW) >= SIDE_PAD &&
      (960 + c.x + halfW) <= (1920 - SIDE_PAD) &&
      (540 + c.y - halfH) >= SIDE_PAD &&
      (540 + c.y + halfH) <= (1080 - BOTTOM_PAD)
    );
  }

  function collidesWithAny(c: { x: number; y: number }) {
    return bubbles.some((b) => {
      const dx = Math.abs(b.finalX - c.x);
      const dy = Math.abs(b.finalY - c.y);
      return dx < BUBBLE_W + COLLISION_PAD && dy < BUBBLE_H + COLLISION_PAD;
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
      const radius = HYPE_MAX_RADIUS * Math.pow(u, FALLOFF_POWER);
      const angle = rng() * 2 * Math.PI;
      const c = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      if (!withinCanvas(c)) continue;
      if (collidesWithAny(c)) continue;
      bubbles.push(makeBubble(i, "hype", HYPE_TEXTS[i], c.x, c.y, radius));
      placed = true;
      break;
    }
    if (!placed) {
      // Fallback: try wider
      for (let fb = 0; fb < 50; fb++) {
        const angle = rng() * 2 * Math.PI;
        const r = HYPE_MAX_RADIUS * (0.5 + rng() * 0.5);
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
      const radius = REALITY_MIN_RADIUS + rng() * (REALITY_MAX_RADIUS - REALITY_MIN_RADIUS);
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
        const r = REALITY_MIN_RADIUS + rng() * (REALITY_MAX_RADIUS - REALITY_MIN_RADIUS);
        const c = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
        if (!withinCanvas(c)) continue;
        if (!collidesWithAny(c)) {
          bubbles.push(makeBubble(globalId, "reality", REALITY_TEXTS[i], c.x, c.y, r));
          break;
        }
      }
    }
  }

  // Assign spawn frames: closest to center first, 4f stagger
  bubbles.sort((a, b) => a.radius - b.radius);
  bubbles.forEach((b, i) => {
    b.spawnFrame = Math.floor(i * 4);
    const entryAngle = rng() * 2 * Math.PI;
    const entryDist = 25 + rng() * 15;
    b.entryOffsetX = Math.cos(entryAngle) * entryDist;
    b.entryOffsetY = Math.sin(entryAngle) * entryDist;
  });

  // Assign die frames: CENTER (hype) dies FIRST, OUTER (reality) dies LAST
  // Sort by radius ASCENDING — innermost dies first
  const dieSorted = [...bubbles].sort((a, b) => a.radius - b.radius);
  dieSorted.forEach((b, i) => {
    b.dieFrame = 125 + Math.floor(i * 2.7);
  });

  return bubbles;
}

const BUBBLES = generateBubbles();
const POP_BUBBLES = BUBBLES.filter(b => b.spawnFrame < 60);

// ─────────────────────────────────────────────────────────────────────────────
// BubbleNode — entry → idle → die phases
// ─────────────────────────────────────────────────────────────────────────────
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function BubbleNode({ bubble: b, frame }: { bubble: Bubble; frame: number }) {
  const local = frame - b.spawnFrame;
  const dieLocal = frame - b.dieFrame;

  if (local < 0) return null;
  if (dieLocal >= 15) return null;

  let offsetX: number;
  let offsetY: number;
  let scale: number;
  let opacity: number;
  let currentRotation: number;

  if (local < 10) {
    // ── ENTRY: punch in from random offset ────────────────────────────
    offsetX = interpolate(local, [0, 10], [b.entryOffsetX, 0], { easing: Easing.out(Easing.cubic), ...CL });
    offsetY = interpolate(local, [0, 10], [b.entryOffsetY, 0], { easing: Easing.out(Easing.cubic), ...CL });
    scale = interpolate(local, [0, 6, 10], [0.7, 1.05, 1.0], {
      easing: Easing.bezier(0.34, 1.56, 0.64, 1), ...CL,
    });
    opacity = interpolate(local, [0, 5], [0, 1], { easing: Easing.out(Easing.cubic), ...CL });
    currentRotation = b.rotation;
  } else if (dieLocal < 0) {
    // ── IDLE: subtle float + breathe ──────────────────────────────────
    offsetX = 0;
    offsetY = Math.sin(frame / 38 + b.id * 1.1) * 3;
    scale = 1.0 + Math.sin(frame / 45 + b.id * 0.07) * 0.012;
    opacity = 1;
    currentRotation = b.rotation;
  } else {
    // ── DYING: fade out in place ──────────────────────────────────────
    offsetX = 0;
    offsetY = 0;
    scale = interpolate(dieLocal, [0, 15], [1.0, 0.94], { easing: Easing.inOut(Easing.cubic), ...CL });
    opacity = interpolate(dieLocal, [0, 15], [1, 0], { easing: Easing.inOut(Easing.cubic), ...CL });
    currentRotation = b.rotation * (1 + (dieLocal / 15) * 0.15);
  }

  // Reality bubbles: slightly muted styling
  const pillBg = b.kind === "reality" ? "#FAFAFA" : COLORS.surfaceSubtle;
  const pillColor = b.kind === "reality" ? "#48484A" : COLORS.textPrimary;

  return (
    <div
      style={{
        position: "absolute",
        left: 960 + b.finalX + offsetX,
        top: 540 + b.finalY + offsetY,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${currentRotation}deg)`,
        transformOrigin: "center center",
        opacity,
        zIndex: Math.floor(1000 - b.radius),
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
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

      {/* Column: author + pill */}
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
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.04em",
            marginLeft: 14,
            marginBottom: 4,
          }}
        >
          {b.author}
        </div>
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 22,
            background: pillBg,
            border: "1px solid rgba(0,0,0,0.06)",
            color: pillColor,
            fontSize: 15,
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
// BubbleSwarmScene — 210 frames (7 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function BubbleSwarmScene() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {BUBBLES.map((b) => (
        <BubbleNode key={b.id} bubble={b} frame={frame} />
      ))}

      {/* Pop SFX — one per bubble spawn in the first 2 seconds */}
      {POP_BUBBLES.map((b) => (
        <Sequence key={`pop-${b.id}`} from={b.spawnFrame} durationInFrames={20}>
          <Audio src={staticFile("audio/pop.wav")} volume={0.6} />
        </Sequence>
      ))}

      {/* VO starting at 2-second mark */}
      <Sequence from={60}>
        <Audio src={staticFile("audio/new_01.mp3")} volume={1.0} />
      </Sequence>
    </AbsoluteFill>
  );
}
