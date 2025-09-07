import type { Meta, StoryObj } from "@storybook/react";
import { Scene } from "./context/Scene";
import { GLTFObject } from "./components/GLTFObject";
import { useCallback, useRef, useState } from "react";
import { Button, LinearProgress } from "@mui/material";
import { generateUUID } from "three/src/math/MathUtils";

// const DEFAULT_GLTF_PATH = `/assets/glb/LittlestTokyo.glb`;

const meta = {
  title: "GLTFSuspendableLoader",
  component: Scene,
} satisfies Meta<typeof Scene>;
export default meta;

type Story = StoryObj<typeof Scene>;

export const Test: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [gltfPath, setGltfPath] = useState<string>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const abortFuncRef = useRef<() => void>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loadStart, setLoadStart] = useState<boolean>(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loadingKey, setLoadingKey] = useState(generateUUID());
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [progress, setProgress] = useState<number>(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<Error>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onLoad = useCallback(() => {
      console.log('GLTF loaded');
      setLoadStart(false);
    }, []);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onProgress = useCallback((p: number) => {
      console.log('Loading progress:', p);
      setProgress(p * 100);
    }, []);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onError = useCallback((e: Error) => {
      console.error('Loading error:', e);
      setError(e);
      setLoadStart(false);
    }, []);
    return (
      <div style={{ width: '100%', height: "100%", position: 'relative' }}>
        <Scene>
          <input type='file' accept=".glb,.gltf" style={{ position: 'absolute', zIndex: 1, top: 10, left: 10 }} onChange={(e) => { setGltfPath(URL.createObjectURL(e.target.files?.[0] as Blob)); setLoadStart(false) }} />
          <Button
            disabled={gltfPath === undefined}
            style={{ position: 'absolute', zIndex: 1, top: 40, left: 10 }}
            onClick={() => {
              console.log('Load Start clicked');
              setLoadStart(true);
              setLoadingKey(generateUUID());
              setProgress(0);
              setError(undefined);
            }}>
            Load Start
          </Button>
          <Button
            disabled={!loadStart}
            style={{ position: 'absolute', zIndex: 1, top: 70, left: 10 }}
            onClick={() => {
              console.log('Load Stop clicked');
              abortFuncRef.current?.();
            }}
          >
            Load Stop
          </Button>
          <LinearProgress
            variant="determinate"
            value={progress}
            style={{ position: 'absolute', zIndex: 1, top: 100, left: 10, right: 10, width: '150px' }}
          />
          {error && <div style={{ position: 'absolute', zIndex: 1, top: 130, left: 10, color: 'red' }}>Error: {error.message}</div>}
          {gltfPath && loadStart &&
            <GLTFObject key={loadingKey} url={gltfPath} setSubject={(abortFunc) => abortFuncRef.current = abortFunc} onLoad={onLoad} onProgress={onProgress} onError={onError} />
          }
        </Scene>
      </div>
    );
  },
};
