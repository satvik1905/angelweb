import React from "react";
import { staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, TYPOGRAPHY, BRAND_GRADIENT } from "../tokens";

// All measurements in source pixel space (1532 × 3140)
const SHEET_TOP = 1900;
const SHEET_RADIUS = 80;
const HANDLE_WIDTH = 160;
const HANDLE_HEIGHT = 12;
const HANDLE_TOP = 40;

const ROW_HEIGHT = 180;
const ICON_SIZE = 80;
const ICON_LEFT = 80;
const TEXT_LEFT = 200;
const PADDING_H = 80;

const TOGGLE_RIGHT = 80;

interface MenuItem {
  icon: string;
  label: string;
  destructive?: boolean;
  toggle?: boolean;
}

const SECTION_1: MenuItem[] = [
  { icon: "details.svg", label: "View Details" },
  { icon: "mute.svg", label: "Mute" },
  { icon: "rename.svg", label: "Rename" },
];

const SECTION_2: MenuItem[] = [
  { icon: "new.svg", label: "Start new chat" },
  { icon: "wings.svg", label: "Angel Mode", toggle: true },
];

const SECTION_3: MenuItem[] = [
  { icon: "clear.svg", label: "Clear Chat", destructive: true },
  { icon: "leave.svg", label: "Leave Chat", destructive: true },
];

// Screen rectangle constants (must match PhoneScene)
const SCREEN_TOP = 80;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

interface AngelModeSheetProps {
  phoneScale: number;
  phoneW: number;  // width of the screen clipping area (already scaled)
  phoneH: number;  // height of the screen clipping area (already scaled)
  activationFrame?: number; // frame when toggle activation starts (Step 9a)
}

export const AngelModeSheet: React.FC<AngelModeSheetProps> = ({
  phoneScale,
  phoneW,
  phoneH,
  activationFrame,
}) => {
  const frame = useCurrentFrame();
  const s = phoneScale; // shorthand
  // Sheet top relative to screen clipping container
  const sheetTopInContainer = (SHEET_TOP - SCREEN_TOP) * s;

  // Activation animations (only computed when activationFrame is set)
  const af = activationFrame ?? Infinity;

  // Toggle crossfade: off fades out f430–f438, on fades in f435–f445
  const toggleOffOpacity = interpolate(frame, [af, af + 8], [1, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const toggleOnOpacity = interpolate(frame, [af + 5, af + 15], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // Row gradient wash: clip-path sweeps left→right over f432–f450
  const gradientReveal = interpolate(frame, [af + 2, af + 20], [100, 0], {
    easing: Easing.inOut(Easing.cubic),
    ...CL,
  });

  const renderRow = (item: MenuItem, idx: number) => {
    const color = item.destructive ? COLORS.destructive : COLORS.textPrimary;
    const isAngelMode = item.toggle === true;

    return (
      <div
        key={idx}
        style={{
          position: "relative",
          width: "100%",
          height: ROW_HEIGHT * s,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Gradient wash for Angel Mode row — soft pastel with rounded corners */}
        {isAngelMode && activationFrame !== undefined && frame >= af && (
          <div
            style={{
              position: "absolute",
              left: PADDING_H * 0.5 * s,
              top: 4 * s,
              right: PADDING_H * 0.5 * s,
              bottom: 4 * s,
              borderRadius: 30 * s,
              background: `linear-gradient(90deg, rgba(251,146,60,0.18) 0%, rgba(251,113,133,0.22) 50%, rgba(244,114,182,0.18) 100%)`,
              clipPath: `inset(0 ${gradientReveal}% 0 0 round ${30 * s}px)`,
            }}
          />
        )}

        <img
          src={staticFile(`icons/${item.icon}`)}
          style={{
            position: "absolute",
            left: ICON_LEFT * s,
            top: "50%",
            transform: "translateY(-50%)",
            width: ICON_SIZE * s,
            height: ICON_SIZE * s,
            filter: item.destructive
              ? "brightness(0) saturate(100%) invert(26%) sepia(89%) saturate(6000%) hue-rotate(355deg) brightness(101%) contrast(101%)"
              : "brightness(0)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: TEXT_LEFT * s,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: 56 * s,
            fontWeight: TYPOGRAPHY.menuItem.weight,
            color,
            whiteSpace: "nowrap",
          }}
        >
          {item.label}
        </span>
        {item.toggle && (
          <>
            {/* Toggle off — fades out during activation */}
            <img
              src={staticFile("icons/toggle_off.svg")}
              style={{
                position: "absolute",
                right: TOGGLE_RIGHT * s,
                top: "50%",
                transform: "translateY(-50%)",
                height: ICON_SIZE * 1.6 * s,
                width: "auto",
                opacity: activationFrame !== undefined ? toggleOffOpacity : 1,
              }}
            />
            {/* Toggle on — fades in during activation */}
            {activationFrame !== undefined && frame >= af && (
              <img
                src={staticFile("icons/toggle_on.svg")}
                style={{
                  position: "absolute",
                  right: TOGGLE_RIGHT * s,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: ICON_SIZE * 1.6 * s,
                  width: "auto",
                  opacity: toggleOnOpacity,
                }}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const renderDivider = (key: string) => (
    <div
      key={key}
      style={{
        width: `calc(100% - ${PADDING_H * 2 * s}px)`,
        height: 1 * s,
        marginLeft: PADDING_H * s,
        background: COLORS.divider,
      }}
    />
  );

  return (
    <>
      {/* Bottom sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: sheetTopInContainer,
          width: phoneW,
          bottom: 0,
          background: COLORS.background,
          borderTopLeftRadius: SHEET_RADIUS * s,
          borderTopRightRadius: SHEET_RADIUS * s,
          boxShadow: "0 -20px 40px rgba(251, 113, 133, 0.08)",
          zIndex: 11,
          overflow: "hidden",
        }}
      >
        {/* Grab handle */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: HANDLE_TOP * s,
            transform: "translateX(-50%)",
            width: HANDLE_WIDTH * s,
            height: HANDLE_HEIGHT * s,
            borderRadius: (HANDLE_HEIGHT / 2) * s,
            background: COLORS.divider,
          }}
        />

        {/* Menu content — starts below handle */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: (HANDLE_TOP + HANDLE_HEIGHT + 20) * s,
            width: "100%",
          }}
        >
          {SECTION_1.map((item, i) => renderRow(item, i))}
          {renderDivider("div1")}
          {SECTION_2.map((item, i) => renderRow(item, i + 10))}
          {renderDivider("div2")}
          {SECTION_3.map((item, i) => renderRow(item, i + 20))}
        </div>
      </div>
    </>
  );
};
