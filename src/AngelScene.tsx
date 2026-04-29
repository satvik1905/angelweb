import React from "react";
import { AbsoluteFill } from "remotion";
import Background from "./Background";
import FloatingAvatars from "./FloatingAvatars";
import AngelAvatar from "./AngelAvatar";

export const AngelScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <FloatingAvatars />
      <AngelAvatar />
    </AbsoluteFill>
  );
};
