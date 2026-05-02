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

  const baseOpacity = interpolate(
    frame,
    [startFrame, startFrame + 12],
    [0, 1],
    {
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

  // Drain effects
  const ghostTownFade = interpolate(frame, [420, 470], [1, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drainedOpacity =
    (variant === "hero" ? 1 - drainProgress * 0.82 : 1 - drainProgress * 0.78) *
    ghostTownFade;
  const drainedSaturation = 1 - drainProgress * 0.85;
  const drainedBrightness = 1 - drainProgress * 0.4;

  // Phase 3 — bubbles fully gone before "Until now." dominates
  const finalSceneFade = interpolate(frame, [450, 480], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // iOS-style scale punch: 0 → 1.08 → 1.0
  const scalePunch = (() => {
    if (frame < startFrame) return 0;
    if (frame < startFrame + 8) {
      return interpolate(frame, [startFrame, startFrame + 8], [0, 1.08], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    if (frame < startFrame + 16) {
      return interpolate(
        frame,
        [startFrame + 8, startFrame + 16],
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

  const drift = Math.sin((frame - startFrame) / 50) * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + drift,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scalePunch})`,
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
const BUBBLES = [
  // Hero — center
  {
    author: "Maya",
    avatar: "maya",
    text: "Bali next month?? 🌴",
    x: 960,
    y: 540,
    rotation: 0,
    startFrame: 20,
    variant: "hero" as const,
    size: "hero" as const,
  },
  // Reaction eruption
  {
    author: "Jay",
    avatar: "jay",
    text: "OMGGG YES 🔥",
    x: 480,
    y: 320,
    rotation: -8,
    startFrame: 60,
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
    startFrame: 68,
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
    startFrame: 76,
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
    startFrame: 84,
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
    startFrame: 92,
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
    startFrame: 100,
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
    startFrame: 108,
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
    startFrame: 116,
    variant: "normal" as const,
    size: "normal" as const,
  },
  // Peak energy — final eruption before the drain
  {
    author: "Sam",
    avatar: "sam",
    text: "BOOKING FLIGHTS RN ✈️",
    x: 1180,
    y: 380,
    rotation: 5,
    startFrame: 175,
    variant: "normal" as const,
    size: "shout" as const,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — hesitant bubbles
// ─────────────────────────────────────────────────────────────────────────────
const FALL_BUBBLES = [
  {
    author: "Jay",
    avatar: "jay",
    text: "actually... can we push it?",
    x: 700,
    y: 470,
    rotation: -2,
    startFrame: 280,
  },
  {
    author: "Sam",
    avatar: "sam",
    text: "is $300 ok for everyone?",
    x: 1200,
    y: 600,
    rotation: 2,
    startFrame: 305,
  },
  {
    author: "Priya",
    avatar: "priya",
    text: "i might have a work thing",
    x: 760,
    y: 740,
    rotation: -1,
    startFrame: 330,
  },
  {
    author: "Alex",
    avatar: "alex",
    text: "what about my dog? 🐕",
    x: 1100,
    y: 780,
    rotation: 3,
    startFrame: 360,
  },
  {
    author: "Jay",
    avatar: "jay",
    text: "let me check my schedule...",
    x: 580,
    y: 600,
    rotation: -2,
    startFrame: 388,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OpeningChatScene — 540 frames (18 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function OpeningChatScene() {
  const frame = useCurrentFrame();
  useVideoConfig();

  // ── Phase calculation ───────────────────────────────────────────────────────
  const drainProgress = interpolate(frame, [200, 270], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 3 — hesitant bubbles drain as ghost town fully settles
  const fallDrainProgress = interpolate(frame, [420, 460], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cameraZoom = interpolate(frame, [0, 180], [1.0, 1.04], {
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

        {/* Phase 2 — hesitant fall bubbles */}
        {FALL_BUBBLES.map((b, i) => (
          <ChatBubble
            key={`fall-${i}`}
            author={b.author}
            avatar={b.avatar}
            text={b.text}
            position={{ x: b.x, y: b.y }}
            rotation={b.rotation}
            startFrame={b.startFrame}
            variant="hesitant"
            size="normal"
            frame={frame}
            drainProgress={fallDrainProgress}
          />
        ))}
      </div>

      {/* Vignette — creeps in during the drain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 90%)",
          opacity: drainProgress,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      {/* Caption — cold open */}
      {frame >= 130 && frame < 240 && (
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
            opacity: interpolate(frame, [130, 155, 200, 230], [0, 1, 1, 0], {
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

      {/* Caption — the fall */}
      {frame >= 380 && frame <= 470 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "18%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.02em",
            fontStyle: "italic",
            opacity: interpolate(frame, [380, 405, 450, 470], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          And then it falls apart.
        </div>
      )}

      {/* "Until now." — hyperspace exit */}
      {frame >= 460 && frame <= 540 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "white",
              textAlign: "center",
              textShadow:
                "0 0 60px rgba(244,114,182,0.4), 0 0 120px rgba(244,114,182,0.2)",
              whiteSpace: "nowrap",
              opacity: interpolate(
                frame,
                [460, 485, 510, 522, 528],
                [0, 1, 1, 0.6, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              transform: `scale(${interpolate(
                frame,
                [460, 485, 510, 525],
                [0.85, 1, 1, 12],
                {
                  easing: Easing.in(Easing.cubic),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )})`,
              filter: `blur(${interpolate(
                frame,
                [460, 485, 510, 525],
                [4, 0, 0, 30],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )}px)`,
            }}
          >
            Until now.
          </div>
        </div>
      )}

      {/* Black overlay — scene ends in pure black */}
      {frame >= 515 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [515, 540], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 150,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
