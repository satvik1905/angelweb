import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Angel's response — split into lines for staggered reveal
// ─────────────────────────────────────────────────────────────────────────────
const ANGEL_MESSAGE_LINES = [
  "Hey Maya! I am reaching out because Adam activated Angel mode in the Monterey Group chat. 🌟",
  "",
  "Wanted to ask you couple of questions to understand your availability and preferences for the trip.",
  "Can we start?",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clamp(): Parameters<typeof interpolate>[3] {
  return { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
}

// ─────────────────────────────────────────────────────────────────────────────
// TypingDot
// ─────────────────────────────────────────────────────────────────────────────
const TypingDot = ({ delay, frame }: { delay: number; frame: number }) => {
  const bounce = Math.sin(((frame - delay) / 20) * Math.PI * 2);
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
// AngelMessage — word-by-word reveal
// ─────────────────────────────────────────────────────────────────────────────
const AngelMessage = ({
  lines,
  startFrame,
  frame,
  wordsPerSecond = 4,
}: {
  lines: string[];
  startFrame: number;
  frame: number;
  wordsPerSecond?: number;
}) => {
  const fps = 30;
  const framesPerWord = fps / wordsPerSecond;

  let globalWordIdx = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {lines.map((line, lineIdx) => {
        if (line === "") {
          globalWordIdx; // no increment
          return <div key={lineIdx} style={{ height: 8 }} />;
        }

        const words = line.split(" ");
        const rendered = words.map((word, wordIdx) => {
          const idx = globalWordIdx++;
          const wordStart = startFrame + idx * framesPerWord;
          const opacity = interpolate(
            frame,
            [wordStart, wordStart + 8],
            [0, 1],
            clamp(),
          );
          const y = interpolate(frame, [wordStart, wordStart + 12], [8, 0], {
            easing: Easing.out(Easing.cubic),
            ...clamp(),
          });
          const blur = interpolate(
            frame,
            [wordStart, wordStart + 10],
            [6, 0],
            clamp(),
          );

          return (
            <span
              key={wordIdx}
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${y}px)`,
                filter: `blur(${blur}px)`,
                whiteSpace: "pre",
                marginRight: wordIdx < words.length - 1 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        });

        return (
          <div
            key={lineIdx}
            style={{ display: "flex", flexWrap: "wrap", lineHeight: 1.5 }}
          >
            {rendered}
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
// AngelMessageScene
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Camera system
// ─────────────────────────────────────────────────────────────────────────────
type CamFrame = { frame: number; x: number; y: number; zoom: number };

const HEADER_Y = -180;
const ANGEL_MSG_Y = 0;
const MAYA_MSG_Y = 220;

const CAMERA_KEYFRAMES: CamFrame[] = [
  { frame: 0,   x: 0, y: 0,                   zoom: 1.0 },
  { frame: 30,  x: 0, y: 0,                   zoom: 1.0 },
  { frame: 60,  x: 0, y: -HEADER_Y * 1.4,    zoom: 1.6 },
  { frame: 95,  x: 0, y: -HEADER_Y * 1.4,    zoom: 1.6 },
  { frame: 120, x: 0, y: 0,                   zoom: 1.05 },
  { frame: 150, x: 0, y: -ANGEL_MSG_Y * 1.5, zoom: 1.5 },
  { frame: 360, x: 0, y: -ANGEL_MSG_Y * 1.5, zoom: 1.5 },
  { frame: 380, x: 0, y: 0,                   zoom: 1.05 },
  { frame: 410, x: 0, y: -MAYA_MSG_Y * 1.5,  zoom: 1.7 },
  { frame: 445, x: 0, y: -MAYA_MSG_Y * 1.5,  zoom: 1.7 },
  { frame: 470, x: 0, y: 0,                   zoom: 1.0 },
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

  // ── Mist in (0–30) ────────────────────────────────────────────────────────
  const mistInOpacity = interpolate(
    frame,
    [0, 5, 25, 32],
    [0.6, 0.8, 0.6, 0],
    clamp(),
  );
  const mistInY = interpolate(frame, [0, 30], [60, -60], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // ── Background ambient glow ───────────────────────────────────────────────
  const ambientOpacity = interpolate(frame, [20, 60], [0, 1], clamp());

  // ── Header slide in (30–70) ───────────────────────────────────────────────
  const headerOpacity = interpolate(frame, [30, 60], [0, 1], clamp());
  const headerY = interpolate(frame, [30, 60], [-20, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Typing indicator (70–135) ─────────────────────────────────────────────
  const typingOpacity = interpolate(
    frame,
    [70, 85, 120, 135],
    [0, 1, 1, 0],
    clamp(),
  );
  const typingY = interpolate(frame, [70, 85], [12, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Angel message bubble (115–360) ────────────────────────────────────────
  const angelBubbleOpacity = interpolate(frame, [115, 135], [0, 1], clamp());
  const angelBubbleY = interpolate(frame, [115, 135], [16, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  // ── Maya reply (380–440) ──────────────────────────────────────────────────
  const mayaReplyOpacity = interpolate(frame, [380, 400], [0, 1], clamp());
  const mayaReplyY = interpolate(frame, [380, 405], [16, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp(),
  });

  const mayaReplyWords = "Lets do it!! 😭✨".split(" ");

  // ── Mist out (460–510) ────────────────────────────────────────────────────
  const mistOutOpacity = interpolate(
    frame,
    [460, 475, 505, 510],
    [0, 0.5, 0.5, 0],
    clamp(),
  );
  const mistOutY = interpolate(frame, [460, 510], [-60, 60], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp(),
  });

  // ── Final fade to black (490–510) ─────────────────────────────────────────
  const fadeBlack = interpolate(frame, [490, 510], [0, 1], clamp());

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

      {/* ── Mist in (frames 0–32) ────────────────────────────────────────── */}
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

      {/* ── Main content — centered column ──────────────────────────────── */}
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
          {/* ── Chat header ─────────────────────────────────────────────── */}
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
            <div
              style={{
                position: "relative",
                width: 64,
                height: 64,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(251,113,133,0.5), transparent)",
                  filter: "blur(12px)",
                  opacity: 0.8 + Math.sin(frame / 30) * 0.2,
                }}
              />
              <img
                src={staticFile("Avatar.svg")}
                style={{
                  width: 64,
                  height: 64,
                  position: "relative",
                  zIndex: 1,
                }}
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

          {/* ── Typing indicator ─────────────────────────────────────────── */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "4px 0",
                }}
              >
                <TypingDot delay={0} frame={frame} />
                <TypingDot delay={8} frame={frame} />
                <TypingDot delay={16} frame={frame} />
              </div>
            </ChatBubble>
          </div>

          {/* ── Angel message bubble ─────────────────────────────────────── */}
          {frame >= 115 && (
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

                {/* Word-by-word message */}
                <div
                  style={{
                    fontSize: 26,
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.6,
                  }}
                >
                  <AngelMessage
                    lines={ANGEL_MESSAGE_LINES}
                    startFrame={135}
                    frame={frame}
                    wordsPerSecond={4}
                  />
                </div>
              </ChatBubble>
            </div>
          )}

          {/* ── Maya's reply ─────────────────────────────────────────────── */}
          {frame >= 380 && (
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
                  style={{
                    fontSize: 22,
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: 4,
                  }}
                >
                  Maya
                </div>
                <div
                  style={{
                    fontSize: 28,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.2em",
                  }}
                >
                  {mayaReplyWords.map((word, i) => {
                    const wStart = 390 + i * 8;
                    const wOpacity = interpolate(
                      frame,
                      [wStart, wStart + 10],
                      [0, 1],
                      clamp(),
                    );
                    const wY = interpolate(
                      frame,
                      [wStart, wStart + 12],
                      [8, 0],
                      {
                        easing: Easing.out(Easing.cubic),
                        ...clamp(),
                      },
                    );
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
        {/* end camera wrapper */}
        </div>
      </AbsoluteFill>

      {/* ── Mist out (460–510) ───────────────────────────────────────────── */}
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
