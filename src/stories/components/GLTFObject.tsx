import { useEffect, useRef } from "react";
import { useSceneContext } from "../context/Scene";
import { Subject } from "rxjs";

export type GLTFObjectProps = {
  url: string;
  setSubject?: (subject: Subject<unknown>) => void;
};

/** Reactコンポーネント版GLTFObject */
export const GLTFObject = ({ url, setSubject }: GLTFObjectProps): JSX.Element | null => {
  const { scene, loader } = useSceneContext();
  const subjectRef = useRef<Subject<unknown>>();

  useEffect(() => {
    if (!url) return;

    const gltfLoader = loader;
    subjectRef.current = gltfLoader.loadSuspendable(url, (gltf) => {
      console.log("GLTF loaded:", gltf);
      scene.add(gltf);
    });
    console.log("GLTFObject mounted", subjectRef.current);
    setSubject?.(subjectRef.current);
    return () => {
      subjectRef.current?.unsubscribe();
    };
  }, [url, scene, loader]);

  return null;
};
