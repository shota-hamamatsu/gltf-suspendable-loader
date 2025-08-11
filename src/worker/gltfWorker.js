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
            indexType: (geom.index.array instanceof Uint32Array) ? 'Uint32' : 'Uint16',
            index: geom.index ? geom.index.array.buffer : null,  // 追加
            vertexCount: geom.getAttribute('position').count,
            indexCount: geom.index ? geom.index.count : 0,
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
        const nodes = serializeScene(gltf.scene);

        // バッファをまとめる
        const buffers = [];
        nodes.forEach(node => {
            if (node.geometry) {
            buffers.push(node.geometry.position);
            if (node.geometry.normal) buffers.push(node.geometry.normal);
            if (node.geometry.uv) buffers.push(node.geometry.uv);
            }
        });
    
        self.postMessage(
            {
            type: 'success',
            nodes
            },
            buffers
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