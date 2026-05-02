import "./index.css";
import React from "react";
import { Audio, Composition, Sequence, Series, staticFile } from "remotion";
import { AngelScene } from "./AngelScene";
import IntroScene from "./IntroScene";
import { FullScene } from "./FullScene";
import TabletScene from "./TabletScene";
import ResolutionScene from "./ResolutionScene";
import ClosingCard from "./ClosingCard";
import AngelMessageScene from "./AngelMessageScene";
import OpeningChatScene from "./OpeningChatScene";
import FallScene from "./FallScene";

const OpeningPlusIntroPlusTablet = () => (
  <Series>
    <Series.Sequence durationInFrames={150}>
      <OpeningChatScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={150}>
      <FallScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={120}>
      <IntroScene />
    </Series.Sequence>
    <Series.Sequence durationInFrames={445}>
      <TabletScene />
    </Series.Sequence>
  </Series>
);

// Scene start frames (cumulative, 30fps):
// 0    OpeningChatScene  150f  → 0–5s    "Group trips start with hype…"
// 150  FallScene         150f  → 5–10s   "Dates don't align… The trip dies."
// 300  IntroScene        120f  → 10–14s  "Introducing Angel Mode…"
// 420  TabletScene       445f  → 14–28.8s
// 865  AngelMessageScene 180f  → 28.8–34.8s
// 1045 ResolutionScene   150f  → ends at 1195
// 1180 ClosingCard       240f  ← 15f overlap with ResolutionScene → ends at 1420
// Total FullVideo: 1420f
const FullVideo = () => (
  <>
    {/* Voiceover — top level, outside all Sequences so it spans the full timeline */}
    <Audio src={staticFile("audio/Audio.mp3")} />

    <Sequence from={0} durationInFrames={150}>
      <OpeningChatScene />
    </Sequence>
    <Sequence from={150} durationInFrames={150}>
      <FallScene />
    </Sequence>
    <Sequence from={300} durationInFrames={120}>
      <IntroScene />
    </Sequence>
    <Sequence from={420} durationInFrames={445}>
      <TabletScene />
    </Sequence>
    <Sequence from={865} durationInFrames={180}>
      <AngelMessageScene />
    </Sequence>
    <Sequence from={1045} durationInFrames={150}>
      <ResolutionScene />
    </Sequence>
    <Sequence from={1180} durationInFrames={240}>
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
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FallScene"
        component={FallScene}
        durationInFrames={150}
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
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="OpeningPlusIntroPlusTablet"
        component={OpeningPlusIntroPlusTablet}
        durationInFrames={865}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullVideo"
        component={FullVideo}
        durationInFrames={1420}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
