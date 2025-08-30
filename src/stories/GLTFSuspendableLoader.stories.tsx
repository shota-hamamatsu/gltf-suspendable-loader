import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "./context/Scene";
import { GLTFObject } from "./components/GLTFObject";
import { useRef, useState } from "react";
import { Subject } from "rxjs";
import { Button } from "@mui/material";

const DEFAULT_GLTF_PATH = new URL('./assets/glb/LittlestTokyo.glb', import.meta.url).href;

const meta = {
  title: "GLTFSuspendableLoader",
  component: Scene,
} satisfies Meta<typeof Scene>;
export default meta;

type Story = StoryObj<typeof Scene>;

export const Test: Story = {
  render: () => {
    const [gltfPath, setGLTFPath] = useState<string>(DEFAULT_GLTF_PATH);
    const subjectRef = useRef<Subject<unknown>>();
    return (
      <div style={{ width: '100%', height: "100%", position: 'relative' }}>
        <Scene>
          <Button onClick={() => subjectRef.current?.unsubscribe()} style={{ position: 'absolute', zIndex: 1, top: 10, left: 10 }}>
            Load Stop
          </Button>
          <GLTFObject url={gltfPath} setSubject={(subject) => subjectRef.current = subject} />
        </Scene>
      </div>
    );
  },
};
