/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as THREE from 'three';

import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

function deserializeScene(nodes: any[]) {
    const nodeMap = new Map();

    // まずすべてのノードを生成してMapに保存
    nodes.forEach((node) => {
        let obj;
        if (node.type === 'Mesh' && node.geometry) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(node.geometry.position), 3)
            );
            if (node.geometry.normal) {
                geometry.setAttribute(
                    'normal',
                    new THREE.BufferAttribute(new Float32Array(node.geometry.normal), 3)
                );
            }
            if (node.geometry.uv) {
                geometry.setAttribute(
                    'uv',
                    new THREE.BufferAttribute(new Float32Array(node.geometry.uv), 2)
                );
            }

            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().fromArray(node.material.color),
                metalness: node.material.metalness,
                roughness: node.material.roughness,
            });

            obj = new THREE.Mesh(geometry, material);
        } else {
            obj = new THREE.Object3D();
        }

        obj.name = node.name;

        // 行列を適用
        const m = new THREE.Matrix4();
        m.fromArray(node.matrix);
        obj.applyMatrix4(m);

        nodeMap.set(node.id, obj);
    });

    let root: THREE.Object3D | null = null;

    // 親子関係を復元
    nodes.forEach((node) => {
        const obj = nodeMap.get(node.id);
        if (node.parentId !== null) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                parent.add(obj);
            }
        } else {
            // parentId null はルート候補
            root = obj;
        }
    });

    return root as any
}

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
                    const nodes = deserializeScene(data.nodes);
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
