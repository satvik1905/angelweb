import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface WarmGlowProps {
  centerX?: number;
  centerY?: number;
  intensity?: number;
}

export const WarmGlow: React.FC<WarmGlowProps> = ({
  centerX,
  centerY,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const cx = centerX ?? width / 2;
  const cy = centerY ?? height / 2;

  // 4-second breathing loop
  const breathePeriod = fps * 4;
  const breatheNormalized =
    (Math.sin((frame / breathePeriod) * Math.PI * 2) + 1) / 2;
  const opacity = (0.05 + breatheNormalized * 0.07) * intensity;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at ${cx}px ${cy}px,
          rgba(251, 146, 60, ${opacity}) 0%,
          rgba(251, 113, 133, ${opacity * 0.8}) 30%,
          rgba(244, 114, 182, ${opacity * 0.4}) 60%,
          transparent 80%)`,
      }}
    />
  );
};
