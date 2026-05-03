import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Concern orbs — each represents a conflict that killed the trip
// ─────────────────────────────────────────────────────────────────────────────
const CONCERN_ORBS = [
  {
    author: "Jay",
    avatar: "jay",
    text: "actually... can we push it?",
    x: 700,
    y: 400,
    rotation: -2,
    startFrame: 5,
  },
  {
    author: "Sam",
    avatar: "sam",
    text: "is $300 ok for everyone?",
    x: 1200,
    y: 550,
    rotation: 2,
    startFrame: 35,
  },
  {
    author: "Priya",
    avatar: "priya",
    text: "i might have a work thing",
    x: 760,
    y: 680,
    rotation: -1,
    startFrame: 65,
  },
  {
    author: "Alex",
    avatar: "alex",
    text: "what about my dog? 🐕",
    x: 1100,
    y: 720,
    rotation: 3,
    startFrame: 95,
  },
  {
    author: "Jay",
    avatar: "jay",
    text: "let me check my schedule...",
    x: 580,
    y: 560,
    rotation: -2,
    startFrame: 125,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FallScene — 165 frames (5.5 seconds)
// 0–141f  (0–4.7s):  Concern orbs cascade in (30f / 1s stagger)
// 30–148f:           "And then it falls apart." caption
// 143–160f:          Drain — orbs dissipate
// 153–165f:          "Until now." hyperspace zoom-out + fade to black
// ─────────────────────────────────────────────────────────────────────────────
export default function FallScene() {
  const frame = useCurrentFrame();

  // Drain starts after last orb (f125) has settled (~f141)
  const drainProgress = interpolate(frame, [143, 160], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // "And then it falls apart." caption — fades in early, out before drain
  const captionOpacity = interpolate(
    frame,
    [30, 45, 138, 150],
    [0, 1, 1, 0],
    clamp(),
  );

  // "Until now." zoom-out — begins as drain completes
  const untilNowOpacity = interpolate(
    frame,
    [153, 158, 161, 165],
    [0, 1, 1, 0],
    clamp(),
  );
  const untilNowScale = interpolate(
    frame,
    [153, 158, 161, 165],
    [0.85, 1, 1, 12],
    { easing: Easing.in(Easing.cubic), ...clamp() },
  );
  const untilNowBlur = interpolate(
    frame,
    [153, 158, 161, 165],
    [4, 0, 0, 30],
    clamp(),
  );

  // Fade to black at end
  const blackOpacity = interpolate(frame, [158, 165], [0, 1], clamp());

  // Vignette tightens as orbs drain
  const vignetteOpacity = interpolate(frame, [110, 158], [0, 0.75], clamp());

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Black background fades in over first 15 frames (overlap window with OpeningChatScene) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
          opacity: interpolate(frame, [0, 15], [0, 1], clamp()),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Concern orbs */}
      {CONCERN_ORBS.map((orb, i) => {
        const appear = interpolate(
          frame,
          [orb.startFrame, orb.startFrame + 12],
          [0, 1],
          clamp(),
        );

        // Entry: slides down from above (fast, no linger in mid-air)
        const entryY = interpolate(
          frame,
          [orb.startFrame, orb.startFrame + 15],
          [-100, 0],
          { easing: Easing.out(Easing.cubic), ...clamp() },
        );

        // Gentle hover after entry
        const floatY = Math.sin(frame / 40 + i * 1.2) * 4;

        const drainedOpacity = 1 - drainProgress * 0.95;

        // iOS scale punch on entry
        const scalePunch = (() => {
          if (frame < orb.startFrame) return 0;
          if (frame < orb.startFrame + 8)
            return interpolate(
              frame,
              [orb.startFrame, orb.startFrame + 8],
              [0, 1.08],
              { easing: Easing.out(Easing.cubic), ...clamp() },
            );
          if (frame < orb.startFrame + 16)
            return interpolate(
              frame,
              [orb.startFrame + 8, orb.startFrame + 16],
              [1.08, 1.0],
              { easing: Easing.out(Easing.cubic), ...clamp() },
            );
          return 1.0;
        })();

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x,
              top: orb.y + entryY + floatY,
              transform: `translate(-50%, -50%) rotate(${orb.rotation}deg) scale(${scalePunch})`,
              opacity: appear * drainedOpacity,
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              maxWidth: 440,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.95)",
                overflow: "hidden",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={staticFile(`avatars/${orb.avatar}.png`)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Bubble */}
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
                {orb.author}
              </div>
              <div
                style={{
                  padding: "11px 16px",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap",
                }}
              >
                {orb.text}
              </div>
            </div>
          </div>
        );
      })}

      {/* "And then it falls apart." */}
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
          opacity: captionOpacity,
          zIndex: 100,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        And then it falls apart.
      </div>

      {/* Vignette tightens as orbs drain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 90%)",
          opacity: vignetteOpacity,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      {/* "Until now." — hyperspace zoom-out, synced to "dies" VO */}
      {frame >= 153 && (
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
              opacity: untilNowOpacity,
              transform: `scale(${untilNowScale})`,
              filter: `blur(${untilNowBlur}px)`,
            }}
          >
            Until now.
          </div>
        </div>
      )}

      {/* Dark hold — before IntroScene */}
      {frame >= 158 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: blackOpacity,
            zIndex: 150,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
