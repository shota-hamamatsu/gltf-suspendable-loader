import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const DRACO_DECODER_PATH = new URL('assets/draco/', import.meta.url).href;

const textureMap = new Map();
let textureIdCounter = 0;

async function extractTextureBuffer(texture) {
  if (!texture || !texture.image) return null;
  const canvas = new OffscreenCanvas(texture.image.width, texture.image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(texture.image, 0, 0);
  const blob = await canvas.convertToBlob();
  return await blob.arrayBuffer();
}

async function serializeNode(node) {
  const serialized = {
    id: node.id,
    name: node.name,
    matrix: node.matrix.elements.slice(),
    type: node.type,
    parentId: node.parent ? node.parent.id : null,
    childrenIds: node.children.map(c => c.id),
    geometry: null,
    material: null,
  };

  if (node.isMesh) {
    const geom = node.geometry;
    const mat = node.material;

    serialized.geometry = {
        position: geom.getAttribute('position').array.buffer,
        normal: geom.getAttribute('normal')?.array.buffer,
        uv: geom.getAttribute('uv')?.array.buffer,
        indexType: (geom.index.array instanceof Uint32Array) ? 'Uint32' : 'Uint16',
        index: geom.index ? geom.index.array.buffer : null,  // 追加
        vertexCount: geom.getAttribute('position').count,
        indexCount: geom.index ? geom.index.count : 0,
    };

    serialized.material = {
      color: mat.color.toArray(),
      metalness: mat.metalness,
      roughness: mat.roughness,
      mapId: null,
    };

    if (mat.map) {
      // 既に登録済みならIDを再利用
      if (!textureMap.has(mat.map)) {
        const buffer = await extractTextureBuffer(mat.map);
        const id = textureIdCounter++;
        textureMap.set(mat.map, { id, buffer });
      }
      serialized.material.mapId = textureMap.get(mat.map).id;
    }
  }

  // 子ノードも再帰的にserialize
  serialized.children = [];
  for (const child of node.children) {
    const childSerialized = await serializeNode(child);
    serialized.children.push(childSerialized);
  }

  return serialized;
}

// ルートのserialize関数例
async function serializeScene(root) {
  textureMap.clear();
  textureIdCounter = 0;

  const sceneData = await serializeNode(root);

  // 送信用テクスチャバッファ一覧
  const textureBuffers = [];
  textureMap.forEach(({ id, buffer }) => {
    textureBuffers.push(buffer);
  });

  return { sceneData, textureBuffers };
}

self.onmessage = async (event) => {
  const { url, dracoPath = DRACO_DECODER_PATH } = event.data;

  try {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(dracoPath+'/');
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
    url,
    async (gltf) => {
        const { sceneData, textureBuffers } = await serializeScene(gltf.scene);

        // ArrayBufferの転送リスト
        const transferList = [];

        // geometryやindexのバッファもcollectしてtransferListに入れる必要あり
        function collectGeometryBuffers(node) {
        if (node.geometry) {
            if (node.geometry.position) transferList.push(node.geometry.position);
            if (node.geometry.normal) transferList.push(node.geometry.normal);
            if (node.geometry.uv) transferList.push(node.geometry.uv);
            if (node.geometry.index) transferList.push(node.geometry.index);
        }
        if (node.children) {
            node.children.forEach(collectGeometryBuffers);
        }
        }
        collectGeometryBuffers(sceneData);
    
        self.postMessage(
            {
            type: 'success',
            sceneData,
            textureBuffers: textureBuffers,
            },
            transferList
        );
    },
    (progress) => {
      self.postMessage({ type: 'progress', loaded: progress.loaded, total: progress.total });
    },
    (error) => {
      self.postMessage({ type: 'error', error: error.message });
    }
  );
  } catch (err) {
    self.postMessage({ type: 'error', error: err.message });
  }
};