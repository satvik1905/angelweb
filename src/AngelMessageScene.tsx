import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Angel's message — split into lines for typewriter layout
// ─────────────────────────────────────────────────────────────────────────────
const ANGEL_MESSAGE_LINES = [
  "Hey Maya! I am reaching out because Adam activated Angel mode in the Monterey Group chat. 🌟",
  "",
  "Wanted to ask you a couple of questions to understand your availability and preferences for the trip.",
  "Can we start?",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera system
// ─────────────────────────────────────────────────────────────────────────────
type CamFrame = { frame: number; x: number; y: number; zoom: number };

const HEADER_Y = -180;
const ANGEL_MSG_Y = 0;
const MAYA_MSG_Y = 220;

const CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 0,   x: 0, y: 0,                   zoom: 1.0  },
  { frame: 12,  x: 0, y: 0,                   zoom: 1.0  },
  { frame: 33,  x: 0, y: -HEADER_Y * 1.4,    zoom: 1.6  },
  { frame: 57,  x: 0, y: -HEADER_Y * 1.4,    zoom: 1.6  },
  { frame: 75,  x: 0, y: 0,                   zoom: 1.05 },
  { frame: 87,  x: 0, y: -ANGEL_MSG_Y * 1.5, zoom: 1.5  },
  { frame: 172, x: 0, y: -ANGEL_MSG_Y * 1.5, zoom: 1.5  },
  { frame: 183, x: 0, y: 0,                   zoom: 1.05 },
  { frame: 195, x: 0, y: -MAYA_MSG_Y * 1.5,  zoom: 1.7  },
  { frame: 222, x: 0, y: -MAYA_MSG_Y * 1.5,  zoom: 1.7  },
  { frame: 243, x: 0, y: 0,                   zoom: 1.0  },
];

function getCameraAt(f: number): { x: number; y: number; zoom: number } {
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    const a = CAMERA_KEYFRAMES[i];
    const b = CAMERA_KEYFRAMES[i + 1];
    if (f >= a.frame && f <= b.frame) {
      const p = (f - a.frame) / (b.frame - a.frame);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        zoom: a.zoom + (b.zoom - a.zoom) * eased,
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom };
}

