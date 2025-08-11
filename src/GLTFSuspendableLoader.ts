/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as THREE from 'three';

import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export class GLTFSuspendableLoader extends GLTFLoader {
    private _dracoPath?: string;
    setDracoPath(path: string) {
        this._dracoPath = path;
    }
    loadSuspendable(
        url: string,
        onLoad: (model: THREE.Mesh) => void
    ) {
        // 中断用のSubject
        const cancelSubject = new Subject();
        const modelLoader = new Observable<{ progress?: number; model?: THREE.Mesh }>((observer) => {
            const worker = new Worker(new URL('./worker/gltfWorker.js', import.meta.url), { type: 'module' });

            worker.onmessage = async (event) => {
                const { type, ...data } = event.data;

                if (type === 'progress') {
                    observer.next({ progress: data.loaded / data.total });
                } else if (type === 'success') {
                    const geometry = new THREE.BufferGeometry();

                    geometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(new Float32Array(data.buffers.position), 3)
                    );

                    if (data.buffers.normal) {
                        geometry.setAttribute(
                            'normal',
                            new THREE.BufferAttribute(new Float32Array(data.buffers.normal), 3)
                        );
                    }

                    if (data.buffers.uv) {
                        geometry.setAttribute(
                            'uv',
                            new THREE.BufferAttribute(new Float32Array(data.buffers.uv), 2)
                        );
                    }

                    // テクスチャを作成する関数
                    async function createTextureFromArrayBuffer(arrayBuffer: ArrayBuffer) {
                        if (!arrayBuffer) return null;

                        const blob = new Blob([arrayBuffer]);
                        const imageBitmap = await createImageBitmap(blob);
                        const texture = new THREE.Texture(imageBitmap);
                        texture.needsUpdate = true;
                        return texture;
                    }

                    const materialParams = {
                        color: new THREE.Color().fromArray(data.materialData.color),
                        metalness: data.materialData.metalness,
                        roughness: data.materialData.roughness,
                    };

                    // テクスチャ作成（非同期）
                    const mapTexture = await createTextureFromArrayBuffer(data.mapArrayBuffer);
                    if (mapTexture) {
                        Object.assign(materialParams, {
                            map: mapTexture
                        });
                    }

                    const material = new THREE.MeshStandardMaterial(materialParams);

                    const mesh = new THREE.Mesh(geometry, material);
                    observer.next({ model: mesh });
                    observer.complete();
                    // workerを終了することで完全にロードを中断する
                    worker.terminate();
                } else if (type === 'error') {
                    observer.error(data.error);
                    // workerを終了することで完全にロードを中断する
                    worker.terminate();
                }
            };

            worker.postMessage({ url, dracoPath: this._dracoPath });

            // 解除処理
            return () => {
                worker.terminate();
            };
        }).pipe(
            takeUntil(cancelSubject)
        );

        modelLoader.subscribe({
            next: (data) => {
                if (data.model) {
                    console.log('モデル読み込み成功:', data.model);
                    onLoad(data.model);
                } else {
                    console.log('進捗:', (data?.progress ?? 0) * 100, '%');
                }
            },
            error: (error) => {
                console.error('エラー発生:', error);
            },
            complete: () => {
                console.log('読み込み完了');
            }
        });

        return cancelSubject;
    }
}
