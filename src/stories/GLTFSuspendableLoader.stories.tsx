import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "./context/Scene";
import { GLTFObject } from "./components/GLTFObject";
import { useState } from "react";
import { Subject } from "rxjs";

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
    const [subject, setSubject] = useState<Subject<unknown>>();
    return (
      <div style={{ width: '100%', height: "100%" }}>
        <Scene>
          <GLTFObject url={gltfPath} setSubject={setSubject} />
        </Scene>
      </div>
    );
  },
};
