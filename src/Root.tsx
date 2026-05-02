import "./index.css";
import React from "react";
import { Composition, Sequence, Series } from "remotion";
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
    <Series.Sequence durationInFrames={255}>
      <IntroScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={660}>
      <TabletScene />
    </Series.Sequence>
  </Series>
);

// Scene start frames (cumulative):
// 0    OpeningChatScene  540f
// 540  IntroScene        285f
// 825  TabletScene       445f
// 1270 AngelMessageScene 180f
// 1450 ResolutionScene   150f  → ends at 1600
// 1585 ClosingCard       240f  ← starts 15f before ResolutionScene ends (overlap)
// Total: 1585 + 240 = 1825
const FullVideo = () => (
  <>
    <Sequence from={0} durationInFrames={540}>
      <OpeningChatScene />
    </Sequence>
    <Sequence from={540} durationInFrames={285}>
      <IntroScene />
    </Sequence>
    <Sequence from={825} durationInFrames={445}>
      <TabletScene />
    </Sequence>
    <Sequence from={1270} durationInFrames={180}>
      <AngelMessageScene />
    </Sequence>
    <Sequence from={1450} durationInFrames={150}>
      <ResolutionScene />
    </Sequence>
    <Sequence from={1585} durationInFrames={240}>
      <ClosingCard />
    </Sequence>
  </>
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
        durationInFrames={285}
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
        durationInFrames={445}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ResolutionScene"
        component={ResolutionScene}
        durationInFrames={150}
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
        durationInFrames={180}
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
        durationInFrames={1455}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullVideo"
        component={FullVideo}
        durationInFrames={1825}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
