import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "./context/Scene";
import { GLTFObject } from "./components/GLTFObject";
import { useRef, useState } from "react";
import { Button } from "@mui/material";

const DEFAULT_GLTF_PATH = new URL('/public/assets/glb/LittlestTokyo.glb', import.meta.url).href;

const meta = {
  title: "GLTFSuspendableLoader",
  component: Scene,
} satisfies Meta<typeof Scene>;
export default meta;

type Story = StoryObj<typeof Scene>;

export const Test: Story = {
  render: () => {
    const [gltfPath] = useState<string>(DEFAULT_GLTF_PATH);
    const abortFuncRef = useRef<() => void>();
    return (
      <div style={{ width: '100%', height: "100%", position: 'relative' }}>
        <Scene>
          <Button onClick={() => {
            console.log('Load Stop clicked');
            abortFuncRef.current?.();
          }}
            style={{ position: 'absolute', zIndex: 1, top: 10, left: 10 }}>
            Load Stop
          </Button>
          <GLTFObject url={gltfPath} setSubject={(abortFunc) => abortFuncRef.current = abortFunc} />
        </Scene>
      </div>
    );
  },
};
