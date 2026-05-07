import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface LightBloomProps {
  x: number;
  y: number;
  activationFrame: number;
  maxRadius?: number;
  duration?: number;
}

export const LightBloom: React.FC<LightBloomProps> = ({
  x,
  y,
  activationFrame,
  maxRadius = 600,
  duration = 24,
}) => {
  const frame = useCurrentFrame();
  const dt = frame - activationFrame;

  if (dt < 0 || dt > duration) return null;

  const radius = interpolate(dt, [0, duration], [0, maxRadius], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(
    dt,
    [0, duration * 0.3, duration],
    [0, 0.3, 0],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const diameter = radius * 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - radius,
        top: y - radius,
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        background: `radial-gradient(circle,
          rgba(251, 146, 60, 0.6) 0%,
          rgba(251, 113, 133, 0.4) 35%,
          rgba(244, 114, 182, 0.2) 65%,
          transparent 100%)`,
        opacity,
        pointerEvents: 'none',
        filter: 'blur(20px)',
      }}
    />
  );
};
