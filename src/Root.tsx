import "./index.css";
import React from "react";
import { Composition, Series } from "remotion";
import { AngelScene } from "./AngelScene";
import IntroScene from "./IntroScene";
import { FullScene } from "./FullScene";
import TabletScene from "./TabletScene";
import ResolutionScene from "./ResolutionScene";
import ClosingCard from "./ClosingCard";
import AngelMessageScene from "./AngelMessageScene";
import OpeningChatScene from "./OpeningChatScene";

const OpeningPlusIntroPlusTablet = () => (
  <Series>
    <Series.Sequence durationInFrames={540}>
      <OpeningChatScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={180}>
      <IntroScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={660}>
      <TabletScene />
    </Series.Sequence>
  </Series>
);

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
        durationInFrames={180}
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
      <Composition
        id="OpeningChatScene"
        component={OpeningChatScene}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="OpeningPlusIntroPlusTablet"
        component={OpeningPlusIntroPlusTablet}
        durationInFrames={1380}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
