import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const DRACO_DECODER_PATH = new URL('assets/draco/', import.meta.url).href;

function serializeScene(root) {
  const nodes = [];

  // ノードごとにIDをつけて記録しつつ情報を収集
  root.traverse((node) => {
    const serialized = {
      id: node.id,
      name: node.name,
      type: node.type,
      matrix: node.matrix.elements.slice(),
      parentId: node.parent ? node.parent.id : null,
      geometry: null,
      material: null,
      childrenIds: node.children.map(child => child.id),
    };

    if (node.isMesh) {
      const geom = node.geometry;
      serialized.geometry = {
        position: geom.getAttribute('position').array.buffer,
        normal: geom.getAttribute('normal')?.array.buffer,
        uv: geom.getAttribute('uv')?.array.buffer,
        vertexCount: geom.getAttribute('position').count,
      };

      const mat = node.material;
      serialized.material = {
        color: mat.color.toArray(),
        metalness: mat.metalness,
        roughness: mat.roughness,
        hasMap: !!mat.map,
      };
    }

    nodes.push(serialized);
  });

  return nodes;
}


self.onmessage = async (event) => {
  const { url, dracoPath } = event.data;

  try {
    const loader = new GLTFLoader();
    if(dracoPath !== undefined){
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(dracoPath+'/');
        loader.setDRACOLoader(dracoLoader);
    }

    loader.load(
    url,
    async (gltf) => {
        let mesh
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          mesh =  child;
        }
      });
      if (!mesh) {
        self.postMessage({ type: 'error', error: 'メッシュがありません' });
        return;
      }

      // ジオメトリの属性を取得
      const geometry = mesh.geometry;
      const positionAttr = geometry.getAttribute('position');
      const normalAttr = geometry.getAttribute('normal');
      const uvAttr = geometry.getAttribute('uv');

      // マテリアル情報
      const material = mesh.material;
      const materialData = {
        color: material.color.toArray(),
        metalness: material.metalness,
        roughness: material.roughness,
        // ここではテクスチャ有無だけ判定しておく
        hasMap: !!material.map,
      };

      // テクスチャ画像データを ArrayBuffer に変換するユーティリティ
      async function imageToArrayBuffer(texture) {
        if (!texture || !texture.image) return null;

        // texture.image は HTMLImageElement など
        // OffscreenCanvas を使ってBlobに変換してからArrayBuffer化
        const img = texture.image;

        // OffscreenCanvas作成
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Blobを取得しArrayBufferに変換
        const blob = await canvas.convertToBlob();
        return await blob.arrayBuffer();
      }

      const mapArrayBuffer = material.map ? await imageToArrayBuffer(material.map) : null;

      // 転送データをまとめる
      const buffers = {
        position: positionAttr.array.buffer,
        normal: normalAttr?.array.buffer,
        uv: uvAttr?.array.buffer,
      };

      // postMessage で transferable として渡す配列を作成
      const transferList = Object.values(buffers).filter(b => b !== undefined);
      if (mapArrayBuffer) transferList.push(mapArrayBuffer);

      self.postMessage(
        {
          type: 'success',
          buffers,
          materialData,
          mapArrayBuffer,
          vertexCount: positionAttr.count,
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