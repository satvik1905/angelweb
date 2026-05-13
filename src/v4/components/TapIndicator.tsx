import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface TapIndicatorProps {
  x: number;
  y: number;
  size?: number;
  tapFrame?: number;
  visible?: boolean;
  color?: 'default' | 'dark';
}

export const TapIndicator: React.FC<TapIndicatorProps> = ({
  x,
  y,
  size = 60,
  tapFrame,
  visible = true,
  color = 'default',
}) => {
  const frame = useCurrentFrame();

  if (!visible) return null;

  // Idle pulse: 1.0 → 1.05 → 1.0 on a 1.5-second loop (45 frames at 30fps)
  const idlePulse =
    1 + Math.sin((frame / 45) * Math.PI * 2) * 0.05;

  // Tap pulse animation
  let tapScale = 1;
  let rippleOpacity = 0;
  let rippleScale = 0;

  if (tapFrame !== undefined) {
    const dt = frame - tapFrame;

    if (dt >= 0 && dt < 4) {
      // Press: scale up to 1.4x over 4 frames
      tapScale = interpolate(dt, [0, 4], [1, 1.4], {
        easing: Easing.out(Easing.cubic),
        extrapolateRight: 'clamp',
      });
    } else if (dt >= 4 && dt < 10) {
      // Release: scale back to 1.0x over 6 frames
      tapScale = interpolate(dt, [4, 10], [1.4, 1.0], {
        easing: Easing.out(Easing.cubic),
        extrapolateRight: 'clamp',
      });
    }

    // Ripple: expands and fades over 12 frames after tap
    if (dt >= 0 && dt < 12) {
      rippleScale = interpolate(dt, [0, 12], [1, 3], {
        easing: Easing.out(Easing.cubic),
        extrapolateRight: 'clamp',
      });
      rippleOpacity = interpolate(dt, [0, 4, 12], [0, 0.4, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  const finalScale = tapFrame !== undefined && frame >= tapFrame ? tapScale : idlePulse;
  const r = size / 2;

  return (
    <>
      {/* Ripple ring */}
      {rippleOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: x - r,
            top: y - r,
            width: size,
            height: size,
            borderRadius: '50%',
            border: `2px solid ${color === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(251, 113, 133, 0.6)'}`,
            transform: `scale(${rippleScale})`,
            transformOrigin: 'center center',
            opacity: rippleOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main indicator */}
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color === 'dark'
            ? 'radial-gradient(circle, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 50%, rgba(0,0,0,0.10) 100%)'
            : 'radial-gradient(circle, rgba(251,146,60,0.35) 0%, rgba(251,113,133,0.25) 50%, rgba(244,114,182,0.15) 100%)',
          boxShadow: color === 'dark'
            ? '0 0 20px rgba(0,0,0,0.2), inset 0 0 10px rgba(255,255,255,0.2)'
            : '0 0 20px rgba(251,113,133,0.3), inset 0 0 10px rgba(255,255,255,0.3)',
          border: color === 'dark'
            ? '2px solid rgba(0,0,0,0.3)'
            : '2px solid rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)',
          transform: `scale(${finalScale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
