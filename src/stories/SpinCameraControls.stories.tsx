import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "./context/Scene";
import { Mesh } from "./components/Mesh";

const meta = {
  title: "SpinCameraControls",
  component: Scene,
} satisfies Meta<typeof Scene>;
export default meta;

type Story = StoryObj<typeof Scene>;

export const Test: Story = {
  render: () => {
    return (
      <div style={{ width: '100%', height: "100%" }}>
        <Scene>
          <Mesh />
        </Scene>
      </div>
    );
  },
};
