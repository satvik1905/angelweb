import "./index.css";
import React from "react";
import { AbsoluteFill, Audio, Composition, interpolate, Sequence, Series, staticFile } from "remotion";
import { AngelScene } from "./AngelScene";
import IntroScene from "./IntroScene";
import { FullScene } from "./FullScene";
import TabletScene from "./TabletScene";
import ResolutionScene from "./ResolutionScene";
import ClosingCard from "./ClosingCard";
import AngelMessageScene from "./AngelMessageScene";
import OpeningChatScene from "./OpeningChatScene";
import FallScene from "./FallScene";
import { PhoneScene } from "./v4/PhoneScene";
import { AngelMessageScene as AngelMessageSceneV4 } from "./v4/AngelMessageScene";
import { CelebrationScene } from "./v4/CelebrationScene";
import BubbleSwarmScene from "./BubbleSwarmScene";
import { ChatBannerScene } from "./v4/ChatBannerScene";
import { HostDashboardScene } from "./v4/HostDashboardScene";


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
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    {/* Background music — fade in 1s, constant bed, fade out 1.5s */}
    <Audio
      src={staticFile("audio/background.mp3")}
      volume={(frame) => {
        const fadeInEnd = 30;       // 1s fade in
        const fadeOutStart = 1495;  // 1540 - 45 = 1.5s before end
        if (frame < fadeInEnd) {
          return interpolate(frame, [0, fadeInEnd], [0, 0.15], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        if (frame > fadeOutStart) {
          return interpolate(frame, [fadeOutStart, 1540], [0.15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        return 0.15;
      }}
      endAt={1540}
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
    <Sequence from={420} durationInFrames={369}>
      <PhoneScene />
      <Audio src={staticFile("audio/04_tablet.mp3")} />
    </Sequence>
    <Sequence from={789} durationInFrames={240}>
      <AngelMessageSceneV4 />
      <Audio src={staticFile("audio/05_message.mp3")} />
    </Sequence>
    <Sequence from={1029} durationInFrames={255}>
      <ResolutionScene />
      <Audio src={staticFile("audio/06_resolution.mp3")} />
    </Sequence>
    <Sequence from={1269} durationInFrames={175}>
      <CelebrationScene />
      <Audio
        src={staticFile("audio/08_on.mp3")}
        volume={(f: number) => interpolate(f, [159, 175], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
    </Sequence>
    <Sequence from={1429} durationInFrames={111}>
      <ClosingCard />
      <Sequence from={30}>
        <Audio src={staticFile("audio/07_closing.mp3")} />
      </Sequence>
    </Sequence>
  </AbsoluteFill>
);

// ─────────────────────────────────────────────────────────────────────────────
// New_Video — FullVideo with BubbleSwarmScene replacing OpeningChat + Fall
// ─────────────────────────────────────────────────────────────────────────────
const New_Video = () => (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
    <Audio
      src={staticFile("audio/background.mp3")}
      volume={(frame) => {
        const fadeInEnd = 30;
        const fadeOutStart = 1686; // 1731 - 45
        if (frame < fadeInEnd) {
          return interpolate(frame, [0, fadeInEnd], [0, 0.15], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        if (frame > fadeOutStart) {
          return interpolate(frame, [fadeOutStart, 1731], [0.15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        }
        return 0.15;
      }}
      endAt={1731}
    />
    <Sequence from={1025}>
      <Audio src={staticFile("audio/dashboard.mp3")} />
    </Sequence>
    <Sequence from={0} durationInFrames={240}>
      <BubbleSwarmScene />
    </Sequence>
    <Sequence from={231} durationInFrames={120}>
      <IntroScene />
      <Audio src={staticFile("audio/03_intro.mp3")} />
    </Sequence>
    <Sequence from={351} durationInFrames={369}>
      <PhoneScene />
      <Audio src={staticFile("audio/04_tablet.mp3")} />
    </Sequence>
    <Sequence from={720} durationInFrames={305}>
      <AngelMessageSceneV4 />
      <Sequence from={30}>
        <Audio src={staticFile("audio/05_message.mp3")} />
      </Sequence>
    </Sequence>
    <Sequence from={1025} durationInFrames={75}>
      <ChatBannerScene />
    </Sequence>
    <Sequence from={1100} durationInFrames={105}>
      <HostDashboardScene />
    </Sequence>
    <Sequence from={1205} durationInFrames={255}>
      <ResolutionScene />
      <Audio src={staticFile("audio/06_resolution.mp3")} />
    </Sequence>
    <Sequence from={1445} durationInFrames={175}>
      <CelebrationScene />
      <Audio
        src={staticFile("audio/08_on.mp3")}
        volume={(f: number) => interpolate(f, [159, 175], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
    </Sequence>
    <Sequence from={1605} durationInFrames={126}>
      <ClosingCard />
      <Sequence from={30}>
        <Audio src={staticFile("audio/07_closing.mp3")} />
      </Sequence>
    </Sequence>
  </AbsoluteFill>
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
        durationInFrames={1540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FullVideoReel"
        component={FullVideo}
        durationInFrames={1540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NewVideo"
        component={New_Video}
        durationInFrames={1731}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NewVideoReel"
        component={New_Video}
        durationInFrames={1731}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PhoneScene"
        component={PhoneScene}
        durationInFrames={369}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AngelMessageSceneV4"
        component={AngelMessageSceneV4}
        durationInFrames={305}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CelebrationScene"
        component={CelebrationScene}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BubbleSwarmScene"
        component={BubbleSwarmScene}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BubbleSwarmSceneReel"
        component={BubbleSwarmScene}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChatBannerScene"
        component={ChatBannerScene}
        durationInFrames={75}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ChatBannerSceneReel"
        component={ChatBannerScene}
        durationInFrames={75}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HostDashboardScene"
        component={HostDashboardScene}
        durationInFrames={105}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HostDashboardSceneReel"
        component={HostDashboardScene}
        durationInFrames={105}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
