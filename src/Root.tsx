import "./index.css";
import { Composition } from "remotion";
import { VortexBlast } from "./VortexBlast";
import { ChaosSequence } from "./ChaosSequence";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VortexBlast"
        component={VortexBlast}
        durationInFrames={240} // 4 s at 60 fps
        fps={60}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChaosSequence"
        component={ChaosSequence}
        durationInFrames={300} // 10 s at 30 fps  (chaos 0–150, freeze 150–240, icon 240–300)
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
