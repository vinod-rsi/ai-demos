import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { asset } from '../base';

/**
 * Asset registry. glTF/GLB is the preferred runtime format (see
 * scripts/convert-assets.md for the FBX→GLB pipeline); the Unity FBX sources
 * remain loadable directly as the dev-time fallback, and the stage keeps
 * procedural placeholders when neither loads.
 */
export interface AssetEntry {
  id: string;
  url: string;
  /** Base URL for the asset's texture references (FBX files store bare
   *  filenames that live in a sibling textures/ folder in this repo). */
  resourcePath?: string;
}

export class AssetRegistry {
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();
  private cache = new Map<string, Promise<THREE.Object3D | null>>();
  private entries = new Map<string, AssetEntry>();

  constructor() {
    // Draco-compressed GLBs (see scripts/convert-assets.md) need the decoder
    // copied to public/draco/; uncompressed GLBs ignore this entirely.
    const draco = new DRACOLoader();
    draco.setDecoderPath(asset('draco/'));
    this.gltfLoader.setDRACOLoader(draco);
  }

  register(entry: AssetEntry): void {
    this.entries.set(entry.id, entry);
  }

  /** Loads a registered asset by extension; resolves null when missing/unloadable. */
  load(id: string): Promise<THREE.Object3D | null> {
    let pending = this.cache.get(id);
    if (!pending) {
      const entry = this.entries.get(id);
      if (!entry) {
        pending = Promise.resolve(null);
      } else if (/\.fbx$/i.test(decodeURIComponent(entry.url))) {
        pending = this.loadFbx(entry.url, entry.resourcePath);
      } else {
        pending = this.gltfLoader
          .loadAsync(entry.url)
          .then((gltf) => {
            // FBXLoader hangs animations off the returned object; mirror that
            // so the stage treats both formats identically.
            gltf.scene.animations = gltf.animations ?? [];
            return this.normalize(gltf.scene);
          })
          .catch((err) => {
            console.warn(`[assets] failed to load ${entry.url}:`, err);
            return null;
          });
      }
      this.cache.set(id, pending);
    }
    return pending;
  }

  /**
   * Normalizes Unity's centimeter-scaled exports (anything taller/wider than
   * 50 units is assumed cm and shrunk ×0.01) and enables shadows.
   */
  private normalize(object: THREE.Object3D): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    if (Math.max(size.x, size.y, size.z) > 50) {
      object.scale.multiplyScalar(0.01);
    }
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return object;
  }

  /** Direct FBX loading (the Unity sources are FBX-only). */
  private loadFbx(url: string, resourcePath?: string): Promise<THREE.Object3D | null> {
    // One loader per load: resourcePath is loader state and concurrent loads
    // would otherwise clobber each other's texture base path.
    const loader = new FBXLoader();
    if (resourcePath) loader.setResourcePath(resourcePath);
    return loader
      .loadAsync(url)
      .then((object) => this.normalize(object))
      .catch((err) => {
        console.warn(`[assets] failed to load ${url}:`, err);
        return null;
      });
  }

  /** Loads a texture (sRGB color space for albedo maps). */
  loadTexture(url: string, color = true): THREE.Texture {
    const tex = this.textureLoader.load(url);
    if (color) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}
