import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({
  name,
  size = 40,
  dimmed = false,
}: {
  name: string;
  size?: number;
  dimmed?: boolean;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.95)",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      filter: dimmed
        ? "grayscale(80%) brightness(0.5)"
        : "saturate(1.15) brightness(1.05)",
      opacity: dimmed ? 0.4 : 1,
      transition: "filter 0.3s ease, opacity 0.3s ease",
    }}
  >
    <img
      src={staticFile(`avatars/${name}.png`)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Size config per bubble size tier
// ─────────────────────────────────────────────────────────────────────────────
type BubbleSize = "hero" | "shout" | "emoji" | "normal";

const SIZE_CONFIG: Record<
  BubbleSize,
  { fontSize: number; fontWeight: number; padding: string; avatarSize: number }
> = {
  hero: { fontSize: 20, fontWeight: 600, padding: "14px 22px", avatarSize: 48 },
  shout: {
    fontSize: 19,
    fontWeight: 700,
    padding: "12px 18px",
    avatarSize: 44,
  },
  emoji: {
    fontSize: 28,
    fontWeight: 400,
    padding: "10px 16px",
    avatarSize: 40,
  },
  normal: {
    fontSize: 15,
    fontWeight: 500,
    padding: "11px 16px",
    avatarSize: 40,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatBubble
// ─────────────────────────────────────────────────────────────────────────────
const ChatBubble = ({
  author,
  avatar,
  text,
  position,
  rotation,
  startFrame,
  frame,
  variant = "normal",
  size = "normal",
  drainProgress = 0,
}: {
  author: string;
  avatar: string;
  text: string;
  position: { x: number; y: number };
  rotation: number;
  startFrame: number;
  frame: number;
  variant?: "hero" | "normal" | "hesitant";
  size?: BubbleSize;
  drainProgress?: number;
}) => {
  const cfg = SIZE_CONFIG[size];

  // Slower fade-in: 0.6s (18f) so each bubble settles gracefully
  const baseOpacity = interpolate(
    frame,
    [startFrame, startFrame + 18],
    [0, 1],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const ageFalloff = interpolate(
    frame - startFrame,
    [0, 30, 80],
    [1, 1, 0.78],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const finalOpacity =
    variant === "hero" ? baseOpacity : baseOpacity * ageFalloff;

  // Drain effects — just a dim, not a kill
  const drainedOpacity =
    variant === "hero" ? 1 - drainProgress * 0.5 : 1 - drainProgress * 0.55;
  const drainedSaturation = 1 - drainProgress * 0.7;
  const drainedBrightness = 1 - drainProgress * 0.3;

  // No extra fade — let FallScene's own dark background handle the transition
  const finalSceneFade = 1;

  // Scale punch: 0.33s in (10f) → 0.47s settle (14f) = 0.8s total entry
  const scalePunch = (() => {
    if (frame < startFrame) return 0;
    if (frame < startFrame + 10) {
      return interpolate(frame, [startFrame, startFrame + 10], [0, 1.08], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    if (frame < startFrame + 24) {
      return interpolate(
        frame,
        [startFrame + 10, startFrame + 24],
        [1.08, 1.0],
        {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
    }
    return 1.0;
  })();

  // Gentle breathe after entry settles — keeps scene alive during caption hold
  const breathe =
    frame >= startFrame + 24
      ? Math.sin(frame / 45 + startFrame * 0.03) * 0.012
      : 0;

  // Per-bubble vertical float — global frequency so all bubbles feel connected
  const drift = Math.sin(frame / 35 + startFrame * 0.04) * 3;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + drift,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scalePunch + breathe})`,
        opacity: finalOpacity * drainedOpacity * finalSceneFade,
        filter: `saturate(${drainedSaturation}) brightness(${drainedBrightness})`,
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        maxWidth: 440,
      }}
    >
      <Avatar name={avatar} size={cfg.avatarSize} dimmed={false} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
            marginLeft: 14,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {author}
        </div>
        <div
          style={{
            padding: cfg.padding,
            borderRadius: 22,
            background:
              variant === "hero"
                ? "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(244,114,182,0.12))"
                : variant === "hesitant"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:
              variant === "hero"
                ? "1px solid rgba(244,114,182,0.35)"
                : variant === "hesitant"
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.95)",
            fontSize: variant === "hesitant" ? 15 : cfg.fontSize,
            fontWeight: variant === "hesitant" ? 400 : cfg.fontWeight,
            lineHeight: 1.35,
            boxShadow:
              variant === "hero"
                ? "0 4px 24px rgba(244,114,182,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                : variant === "hesitant"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cold open bubble data
// ─────────────────────────────────────────────────────────────────────────────
// Bubble stagger: 10f between each (~0.33s) — cascade fills frames 5–95 (3.2s)
// Last bubble settles ~f119, caption starts f105 — continuous motion throughout
const BUBBLES = [
  // Hero — center, establishes first
  {
    author: "Maya",
    avatar: "maya",
    text: "Bali next month?? 🌴",
    x: 960,
    y: 540,
    rotation: 0,
    startFrame: 5,
    variant: "hero" as const,
    size: "hero" as const,
  },
  // Reaction eruption — 10f stagger each
  {
    author: "Jay",
    avatar: "jay",
    text: "OMGGG YES 🔥",
    x: 480,
    y: 320,
    rotation: -8,
    startFrame: 15,
    variant: "normal" as const,
    size: "shout" as const,
  },
  {
    author: "Sam",
    avatar: "sam",
    text: "I'M IN",
    x: 1480,
    y: 460,
    rotation: 7,
    startFrame: 25,
    variant: "normal" as const,
    size: "shout" as const,
  },
  {
    author: "Alex",
    avatar: "alex",
    text: "lets goooo",
    x: 540,
    y: 760,
    rotation: 4,
    startFrame: 35,
    variant: "normal" as const,
    size: "shout" as const,
  },
  {
    author: "Priya",
    avatar: "priya",
    text: "BOOK IT NOW",
    x: 1380,
    y: 240,
    rotation: -6,
    startFrame: 45,
    variant: "normal" as const,
    size: "shout" as const,
  },
  {
    author: "Jay",
    avatar: "jay",
    text: "best idea ever",
    x: 1180,
    y: 770,
    rotation: 9,
    startFrame: 55,
    variant: "normal" as const,
    size: "normal" as const,
  },
  {
    author: "Alex",
    avatar: "alex",
    text: "🌴🌴🌴",
    x: 740,
    y: 230,
    rotation: -5,
    startFrame: 65,
    variant: "normal" as const,
    size: "emoji" as const,
  },
  {
    author: "Sam",
    avatar: "sam",
    text: "passport ready 🛂",
    x: 380,
    y: 880,
    rotation: -3,
    startFrame: 75,
    variant: "normal" as const,
    size: "normal" as const,
  },
  {
    author: "Priya",
    avatar: "priya",
    text: "i'll start the spreadsheet",
    x: 1320,
    y: 880,
    rotation: 6,
    startFrame: 85,
    variant: "normal" as const,
    size: "normal" as const,
  },
  // Peak energy — final eruption at 3.2s, settled ~f119
  {
    author: "Sam",
    avatar: "sam",
    text: "BOOKING FLIGHTS RN ✈️",
    x: 1180,
    y: 380,
    rotation: 5,
    startFrame: 95,
    variant: "normal" as const,
    size: "shout" as const,
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// OpeningChatScene — 150 frames (5 seconds)
// 0–3s:  Bubble cascade (excitement)
// 3–4s:  "Every great trip starts here" caption
// 4–5s:  Caption exits, scene dims into FallScene
// ─────────────────────────────────────────────────────────────────────────────
export default function OpeningChatScene() {
  const frame = useCurrentFrame();
  useVideoConfig();

  // ── Gentle dim — only reaches 0.6, never goes black (FallScene handles that) ─
  const drainProgress = interpolate(frame, [100, 150], [0, 0.6], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cameraZoom = interpolate(frame, [0, 60], [1.0, 1.04], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hero glow pulse
  const heroGlowPulse =
    interpolate(frame, [20, 50], [0, 0.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
    Math.sin(frame / 28) * 0.2;

  // Hero float
  const heroFloat = Math.sin(frame / 45) * 4;

  // Ambient floor glow opacity — fades out with drain
  const ambientOpacity =
    interpolate(frame, [20, 60], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    (1 - drainProgress);

  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Subtle bottom ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(244,114,182,0.08), transparent 60%)",
          opacity: ambientOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Hero glow blob */}
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 540 + heroFloat,
          width: 720,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(251,146,60,0.18), rgba(244,114,182,0.12), transparent 70%)",
          filter: "blur(40px)",
          transform: "translate(-50%, -50%)",
          opacity: Math.max(
            0,
            Math.min(1, heroGlowPulse * (1 - drainProgress)),
          ),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Camera-zoomed wrapper — cold open bubbles */}
      <div
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          transform: `scale(${cameraZoom})`,
          transformOrigin: "center center",
          zIndex: 1,
        }}
      >
        {BUBBLES.map((b, i) => {
          const yOffset = b.variant === "hero" ? heroFloat : 0;
          return (
            <ChatBubble
              key={i}
              author={b.author}
              avatar={b.avatar}
              text={b.text}
              position={{ x: b.x, y: b.y + yOffset }}
              rotation={b.rotation}
              startFrame={b.startFrame}
              variant={b.variant}
              size={b.size}
              frame={frame}
              drainProgress={drainProgress}
            />
          );
        })}

      </div>

      {/* Vignette — creeps in gently, max 0.5 so scene stays visible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 90%)",
          opacity: drainProgress * 0.7,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      {/* Caption — appears at f88, fades before end of scene */}
      {frame >= 88 && frame < 148 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "8%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.02em",
            fontStyle: "italic",
            opacity: interpolate(frame, [88, 103, 120, 145], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          Every great trip starts here.
        </div>
      )}

    </AbsoluteFill>
  );
}
