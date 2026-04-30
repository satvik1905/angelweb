import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// World data
// ─────────────────────────────────────────────────────────────────────────────
const ANGEL_HOME = { x: 960, y: 540 };
const ANGEL_POS  = ANGEL_HOME;
const ORBIT_RADIUS = 360;

const CARD_DATA = [
  { id: "budget",   avatar: "M", name: "Maya", concern: "Budget Constraints",  resolution: "Found a place at $180/night ✓" },
  { id: "dates",    avatar: "J", name: "Jay",  concern: "Dates Don't Work",    resolution: "Oct 12–15 works for everyone ✓" },
  { id: "food",     avatar: "S", name: "Sam",  concern: "Need Own Room",       resolution: "Nut-free Airbnb confirmed ✓" },
  { id: "group",    avatar: "A", name: "Alex", concern: "Work Conflict",       resolution: "Split into 2 villas ✓" },
  { id: "activity", avatar: "R", name: "Riya", concern: "Too Far",             resolution: "Itinerary planned ✓" },
];

const CARDS = CARD_DATA.map((card, i) => {
  const angle = (i / CARD_DATA.length) * Math.PI * 2 - Math.PI / 2;
  return {
    ...card,
    x: ANGEL_POS.x + Math.cos(angle) * ORBIT_RADIUS,
    y: ANGEL_POS.y + Math.sin(angle) * ORBIT_RADIUS,
  };
});

const IMPACT_FRAMES = [93, 125, 157, 189, 221];
const TARGET_CARD_INDICES = [0, 1, 2, 3, 4];

// ─────────────────────────────────────────────────────────────────────────────
// Camera — cinematic tracking shot
// ─────────────────────────────────────────────────────────────────────────────
function getCameraAt(frame: number) {
  const angelLag = getAngelPos(Math.max(0, frame - 3));

  const wideShotZoom = 1.0;
  const trackingZoom = 1.6;

  const zoom = (() => {
    if (frame < 60) {
      return wideShotZoom;
    } else if (frame < 90) {
      const p = (frame - 60) / 30;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      return wideShotZoom + (trackingZoom - wideShotZoom) * eased;
    } else if (frame < 240) {
      return trackingZoom;
    } else if (frame < 275) {
      const p = (frame - 240) / 35;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      return trackingZoom + (wideShotZoom - trackingZoom) * eased;
    } else {
      return wideShotZoom;
    }
  })();

  // During rush, camera locks to center so Angel grows from screen center
  if (frame >= 310 && frame < 400) {
    return { x: ANGEL_POS.x, y: ANGEL_POS.y, zoom: 1.0 };
  }

  const targetX = (frame < 60 || frame >= 280) ? ANGEL_POS.x : angelLag.x;
  const targetY = (frame < 60 || frame >= 280) ? ANGEL_POS.y : angelLag.y;

  return { x: targetX, y: targetY, zoom };
}

