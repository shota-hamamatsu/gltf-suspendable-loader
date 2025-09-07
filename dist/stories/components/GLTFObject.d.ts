import * as THREE from "three";
export type GLTFObjectProps = {
    url: string;
    setSubject?: (abortFunc: () => void) => void;
    onLoad?: (model: THREE.Object3D) => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
};
/** Reactコンポーネント版GLTFObject */
export declare const GLTFObject: ({ url, setSubject, onLoad, onProgress, onError }: GLTFObjectProps) => JSX.Element | null;
