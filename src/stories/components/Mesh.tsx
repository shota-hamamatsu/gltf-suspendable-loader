import { useEffect } from "react";
import * as THREE from "three";
import { useSceneContext } from "../context/Scene";

/** Reactコンポーネント版メッシュ */
export const Mesh = (): JSX.Element | null => {
  const { scene } = useSceneContext();

  useEffect(() => {
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(boxGeometry, material);
    scene.add(mesh);
  }, [scene]);

  return null;
};
