import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */
import * as THREE from 'three';
export declare class GLTFSuspendableLoader extends GLTFLoader {
    private _dracoPath?;
    setDracoPath(path: string): void;
    loadSuspendable(url: string, onLoad: (model: THREE.Object3D) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): () => void;
}
