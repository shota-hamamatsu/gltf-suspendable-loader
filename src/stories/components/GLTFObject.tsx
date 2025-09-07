import { useEffect, useRef } from "react";
import { useSceneContext } from "../context/Scene";
import * as THREE from "three";

export type GLTFObjectProps = {
  url: string;
  setSubject?: (abortFunc: () => void) => void;
  onLoad?: (model: THREE.Object3D) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
};

/** Reactコンポーネント版GLTFObject */
export const GLTFObject = ({ url, setSubject, onLoad, onProgress, onError }: GLTFObjectProps): JSX.Element | null => {
  const { scene, loader } = useSceneContext();
  const modelRef = useRef<THREE.Object3D | null>(null);
  const abortFuncRef = useRef<() => void>();
  const isLoadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!url || isLoadingRef.current) return;
    isLoadingRef.current = true;
    const gltfLoader = loader;
    console.log("Starting to load GLTF from URL:", url);
    abortFuncRef.current = gltfLoader.loadSuspendable(url, (gltf) => {
      console.log("GLTF loaded:", gltf);
      scene.add(gltf);
      modelRef.current = gltf;
      isLoadingRef.current = false;
      onLoad?.(gltf);
    }, onProgress, onError);
    setSubject?.(abortFuncRef.current);
    return () => {
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    }
  }, [url, scene, loader, setSubject, onProgress, onError, onLoad]);

  return null;
};
