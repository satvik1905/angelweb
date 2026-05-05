import "./index.css";
import React from "react";
import { Audio, Composition, interpolate, Sequence, Series, staticFile } from "remotion";
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
    <Series.Sequence durationInFrames={375}>
      <TabletScene />
    </Series.Sequence>
  </Series>
);

// Scene start frames (cumulative, 30fps):
// 0    OpeningChatScene  150f  → 0–5s
// 135  FallScene         165f  → 4.5–10s  (overlaps opening by 15f)
// 300  IntroScene        120f  → 10–14s
// 420  TabletScene       390f  → 14–27s
// 810  AngelMessageScene 255f  → 27–35.5s
// 1065 ResolutionScene   255f  → ends at 1320
// 1305 ClosingCard       180f  ← 15f overlap with ResolutionScene → ends at 1485
// Total FullVideo: 1485f
const FullVideo = () => (
  <>
    {/* Background music — fade in 1s, constant bed, fade out 1.5s */}
    <Audio
      src={staticFile("audio/background.mp3")}
      volume={(frame) => {
        const fadeInEnd = 30;       // 1s fade in
        const fadeOutStart = 1440;  // 1485 - 45 = 1.5s before end
        if (frame < fadeInEnd) {
          return interpolate(frame, [0, fadeInEnd], [0, 0.15], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        if (frame > fadeOutStart) {
          return interpolate(frame, [fadeOutStart, 1485], [0.15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        return 0.15;
      }}
      endAt={1485}
    />
    <Sequence from={0} durationInFrames={150}>
      <OpeningChatScene />
      <Sequence from={30}>
        <Audio src={staticFile("audio/01_opening.mp3")} />
      </Sequence>
    </Sequence>
    <Sequence from={135} durationInFrames={165}>
      <FallScene />
      <Audio src={staticFile("audio/02_fall.mp3")} />
    </Sequence>
    <Sequence from={300} durationInFrames={120}>
      <IntroScene />
      <Audio src={staticFile("audio/03_intro.mp3")} />
    </Sequence>
    <Sequence from={420} durationInFrames={390}>
      <TabletScene />
      <Audio src={staticFile("audio/04_tablet.mp3")} />
    </Sequence>
    <Sequence from={810} durationInFrames={255}>
      <AngelMessageScene />
      <Audio src={staticFile("audio/05_message.mp3")} />
    </Sequence>
    <Sequence from={1065} durationInFrames={255}>
      <ResolutionScene />
      <Audio src={staticFile("audio/06_resolution.mp3")} />
    </Sequence>
    <Sequence from={1305} durationInFrames={180}>
      <ClosingCard />
      <Audio src={staticFile("audio/07_closing.mp3")} />
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
        durationInFrames={165}
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
        durationInFrames={390}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ResolutionScene"
        component={ResolutionScene}
        durationInFrames={255}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClosingCard"
        component={ClosingCard}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AngelMessageScene"
        component={AngelMessageScene}
        durationInFrames={255}
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
        durationInFrames={795}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullVideo"
        component={FullVideo}
        durationInFrames={1485}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullVideoReel"
        component={FullVideo}
        durationInFrames={1485}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
