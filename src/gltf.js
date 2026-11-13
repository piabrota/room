// three.js's glTF loader and the meshopt decoder, in a chunk of their own: about 70 kB of code
// that no frame needs before a model arrives. src/furniture.js asks for it while the room is being
// built, so it is there when the first model is; the room's own code is that much less to
// download, read and compile before the room shows. If it cannot load, the stand-ins stay (invariant 8).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const gltfLoader = () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
