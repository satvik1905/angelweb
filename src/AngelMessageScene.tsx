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

// First word frame for each line (wordStart = 50 + globalIdx * 6)
const LINE_START_FRAMES = (() => {
  let priorWords = 0;
  return ANGEL_MESSAGE_LINES.map((line) => {
    const start = 50 + priorWords * 6;
    priorWords += line.length;
    return start;
  });
})();

// ─────────────────────────────────────────────────────────────────────────────
// AngelMessageScene — 255 frames (8.5s)
// 0–50f:   Entry blur clears, bubble slides in, typing dots
// 50–192f: Words cascade in (23 words × 6f stagger)
// 192–225f: Hold — full message readable
// 225–255f: Exit — camera pulls back to 8x, fade to black
// ─────────────────────────────────────────────────────────────────────────────
export default function AngelMessageScene() {
  const frame = useCurrentFrame();

  // ── Subtle ambient breathe (very gentle — camera does the heavy lifting) ──
  const shakeX = Math.sin(frame * 0.15) * 0.3;
  const shakeY = Math.cos(frame * 0.12) * 0.2;

  // ── Bubble entrance (10–28) ─────────────────────────────────────────────
  const bubbleIn = interpolate(frame, [10, 28], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const bubbleSlideY = interpolate(frame, [10, 28], [12, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Label fade-in (40–55) ───────────────────────────────────────────────
  const labelOpacity = interpolate(frame, [40, 55], [0, 1], clamp());

  // ── Scene fade-out (240–255) ────────────────────────────────────────────
  const fadeOut = interpolate(frame, [240, 255], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });

  const bubbleOpacity = bubbleIn * fadeOut;

  // ── Cinematic camera — piecewise so each segment eases independently ────
  // Phase 1: zoomed in tight on entry (0–35f hold, 35–60f ease back)
  const cameraScaleEntry = interpolate(frame, [0, 35, 60], [1.4, 1.4, 1.05], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  // Phase 2: hold during message read, then exit zoom (225–252f)
  const cameraScaleExit = interpolate(frame, [225, 237, 252], [1.05, 1.0, 8.0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });
  const cameraScale = frame < 225 ? cameraScaleEntry : cameraScaleExit;

  // Camera Y drift — slow upward pan while reading, ease out at exit
  const cameraYDrift = interpolate(frame, [0, 60, 140, 225], [0, 0, -50, -65], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });
  const cameraYExit = interpolate(frame, [225, 252], [-65, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp(),
  });
  const cameraY = frame < 225 ? cameraYDrift : cameraYExit;

  // Motion blur only during exit zoom — separated from drift phase
  const motionBlur = interpolate(frame, [230, 252], [0, 55], {
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
                        const wordStart = 50 + globalIdx * 6;
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

      {/* Fade-to-black during exit zoom (240–255) */}
      {frame >= 240 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            opacity: interpolate(frame, [243, 255], [0, 1], {
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
