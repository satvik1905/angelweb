import "./index.css";
import { Composition } from "remotion";
import { VortexBlast } from "./VortexBlast";

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
    </>
  );
};
