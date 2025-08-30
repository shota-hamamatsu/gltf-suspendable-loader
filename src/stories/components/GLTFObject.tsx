import { useEffect, useRef } from "react";
import { useSceneContext } from "../context/Scene";

export type GLTFObjectProps = {
  url: string;
  setSubject?: (abortFunc: () => void) => void;
};

/** Reactコンポーネント版GLTFObject */
export const GLTFObject = ({ url, setSubject }: GLTFObjectProps): JSX.Element | null => {
  const { scene, loader } = useSceneContext();
  const abortFuncRef = useRef<() => void>();

  useEffect(() => {
    if (!url) return;

    const gltfLoader = loader;
    abortFuncRef.current = gltfLoader.loadSuspendable(url, (gltf) => {
      console.log("GLTF loaded:", gltf);
      scene.add(gltf);
    });
    setSubject?.(abortFuncRef.current);
    return () => {
      abortFuncRef.current?.();
    };
  }, [url, scene, loader]);

  return null;
};
