/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */

import { Observable } from 'rxjs';
import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const textureMap = new Map();

async function createTextureFromBuffer(buffer: ArrayBuffer) {
    if (!buffer) return null;
    const blob = new Blob([buffer]);
    const imageBitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', });
    const texture = new THREE.Texture(imageBitmap);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

async function deserializeNode(nodeData: any) {
    let obj;
    if (nodeData.type === 'Mesh' && nodeData.geometry) {
        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(nodeData.geometry.position), 3)
        );

        if (nodeData.geometry.normal) {
            geometry.setAttribute(
                'normal',
                new THREE.BufferAttribute(new Float32Array(nodeData.geometry.normal), 3)
            );
        }

        if (nodeData.geometry.uv) {
            geometry.setAttribute(
                'uv',
                new THREE.BufferAttribute(new Float32Array(nodeData.geometry.uv), 2)
            );
        }

        if (nodeData.geometry.index) {
            let indexArray;
            if (nodeData.geometry.indexType === 'Uint32') {
                indexArray = new Uint32Array(nodeData.geometry.index);
            } else {
                indexArray = new Uint16Array(nodeData.geometry.index);
            }
            geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
        }

        const materialParams = {
            color: new THREE.Color().fromArray(nodeData.material.color),
            metalness: nodeData.material.metalness,
            roughness: nodeData.material.roughness,
        };

        if (nodeData.material.mapId !== null) {
            Object.assign(materialParams, {
                map: textureMap.get(nodeData.material.mapId)
            });
        }

        const material = new THREE.MeshStandardMaterial(materialParams);
        obj = new THREE.Mesh(geometry, material);
    } else {
        obj = new THREE.Object3D();
    }

    obj.name = nodeData.name;
    obj.matrix.fromArray(nodeData.matrix);
    obj.matrixAutoUpdate = false;

    // 子ノード再帰復元
    if (nodeData.children) {
        for (const childData of nodeData.children) {
            const childObj = await deserializeNode(childData);
            obj.add(childObj);
        }
    }

    return obj;
}

export class GLTFSuspendableLoader extends GLTFLoader {
    private _dracoPath?: string;
    setDracoPath(path: string) {
        this._dracoPath = path;
    }
    loadSuspendable(
        url: string,
        onLoad: (model: THREE.Object3D) => void
    ) {
        // 中断用のSubject
        const worker = new Worker(new URL('./worker/gltfWorker.js', import.meta.url), { type: 'module' });
        const modelLoader = new Observable<{ progress?: number; model?: THREE.Object3D }>((observer) => {
            worker.onmessage = async (event) => {
                const { type, ...data } = event.data;

                if (type === 'progress') {
                    observer.next({ progress: data.loaded / data.total });
                } else if (type === 'success') {
                    // 例：仮にtextureBuffersがdata.textureBuffersとして送信されている場合
                    if (data.textureBuffers && data.textureBuffers.length > 0) {
                        // idは送られていないので順番とmapIdは同じと仮定
                        for (let i = 0; i < data.textureBuffers.length; i++) {
                            const tex = await createTextureFromBuffer(data.textureBuffers[i]);
                            textureMap.set(i, tex);
                        }
                    }
                    const nodes = await deserializeNode(data.sceneData);
                    observer.next({ model: nodes });
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
        })

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

        const abortFunc = () => {
            worker.terminate();
            console.log('loading aborted');
        }

        return abortFunc;
    }
}
