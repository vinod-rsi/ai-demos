import * as THREE from 'three';

/**
 * Minimal Three.js runtime: renderer, camera, lights, resize handling, and a
 * requestAnimationFrame loop with update callbacks.
 */
export class SceneRuntime {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private updaters = new Set<(dt: number, elapsed: number) => void>();
  private clock = new THREE.Clock();
  private running = false;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 1.5, 3);

    this.scene.background = new THREE.Color(0x10151c);
    const hemi = new THREE.HemisphereLight(0xf4f8ff, 0x2a2118, 0.9);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2e0, 2.2);
    key.position.set(2.5, 3.5, 2.5);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.6);
    fill.position.set(-3, 2, -1);
    this.scene.add(fill);

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }

  private resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  onUpdate(fn: (dt: number, elapsed: number) => void): () => void {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      const dt = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      this.updaters.forEach((fn) => fn(dt, elapsed));
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
  }
}
