import React from "react";
import { Series } from "remotion";
import IntroScene from "./IntroScene";
import { AngelScene } from "./AngelScene";

export const FullScene: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={120}>
        <IntroScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={300}>
        <AngelScene />
      </Series.Sequence>
    </Series>
  );
};
