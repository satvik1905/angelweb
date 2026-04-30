import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { AngelScene } from "./AngelScene";
import IntroScene from "./IntroScene";
import { FullScene } from "./FullScene";
import TabletScene from "./TabletScene";
import ResolutionScene from "./ResolutionScene";
import ClosingCard from "./ClosingCard";
import AngelMessageScene from "./AngelMessageScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AngelScene"
        component={AngelScene}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IntroScene"
        component={IntroScene}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullScene"
        component={FullScene}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TabletScene"
        component={TabletScene}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ResolutionScene"
        component={ResolutionScene}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClosingCard"
        component={ClosingCard}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AngelMessageScene"
        component={AngelMessageScene}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
