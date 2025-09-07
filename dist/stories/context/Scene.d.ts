import { ReactNode } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFSuspendableLoader } from '../../GLTFSuspendableLoader';
import * as THREE from "three";
export type SceneContextValue = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer | null;
    loader: GLTFSuspendableLoader;
    controls: OrbitControls;
};
export declare const useSceneContext: () => SceneContextValue;
export declare const Scene: ({ initialCameraPosition, initialCameraRotation, children, }: {
    initialCameraPosition?: THREE.Vector3Like;
    initialCameraRotation?: THREE.Euler;
    children?: ReactNode;
}) => JSX.Element | null;