// ─────────────────────────────────────────────────────────────────────────────
// TypingDot
// ─────────────────────────────────────────────────────────────────────────────
const TypingDot = ({ delay, frame }: { delay: number; frame: number }) => {
  const bounce = Math.sin(((frame - delay) / 14) * Math.PI * 2);
  const y = Math.max(0, -bounce) * 6;
  const opacity = 0.5 + Math.max(0, bounce) * 0.5;
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FB923C, #F472B6)",
        transform: `translateY(${y}px)`,
        opacity,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AngelMessageTypewriter — fast char-by-char reveal with cursor
// ─────────────────────────────────────────────────────────────────────────────
const AngelMessageTypewriter = ({
  lines,
  startFrame,
  frame,
  framesPerChar = 0.28,
}: {
  lines: string[];
  startFrame: number;
  frame: number;
  framesPerChar?: number;
}) => {
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  const charsVisible = Math.max(0, (frame - startFrame) / framesPerChar);
  const isDone = charsVisible >= totalChars;

  // Blink cursor once typing finishes
  const cursorOpacity = isDone
    ? interpolate((frame % 24), [0, 12, 13, 24], [1, 1, 0, 0], clamp())
    : 1;

  let globalCharIdx = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {lines.map((line, lineIdx) => {
        if (line === "") {
          return <div key={lineIdx} style={{ height: 8 }} />;
        }

        const lineStartIdx = globalCharIdx;
        globalCharIdx += line.length;
        const lineEndIdx = globalCharIdx;

        const charsShownInLine = Math.max(
          0,
          Math.min(line.length, Math.floor(charsVisible) - lineStartIdx),
        );
        const isCurrentLine =
          Math.floor(charsVisible) >= lineStartIdx &&
          Math.floor(charsVisible) < lineEndIdx;

        if (charsShownInLine === 0 && !isCurrentLine) {
          return <div key={lineIdx} />;
        }

        return (
          <div
            key={lineIdx}
            style={{ display: "flex", flexWrap: "wrap", lineHeight: 1.5 }}
          >
            <span style={{ whiteSpace: "pre-wrap" }}>
              {line.slice(0, charsShownInLine)}
            </span>
            {isCurrentLine && (
              <span
                style={{
                  opacity: cursorOpacity,
                  color: "#F472B6",
                  fontWeight: 200,
                  lineHeight: 1,
                }}
              >
                |
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat bubble
// ─────────────────────────────────────────────────────────────────────────────
const ChatBubble = ({
  children,
  isAngel,
  style,
}: {
  children: React.ReactNode;
  isAngel?: boolean;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      maxWidth: 640,
      padding: "20px 28px",
      borderRadius: isAngel ? "4px 24px 24px 24px" : "24px 4px 24px 24px",
      background: isAngel
        ? "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(244,114,182,0.15))"
        : "rgba(255,255,255,0.08)",
      border: isAngel
        ? "1px solid rgba(244,114,182,0.35)"
        : "1px solid rgba(255,255,255,0.1)",
      boxShadow: isAngel
        ? "0 0 40px rgba(244,114,182,0.12), 0 8px 32px rgba(0,0,0,0.3)"
        : "0 4px 20px rgba(0,0,0,0.25)",
      backdropFilter: "blur(20px)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AngelMessageScene — 180 frames (6 seconds)
// ─────────────────────────────────────────────────────────────────────────────
export default function AngelMessageScene() {
  const frame = useCurrentFrame();

  // ── Camera ────────────────────────────────────────────────────────────────
  const cam = getCameraAt(frame);
  const prevCam = getCameraAt(Math.max(0, frame - 1));
  const camSpeed =
    Math.sqrt(
      Math.pow(cam.x - prevCam.x, 2) + Math.pow(cam.y - prevCam.y, 2),
    ) + Math.abs(cam.zoom - prevCam.zoom) * 60;
  const camBlur = Math.min(camSpeed / 8, 4);

  // ── Mist in (0–18) ────────────────────────────────────────────────────────
  const mistInOpacity = interpolate(frame, [0, 4, 12, 18], [0.6, 0.8, 0.6, 0], clamp());
  const mistInY = interpolate(frame, [0, 18], [60, -60], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // ── Background ambient glow ───────────────────────────────────────────────
  const ambientOpacity = interpolate(frame, [12, 38], [0, 1], clamp());

  // ── Header slide in (12–42) ──────────────────────────────────────────────
  const headerOpacity = interpolate(frame, [12, 33], [0, 1], clamp());
  const headerY = interpolate(frame, [12, 33], [-20, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Typing indicator (42–78) ──────────────────────────────────────────────
  const typingOpacity = interpolate(frame, [42, 54, 69, 78], [0, 1, 1, 0], clamp());
  const typingY = interpolate(frame, [42, 54], [12, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Angel message bubble (69–) ────────────────────────────────────────────
  const angelBubbleOpacity = interpolate(frame, [69, 84], [0, 1], clamp());
  const angelBubbleY = interpolate(frame, [69, 84], [14, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Maya reply (180–210) ─────────────────────────────────────────────────
  const mayaReplyOpacity = interpolate(frame, [180, 198], [0, 1], clamp());
  const mayaReplyY = interpolate(frame, [180, 198], [14, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });
  const mayaReplyWords = "Lets do it!! 😭✨".split(" ");

  // ── Mist out (232–270) ───────────────────────────────────────────────────
  const mistOutOpacity = interpolate(frame, [232, 244, 262, 270], [0, 0.5, 0.5, 0], clamp());
  const mistOutY = interpolate(frame, [232, 270], [-60, 60], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // ── Fade to black (248–270) ───────────────────────────────────────────────
  const fadeBlack = interpolate(frame, [248, 270], [0, 1], clamp());

  return (
    <AbsoluteFill
      style={{
        background: "#050508",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Ambient radial glow ───────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 60%, rgba(251,113,133,0.12) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 70% 40%, rgba(251,146,60,0.08) 0%, transparent 55%)",
          opacity: ambientOpacity,
          pointerEvents: "none",
        }}
      />

      {/* ── Mist in ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "-10%",
          width: "120%",
          height: "30%",
          transform: `translateY(${mistInY}%)`,
          background:
            "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 40%, #F472B6 70%, transparent 100%)",
          filter: "blur(60px)",
          opacity: mistInOpacity,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 200px",
        }}
      >
        {/* Camera wrapper */}
        <div
          style={{
            transformOrigin: "center center",
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
            filter: camBlur > 0.5 ? `blur(${camBlur}px)` : "none",
            width: "100%",
            maxWidth: 800,
          }}
        >
          <div style={{ width: "100%", maxWidth: 800 }}>

            {/* ── Chat header ──────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 48,
                opacity: headerOpacity,
                transform: `translateY(${headerY}px)`,
              }}
            >
              {/* Angel avatar */}
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(251,113,133,0.5), transparent)",
                    filter: "blur(12px)",
                    opacity: 0.8 + Math.sin(frame / 20) * 0.2,
                  }}
                />
                <img
                  src={staticFile("Avatar.svg")}
                  style={{ width: 64, height: 64, position: "relative", zIndex: 1 }}
                />
              </div>

              {/* Name + status */}
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.95)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Maya
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: "rgba(251,113,133,0.8)",
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#4ade80",
                      boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                    }}
                  />
                  <span>Chat with Angel ✦</span>
                </div>
              </div>
            </div>

            {/* ── Typing indicator ─────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 32,
                opacity: typingOpacity,
                transform: `translateY(${typingY}px)`,
              }}
            >
              <ChatBubble isAngel>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                  <TypingDot delay={0} frame={frame} />
                  <TypingDot delay={7} frame={frame} />
                  <TypingDot delay={14} frame={frame} />
                </div>
              </ChatBubble>
            </div>

            {/* ── Angel message bubble ─────────────────────────────────── */}
            {frame >= 69 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 36,
                  opacity: angelBubbleOpacity,
                  transform: `translateY(${angelBubbleY}px)`,
                }}
              >
                <ChatBubble isAngel>
                  {/* Label */}
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 14,
                      background: "linear-gradient(90deg, #FB923C, #F472B6)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <img
                      src={staticFile("Avatar.svg")}
                      style={{ width: 28, height: 28, filter: "brightness(1.2)" }}
                    />
                    Angel
                  </div>

                  {/* Fast char-by-char typewriter */}
                  <div style={{ fontSize: 26, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                    <AngelMessageTypewriter
                      lines={ANGEL_MESSAGE_LINES}
                      startFrame={78}
                      frame={frame}
                      framesPerChar={0.42}
                    />
                  </div>
                </ChatBubble>
              </div>
            )}

            {/* ── Maya's reply ─────────────────────────────────────────── */}
            {frame >= 180 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  opacity: mayaReplyOpacity,
                  transform: `translateY(${mayaReplyY}px)`,
                }}
              >
                <ChatBubble>
                  <div
                    style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
                  >
                    Maya
                  </div>
                  <div style={{ fontSize: 28, display: "flex", flexWrap: "wrap", gap: "0.2em" }}>
                    {mayaReplyWords.map((word, i) => {
                      const wStart = 189 + i * 9;
                      const wOpacity = interpolate(frame, [wStart, wStart + 8], [0, 1], clamp());
                      const wY = interpolate(frame, [wStart, wStart + 10], [8, 0], {
                        easing: Easing.out(Easing.cubic),
                        ...clamp(),
                      });
                      return (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            opacity: wOpacity,
                            transform: `translateY(${wY}px)`,
                            color: "rgba(255,255,255,0.92)",
                            lineHeight: 1.4,
                          }}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                </ChatBubble>
              </div>
            )}

          </div>
        </div>
        {/* end camera wrapper */}
      </AbsoluteFill>

      {/* ── Mist out ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "-10%",
          width: "120%",
          height: "40%",
          transform: `translateY(${mistOutY}%)`,
          background:
            "radial-gradient(ellipse at 50% 100%, #FB923C 0%, #FB7185 40%, #F472B6 70%, transparent 100%)",
          filter: "blur(60px)",
          opacity: mistOutOpacity,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* ── Fade to black ────────────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background: "#000000",
          opacity: fadeBlack,
          pointerEvents: "none",
          zIndex: 300,
        }}
      />
    </AbsoluteFill>
  );
}