function getAngelSpeed(frame: number): number {
  if (frame < 1) return 0;
  const a = getAngelPos(frame);
  const b = getAngelPos(frame - 1);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getCameraShake(frame: number) {
  let shakeX = 0, shakeY = 0;
  for (const impactF of IMPACT_FRAMES) {
    if (frame >= impactF && frame <= impactF + 8) {
      const local = frame - impactF;
      const intensity = Math.max(0, 1 - local / 8);
      shakeX += Math.sin(local * 4) * 12 * intensity;
      shakeY += Math.cos(local * 5) * 10 * intensity;
    }
  }
  return { shakeX, shakeY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Angel path
// ─────────────────────────────────────────────────────────────────────────────
const ANGEL_PATH = [
  { frame: 0,   pos: ANGEL_HOME,                        state: "idle"   },
  { frame: 60,  pos: ANGEL_HOME,                        state: "idle"   },
  { frame: 70,  pos: ANGEL_HOME,                        state: "windup" },
  { frame: 93,  pos: { x: CARDS[0].x, y: CARDS[0].y }, state: "impact" },
  { frame: 103, pos: { x: CARDS[0].x, y: CARDS[0].y }, state: "recoil" },
  { frame: 125, pos: { x: CARDS[1].x, y: CARDS[1].y }, state: "impact" },
  { frame: 135, pos: { x: CARDS[1].x, y: CARDS[1].y }, state: "recoil" },
  { frame: 157, pos: { x: CARDS[2].x, y: CARDS[2].y }, state: "impact" },
  { frame: 167, pos: { x: CARDS[2].x, y: CARDS[2].y }, state: "recoil" },
  { frame: 189, pos: { x: CARDS[3].x, y: CARDS[3].y }, state: "impact" },
  { frame: 199, pos: { x: CARDS[3].x, y: CARDS[3].y }, state: "recoil" },
  { frame: 221, pos: { x: CARDS[4].x, y: CARDS[4].y }, state: "impact" },
  { frame: 231, pos: { x: CARDS[4].x, y: CARDS[4].y }, state: "recoil" },
  { frame: 260, pos: ANGEL_HOME,                        state: "idle"   },
];

function getAngelPos(frame: number) {
  for (let i = 0; i < ANGEL_PATH.length - 1; i++) {
    const a = ANGEL_PATH[i];
    const b = ANGEL_PATH[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const p = (frame - a.frame) / (b.frame - a.frame);
      let eased: number;
      if (b.state === "impact") {
        eased = p * p * p;
      } else if (b.state === "recoil") {
        eased = 1;
      } else {
        eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      }
      return {
        x: a.pos.x + (b.pos.x - a.pos.x) * eased,
        y: a.pos.y + (b.pos.y - a.pos.y) * eased,
      };
    }
  }
  const last = ANGEL_PATH[ANGEL_PATH.length - 1];
  return { x: last.pos.x, y: last.pos.y };
}

function getAngelSquash(frame: number) {
  let squashX = 1, squashY = 1;
  for (const impactF of IMPACT_FRAMES) {
    if (frame >= impactF - 3 && frame <= impactF + 8) {
      const local = frame - impactF;
      const intensity = Math.max(0, 1 - Math.abs(local) / 8);
      squashX = 1 + 0.3 * intensity;
      squashY = 1 - 0.3 * intensity;
    }
  }
  return { squashX, squashY };
}

// ─────────────────────────────────────────────────────────────────────────────
// ShatterFragments
// ─────────────────────────────────────────────────────────────────────────────
function ShatterFragments({ centerX, centerY, timeSinceHit }: {
  centerX: number; centerY: number; timeSinceHit: number;
}) {
  const FRAGMENTS = 14;
  return (
    <>
      {[...Array(FRAGMENTS)].map((_, i) => {
        const angle = (i / FRAGMENTS) * Math.PI * 2 + (i % 2) * 0.3;
        const speed = 6 + (i % 3) * 2;
        const dist = timeSinceHit * speed;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist + timeSinceHit * timeSinceHit * 0.15;
        const opacity = Math.max(0, 1 - timeSinceHit / 25);
        const rotation = timeSinceHit * (10 + i);
        const size = 28 + (i % 4) * 8;
        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            width: size, height: size * 0.6,
            background: i % 2 === 0
              ? "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(244,114,182,0.6))"
              : "linear-gradient(135deg, rgba(251,113,133,0.6), rgba(255,255,255,0.4))",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.3)",
            opacity,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: "0 4px 12px rgba(244,114,182,0.4)",
            pointerEvents: "none",
          }} />
        );
      })}
      {/* Central impact flash */}
      <div style={{
        position: "absolute",
        left: centerX, top: centerY,
        width: 300, height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(244,114,182,0.5), transparent)",
        opacity: Math.max(0, 1 - timeSinceHit / 12),
        transform: `translate(-50%, -50%) scale(${1 + timeSinceHit / 8})`,
        pointerEvents: "none",
      }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResolvedBadge
// ─────────────────────────────────────────────────────────────────────────────
function ResolvedBadge({ card, appearProgress, recedeScale = 1, recedeOpacity = 1 }: {
  card: typeof CARDS[number]; appearProgress: number; recedeScale?: number; recedeOpacity?: number;
}) {
  return (
    <div style={{
      position: "absolute",
      left: card.x, top: card.y,
      transform: `translate(-50%, -50%) scale(${(0.8 + appearProgress * 0.2) * recedeScale})`,
      opacity: appearProgress * recedeOpacity,
      padding: "14px 22px",
      borderRadius: 18,
      backgroundImage: `
        linear-gradient(rgba(20,20,24,0.85), rgba(20,20,24,0.85)),
        linear-gradient(135deg, #FB923C, #FB7185, #F472B6)
      `,
      backgroundOrigin: "border-box",
      backgroundClip: "padding-box, border-box",
      border: "1.5px solid transparent",
      boxShadow: "0 0 40px rgba(244,114,182,0.5)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    }}>
      <div style={{
        width: 24, height: 24,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FB923C, #F472B6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 14, fontWeight: 700,
        flexShrink: 0,
      }}>✓</div>
      <div style={{
        fontSize: 15, fontWeight: 500,
        backgroundImage: "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        whiteSpace: "nowrap",
      }}>
        {card.resolution}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConflictOrb (pre-impact only) — orb body, no label
// ─────────────────────────────────────────────────────────────────────────────
function ConflictOrb({ card, index, frame }: {
  card: typeof CARDS[number]; index: number; frame: number;
}) {
  const enterStart = 15 + index * 8;
  const orbOpacity = interpolate(frame, [enterStart, enterStart + 25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const orbScale = interpolate(frame, [enterStart, enterStart + 30], [0.6, 1], {
    easing: Easing.out(Easing.back(1.3)),
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute",
      left: card.x, top: card.y,
      width: 110, height: 110,
      transform: `translate(-50%, -50%) scale(${orbScale})`,
      opacity: orbOpacity,
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(200,190,205,0.5), rgba(140,120,140,0.25))",
      boxShadow: "0 0 40px rgba(251,113,133,0.25), 0 8px 32px rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.15)",
    }}>
      {/* Glassy shine */}
      <div style={{
        position: "absolute",
        top: "8%", left: "12%",
        width: "45%", height: "40%",
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0))",
        filter: "blur(2px)",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardLabel — rendered separately above everything else
// ─────────────────────────────────────────────────────────────────────────────
function CardLabel({ card, index, frame }: {
  card: typeof CARDS[number]; index: number; frame: number;
}) {
  const enterStart = 15 + index * 8;
  const labelOpacity = interpolate(frame, [enterStart, enterStart + 25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const isLeft  = card.x < ANGEL_POS.x - 50;
  const isRight = card.x > ANGEL_POS.x + 50;

  const labelLeft      = isLeft  ? -8  : undefined;
  const labelRight     = isRight ? -8  : undefined;
  const labelTransform = isLeft
    ? "translate(-100%, -50%)"
    : isRight
    ? "translate(100%, -50%)"
    : "translate(-50%, -130%)";
  const marginLeft  = isRight ? 12 : 0;
  const marginRight = isLeft  ? 12 : 0;

  return (
    <div style={{
      position: "absolute",
      left: card.x, top: card.y,
      opacity: labelOpacity,
      pointerEvents: "none",
      zIndex: 10,
    }}>
      <div style={{
        position: "absolute",
        left:  labelLeft,
        right: labelRight,
        top: "50%",
        transform: labelTransform,
        whiteSpace: "nowrap",
        color: "#ffffff",
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        textShadow: "0 2px 12px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.7)",
        marginLeft,
        marginRight,
      }}>
        {card.concern}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResolutionScene
// ─────────────────────────────────────────────────────────────────────────────
export default function ResolutionScene() {
  const frame = useCurrentFrame();

  const cam = getCameraAt(frame);
  const { shakeX, shakeY } = getCameraShake(frame);
  const worldX = 1920 / 2 - cam.x * cam.zoom + shakeX;
  const worldY = 1080 / 2 - cam.y * cam.zoom + shakeY;

  const speed = getAngelSpeed(frame);
  const motionBlurAmount = Math.min(speed / 8, 4);

  const angelPos = getAngelPos(frame);
  const { squashX, squashY } = getAngelSquash(frame);
  const angelEnterScale = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const angelOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── Beat 9: Rush to camera (frames 310–360) ──────────────────────────────
  const rushScale = interpolate(
    frame,
    [310, 320, 325],
    [1, 8, 18],
    { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const rushBlur = interpolate(
    frame,
    [310, 318, 325],
    [0, 6, 30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const recedeScale = interpolate(
    frame,
    [310, 325],
    [1, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const recedeOpacity = interpolate(
    frame,
    [310, 325],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Finale pulse (frames 275–310) ─────────────────────────────────────────
  const finalePulse = interpolate(
    frame,
    [275, 300, 330],
    [1.0, 1.4, 1.1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const glowFinaleScale = frame >= 275 ? finalePulse * 1.5 : 1;
  const glowFinaleOpacity = frame >= 275 ? 1.0 : 0.8;


  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>

      {/* ── Camera world ───────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        width: 1920, height: 1080,
        transformOrigin: "top left",
        transform: `translate(${worldX}px, ${worldY}px) scale(${cam.zoom})`,
        filter: motionBlurAmount > 0.5 ? `blur(${motionBlurAmount}px)` : "none",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.06), transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* ── Conflict orbs (pre-impact) ──────────────────────────────────── */}
        {CARDS.map((card, i) => {
          const impactIdx = TARGET_CARD_INDICES.indexOf(i);
          const cardImpactFrame = impactIdx !== -1 ? IMPACT_FRAMES[impactIdx] : null;
          const isHit = cardImpactFrame !== null && frame >= cardImpactFrame;
          if (isHit) return null;
          return <ConflictOrb key={card.id} card={card} index={i} frame={frame} />;
        })}

        {/* ── Resolved badges ─────────────────────────────────────────────── */}
        {TARGET_CARD_INDICES.map((cardIdx, i) => {
          const impactFrame = IMPACT_FRAMES[i];
          if (frame < impactFrame) return null;
          const timeSinceHit = frame - impactFrame;
          if (timeSinceHit <= 18) return null;
          const appearProgress = Math.min(1, (timeSinceHit - 18) / 15);
          return (
            <ResolvedBadge
              key={CARDS[cardIdx].id}
              card={CARDS[cardIdx]}
              appearProgress={appearProgress}
              recedeScale={recedeScale}
              recedeOpacity={recedeOpacity}
            />
          );
        })}

        {/* ── Shatter fragments ───────────────────────────────────────────── */}
        {TARGET_CARD_INDICES.map((cardIdx, i) => {
          const impactFrame = IMPACT_FRAMES[i];
          if (frame < impactFrame) return null;
          const timeSinceHit = frame - impactFrame;
          if (timeSinceHit > 25) return null;
          return (
            <ShatterFragments
              key={CARDS[cardIdx].id}
              centerX={CARDS[cardIdx].x}
              centerY={CARDS[cardIdx].y}
              timeSinceHit={timeSinceHit}
            />
          );
        })}

        {/* ── Angel trail ─────────────────────────────────────────────────── */}
        {[1, 2, 3, 4, 5, 6].map((i) => {
          const trailFrame = Math.max(0, frame - i * 2);
          const trailPos = getAngelPos(trailFrame);
          const trailOpacity = (1 - i / 6) * 0.4;
          return (
            <div key={i} style={{
              position: "absolute",
              left: trailPos.x, top: trailPos.y,
              width: 100 - i * 8, height: 100 - i * 8,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,180,210,0.6), transparent)",
              filter: "blur(8px)",
              opacity: trailOpacity,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }} />
          );
        })}

        {/* ── Angel glow ──────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute",
          left: angelPos.x, top: angelPos.y,
          width: 140 * glowFinaleScale, height: 140 * glowFinaleScale,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FB7185, #F472B6, transparent)",
          filter: "blur(30px)",
          opacity: angelOpacity * glowFinaleOpacity * 0.4,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />

        {/* ── Angel icon ──────────────────────────────────────────────────── */}
        <img
          src={staticFile("Avatar.svg")}
          style={{
            position: "absolute",
            left: angelPos.x, top: angelPos.y,
            width: 200, height: 200,
            transform: frame >= 310
              ? `translate(-50%, -50%) scale(${rushScale})`
              : `translate(-50%, -50%) scale(${angelEnterScale * squashX * finalePulse}, ${angelEnterScale * squashY * finalePulse})`,
            transformOrigin: "center center",
            opacity: angelOpacity,
            filter: frame >= 310 ? `blur(${rushBlur}px)` : "none",
          }}
        />

        {/* ── Card labels — always on top ──────────────────────────────────── */}
        {CARDS.map((card, i) => {
          const impactIdx = TARGET_CARD_INDICES.indexOf(i);
          const cardImpactFrame = impactIdx !== -1 ? IMPACT_FRAMES[impactIdx] : null;
          const isHit = cardImpactFrame !== null && frame >= cardImpactFrame;
          if (isHit) return null;
          return <CardLabel key={card.id} card={card} index={i} frame={frame} />;
        })}
      </div>{/* end world */}

      {/* ── Mist transition IN (frames 0–35, screen space) ──────────────── */}
      {frame < 35 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(244,114,182,0.6), rgba(251,113,133,0.4), transparent 70%)",
          opacity: interpolate(frame, [0, 25, 35], [1, 0.6, 0], { extrapolateRight: "clamp" }),
          zIndex: 100,
          pointerEvents: "none",
        }} />
      )}


      {/* ── Sparkle particles (screen space, frames 290–340) ────────────── */}
      {frame >= 290 && frame <= 340 && [...Array(20)].map((_, i) => {
        const sparkSeed = i * 137;
        const sparkX = (sparkSeed * 7) % 1920;
        const sparkYBase = (sparkSeed * 13) % 1080;
        const driftY = sparkYBase - (frame - 290) * 1.5;
        const sparkOpacity = Math.sin(((frame - 290 + i * 3) / 50) * Math.PI) * 0.7;
        return (
          <div key={i} style={{
            position: "absolute",
            left: sparkX,
            top: driftY,
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            borderRadius: "50%",
            background: "radial-gradient(circle, #ffffff, rgba(244,114,182,0.6), transparent)",
            opacity: Math.max(0, sparkOpacity),
            pointerEvents: "none",
            boxShadow: "0 0 8px rgba(255,255,255,0.8)",
            zIndex: 210,
          }} />
        );
      })}

      {/* ── Beat 10: White flash (frames 322–332) ───────────────────────── */}
      {frame >= 322 && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: interpolate(frame, [322, 326, 332], [0, 1, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }),
          zIndex: 300,
          pointerEvents: "none",
        }} />
      )}

      {/* ── Black overlay (frames 330–340) ──────────────────────────────── */}
      {frame >= 330 && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
          opacity: interpolate(frame, [330, 340], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }),
          zIndex: 301,
          pointerEvents: "none",
        }} />
      )}

      {/* ── Beat 11: Ambient glow during text reveal (frames 340+) ──────── */}
      {frame >= 340 && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.18), transparent 65%)",
          opacity: interpolate(frame, [340, 375], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }),
          zIndex: 320,
          pointerEvents: "none",
        }} />
      )}

      {/* ── Beat 11: Text reveal (frames 342–540) ───────────────────────── */}
      {frame >= 342 && (() => {
        const LINE_1 = ["Angel", "resolves", "your", "concern", "and", "finds", "a", "middleground."];
        const LINE_2 = ["So", "you", "don't", "have", "to."];
        return (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 350,
            padding: "0 200px",
            textAlign: "center",
          }}>
            {/* Line 1 */}
            <div style={{
              fontSize: 56,
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              marginBottom: 24,
              maxWidth: 1400,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.3em",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}>
              {LINE_1.map((word, i) => {
                const wordStart = 384 + i * 5;
                const wordOpacity = interpolate(frame, [wordStart, wordStart + 18], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                const wordY = interpolate(frame, [wordStart, wordStart + 22], [16, 0], {
                  easing: Easing.out(Easing.cubic),
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                const wordBlur = Math.max(0, interpolate(frame, [wordStart, wordStart + 18], [8, 0], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                }));
                const isHighlight = word === "Angel" || word === "middleground.";
                return (
                  <span key={i} style={{
                    display: "inline-block",
                    opacity: wordOpacity,
                    transform: `translateY(${wordY}px)`,
                    filter: `blur(${wordBlur}px)`,
                    ...(isHighlight ? {
                      backgroundImage: "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      fontWeight: 800,
                    } : {}),
                  }}>
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Line 2 — "So you don't have to." */}
            <div style={{
              fontSize: 48,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              display: "flex",
              gap: "0.3em",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}>
              {LINE_2.map((word, i) => {
                const wordStart = 432 + i * 5;
                const wordOpacity = interpolate(frame, [wordStart, wordStart + 18], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                const wordY = interpolate(frame, [wordStart, wordStart + 22], [12, 0], {
                  easing: Easing.out(Easing.cubic),
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                });
                return (
                  <span key={i} style={{
                    display: "inline-block",
                    opacity: wordOpacity,
                    transform: `translateY(${wordY}px)`,
                  }}>
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

    </AbsoluteFill>
  );
}
