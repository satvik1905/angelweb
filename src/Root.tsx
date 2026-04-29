import "./index.css";
import { Composition } from "remotion";
import { AngelScene } from "./AngelScene";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AngelScene"
      component={AngelScene}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
