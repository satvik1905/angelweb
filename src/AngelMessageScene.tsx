import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
} from "remotion";

function clamp(opts = {}): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...opts };
}

const ANGEL_MESSAGE_LINES = [
  ["Hey", "Maya", "👋"],
  ["I", "know", "$300", "feels", "tight,", "totally", "get", "it."],
  ["Wondering", "if", "you", "could", "stretch", "to", "$350?"],
  ["Everyone", "else", "is", "on", "board."],
];

// First word frame for each line (wordStart = 50 + globalIdx * 4)
const LINE_START_FRAMES = (() => {
  let priorWords = 0;
  return ANGEL_MESSAGE_LINES.map((line) => {
    const start = 50 + priorWords * 4;
    priorWords += line.length;
    return start;
  });
})();

// ─────────────────────────────────────────────────────────────────────────────
// AngelMessageScene — 180 frames (6s)
// ─────────────────────────────────────────────────────────────────────────────
export default function AngelMessageScene() {
  const frame = useCurrentFrame();

  // ── Subtle ambient shake ────────────────────────────────────────────────
  const shakeX = Math.sin(frame * 0.25) * 0.4;
  const shakeY = Math.cos(frame * 0.2) * 0.3;

  // ── Bubble entrance (10–25) ─────────────────────────────────────────────
  const bubbleIn = interpolate(frame, [10, 25], [0, 1], clamp());
  const bubbleSlideY = interpolate(frame, [10, 25], [10, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Label fade-in (40–55) ───────────────────────────────────────────────
  const labelOpacity = interpolate(frame, [40, 55], [0, 1], clamp());

  // ── Scene fade-out (165–180) ────────────────────────────────────────────
  const fadeOut = interpolate(frame, [165, 180], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });

  const bubbleOpacity = bubbleIn * fadeOut;

  // ── Cinematic camera arc ────────────────────────────────────────────────
  const cameraScale = interpolate(
    frame,
    [0, 35, 60, 145, 160, 175],
    [1.4, 1.4, 1.05, 1.05, 1.0, 8.0],
    { easing: Easing.inOut(Easing.cubic), ...clamp() }
  );

  const cameraY = interpolate(
    frame,
    [0, 60, 100, 145, 160, 175],
    [0, 0, -40, -60, -60, 0],
    { easing: Easing.inOut(Easing.cubic), ...clamp() }
  );

  const motionBlur = interpolate(frame, [155, 175], [0, 60], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });
  const entryBlur = interpolate(frame, [0, 50], [18, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const totalBlur = Math.max(entryBlur, motionBlur);

  const showMessage = frame >= 50;

  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Bottom ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "55%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(251,146,60,0.08) 0%, rgba(244,114,182,0.12) 40%, transparent 70%)",
          opacity: fadeOut,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Camera wrapper — cinematic arc, bubble only */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${cameraScale}) translateY(${cameraY}px)`,
          transformOrigin: "50% 48%",
          filter: totalBlur > 0.1 ? `blur(${totalBlur}px)` : "none",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        {/* Bubble container — auto-width, centers in camera wrapper */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "48%",
            transform: "translate(-50%, -50%)",
            maxWidth: 720,
            pointerEvents: "none",
          }}
        >
          {/* "Angel ✦" label */}
          <div
            style={{
              color: "rgba(244,114,182,0.95)",
              fontSize: 14,
              fontWeight: 600,
              marginLeft: 18,
              marginBottom: 8,
              opacity: labelOpacity * fadeOut,
              letterSpacing: "0.02em",
            }}
          >
            Angel ✦
          </div>

          {/* Single bubble — inline-block so it auto-sizes to content */}
          <div
            style={{
              padding: "18px 26px",
              borderRadius: 28,
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(244,114,182,0.3)",
              boxShadow:
                "0 4px 32px rgba(244,114,182,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.95)",
              fontSize: 20,
              fontWeight: 400,
              lineHeight: 1.5,
              display: "inline-block",
              opacity: bubbleOpacity,
              transform: `translateY(${bubbleSlideY}px)`,
            }}
          >
            {!showMessage ? (
              /* Typing dots */
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.85)",
                      opacity:
                        0.4 + 0.6 * Math.abs(Math.sin(frame / 6 + i * 0.6)),
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Only render lines that have started appearing */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ANGEL_MESSAGE_LINES.map((line, lineIdx) => {
                  if (frame < LINE_START_FRAMES[lineIdx]) return null;
                  const priorWords = ANGEL_MESSAGE_LINES.slice(0, lineIdx).reduce(
                    (sum, l) => sum + l.length,
                    0
                  );
                  return (
                    <div
                      key={lineIdx}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.32em",
                        alignItems: "baseline",
                      }}
                    >
                      {line.map((word, wordIdx) => {
                        const globalIdx = priorWords + wordIdx;
                        const wordStart = 50 + globalIdx * 4;
                        const wordOpacity = interpolate(
                          frame,
                          [wordStart, wordStart + 10],
                          [0, 1],
                          clamp()
                        );
                        const wordY = interpolate(
                          frame,
                          [wordStart, wordStart + 12],
                          [5, 0],
                          { easing: Easing.out(Easing.cubic), ...clamp() }
                        );
                        const isHighlight =
                          word === "Maya" || word === "$350?" || word === "$300";
                        return (
                          <span
                            key={wordIdx}
                            style={{
                              display: "inline-block",
                              opacity: wordOpacity * fadeOut,
                              transform: `translateY(${wordY}px)`,
                              ...(isHighlight
                                ? {
                                    backgroundImage:
                                      "linear-gradient(135deg, #FB923C, #FB7185, #F472B6)",
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                    fontWeight: 600,
                                  }
                                : {}),
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* end camera wrapper */}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
          zIndex: 80,
        }}
      />

      {/* Rapid zoom fade-to-black (frames 168–180) */}
      {frame >= 165 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [168, 180], [0, 1], {
              easing: Easing.in(Easing.cubic),
              ...clamp(),
            }),
            zIndex: 200,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
}
