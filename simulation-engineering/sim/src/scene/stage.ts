import * as THREE from 'three';
import type { SceneRuntime } from './renderer';
import type { AssetRegistry } from './assets';
import type { RawShot } from '../content/types';
import { asset } from '../base';

/**
 * The stage maps Konverse shots onto the 3D scene. Shot fields are indices
 * into the MarkUp containers:
 *   environments: [Fade Plane, PHARM_T3_env, Abstract-Background_env]
 * Until the FBX environments/characters are converted to glTF, this builds
 * placeholder geometry; swap `buildPlaceholder*` for AssetRegistry loads
 * once GLBs exist.
 */
export class Stage {
  private pharmacy: THREE.Group;
  private abstractBg: THREE.Group;
  private character: THREE.Group;
  private realEnv: THREE.Object3D | null = null;
  private realCharacter: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private gestureActions = new Map<string, THREE.AnimationAction>();
  private currentGesture: THREE.AnimationAction | null = null;
  /** Idle micro-motion (subtle head tilts between lines). */
  private microAction: THREE.AnimationAction | null = null;
  private microTime = 0;
  private microTimer = 3;
  private visemeActions = new Map<string, THREE.AnimationAction>();
  private currentViseme = 'AH';
  private mouth: THREE.Mesh | null = null;
  private speakingLevel = 0;
  private shotsById = new Map<string, RawShot>();
  /** Point the cameras frame on (placeholder head by default). */
  private focus = new THREE.Vector3(0, 1.4, -0.2);
  private envCenter = new THREE.Vector3();
  /** Unity-exported character locator embedded in PHARM_T3_env.fbx. */
  private characterLocator: THREE.Object3D | null = null;
  /** Bounds of the baked backdrop plane — the frustum must stay inside it. */
  private backdropBox: THREE.Box3 | null = null;
  /** World-space normal of the backdrop plane (points toward the camera). The
   *  plane is rotated ~33° about Y, so the camera must look ALONG this normal
   *  to fill it and to view Rebecca/the chair from the designed 3/4 angle. */
  private backdropNormal: THREE.Vector3 | null = null;
  /** True in-plane half-extents (along the camera's right/up), measured from
   *  the plane mesh's own corners — NOT the world AABB, which would fold the
   *  tilted quad's width into its height. */
  private backdropHalfR = 0;
  private backdropHalfU = 0;
  private cameraLift = 0.1;
  private currentCameraIndex = 0;
  private lastAspect = 0;
  /** Rebecca's head bone — gives her TRUE seated head height (a static
   *  bounding box measures the standing bind pose, ignoring the seated idle
   *  animation). The camera aims here. */
  private headBone: THREE.Object3D | null = null;
  private seatedFocusCaptured = false;

  constructor(
    private runtime: SceneRuntime,
    private assets: AssetRegistry,
    shots: RawShot[],
  ) {
    for (const shot of shots) this.shotsById.set(shot.id.toLowerCase(), shot);

    this.pharmacy = this.buildPlaceholderPharmacy();
    this.abstractBg = this.buildPlaceholderAbstract();
    this.character = this.buildPlaceholderCharacter();
    runtime.scene.add(this.pharmacy, this.abstractBg, this.character);
    this.abstractBg.visible = false;

    runtime.onUpdate((dt, elapsed) => this.update(dt, elapsed));
    this.applyCamera(0);
  }

  /**
   * Names of the converted GLBs, read once from public/models/__list.json.
   * Probing each id with a HEAD request instead would cost one 404 per asset
   * on a static host, which never has any of them.
   */
  private static glbIds: Promise<Set<string>> | null = null;

  private static availableGlbs(): Promise<Set<string>> {
    Stage.glbIds ??= fetch(asset('models/__list.json'))
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
      .then((names) => new Set(names.map((n) => n.replace(/\.glb$/, ''))))
      .catch(() => new Set<string>());
    return Stage.glbIds;
  }

  /**
   * Production GLBs (scripts/convert-assets.md) are preferred; the Unity FBX
   * imported into public/unity is the fallback and what ships today.
   */
  private async loadPreferred(
    id: string,
    fbx: { url: string; resourcePath?: string },
  ): Promise<THREE.Object3D | null> {
    const glbUrl = asset(`models/${id}.glb`);
    if ((await Stage.availableGlbs()).has(id)) {
      this.assets.register({ id: `${id}@glb`, url: glbUrl });
      const glb = await this.assets.load(`${id}@glb`);
      if (glb) {
        console.info(`[stage] using GLB for ${id}`);
        return glb;
      }
    }
    this.assets.register({ id, ...fbx });
    return this.assets.load(id);
  }

  /**
   * Tries to replace the placeholders with the real Unity assets (GLB when
   * converted, FBX otherwise). Any failure keeps the placeholder.
   */
  async upgradeToRealAssets(): Promise<{ env: boolean; character: boolean; idle: boolean }> {
    const [env, rebecca, idle] = await Promise.all([
      this.loadPreferred('pharm_t3_env', {
        url: asset('unity/models/env/fbx/pharm_t3_env.fbx'),
        resourcePath: asset('unity/models/env/textures/'),
      }),
      this.loadPreferred('rebecca', {
        url: asset('unity/models/rebecca/FBX/rebecca.fbx'),
        resourcePath: asset('unity/models/rebecca/Textures/'),
      }),
      this.loadPreferred('rebecca_idle', {
        url: asset('unity/models/rebecca/FBX/rebecca_body_idle.fbx'),
      }),
    ]);

    if (env) {
      this.applyEnvTextures(env);
      this.realEnv = env;
      this.captureEnvLocators(env);
      this.runtime.scene.add(env);
      this.pharmacy.visible = false;
      new THREE.Box3().setFromObject(env).getCenter(this.envCenter);
      this.backdropBox = this.findBackdropBounds(env);
    }

    let idleStarted = false;
    if (rebecca) {
      this.applyRebeccaTextures(rebecca);
      this.placeRebecca(rebecca);
      this.realCharacter = rebecca;
      this.runtime.scene.add(rebecca);
      this.character.visible = false;
      this.headBone = this.findBone(rebecca, /head/i);

      // Provisional focus from the (standing bind-pose) bounding box; replaced
      // by the real seated head-bone position on the first animated frame
      // (see update() → seatedFocusCaptured).
      const box = new THREE.Box3().setFromObject(rebecca);
      box.getCenter(this.focus);
      this.focus.y = box.min.y + (box.max.y - box.min.y) * 0.8;
      this.cameraLift = 0.35;
      this.applyCamera(this.currentCameraIndex);

      const clip = (idle as THREE.Object3D & { animations?: THREE.AnimationClip[] })
        ?.animations?.[0];
      if (clip) {
        try {
          this.mixer = new THREE.AnimationMixer(rebecca);
          this.idleAction = this.mixer.clipAction(clip);
          this.idleAction.play();
          idleStarted = true;
          // Viseme layer first: its mouth-track list is stripped from the
          // idle/gesture clips so the mouth is exclusively viseme-driven.
          void this.setupVisemeLayer().then((mouthTracks) => {
            if (mouthTracks.size > 0 && this.mixer && this.idleAction) {
              const filtered = this.stripTracks(clip, mouthTracks);
              this.idleAction.stop();
              this.idleAction = this.mixer.clipAction(filtered);
              this.idleAction.play();
            }
            void this.loadGestures(mouthTracks);
          });
        } catch (err) {
          console.warn('[stage] idle retarget failed:', err);
        }
      }
    }
    return { env: !!env, character: !!rebecca, idle: idleStarted };
  }

  /** Gossamer body/head takes, loaded lazily after the idle is running. */
  private static readonly GESTURE_FILES: Record<string, string> = {
    'gesture-b': 'rebecca_body_gesture-B.fbx',
    'gesture-l': 'rebecca_body_gesture-L.fbx',
    'gesture-r': 'rebecca_body_gesture-R.fbx',
    nod: 'rebecca_body_nod.fbx',
    'tilt-l': 'rebecca_head_tilt-L.fbx',
    'tilt-r': 'rebecca_head_tilt-R.fbx',
  };

  /** Removes the given track names from a clip (used to free mouth bones). */
  private stripTracks(clip: THREE.AnimationClip, names: ReadonlySet<string>): THREE.AnimationClip {
    return new THREE.AnimationClip(
      clip.name + '_nomouth',
      clip.duration,
      clip.tracks.filter((t) => !names.has(t.name)),
    );
  }

  private async loadGestures(mouthTracks: ReadonlySet<string>): Promise<void> {
    if (!this.mixer) return;
    const names = Object.keys(Stage.GESTURE_FILES);
    await Promise.all(
      names.map(async (name) => {
        const file = Stage.GESTURE_FILES[name]!;
        const take = await this.loadPreferred(`rebecca_${name}`, {
          url: asset(`unity/models/rebecca/FBX/${file}`),
        });
        let clip = (take as THREE.Object3D & { animations?: THREE.AnimationClip[] })
          ?.animations?.[0];
        if (clip && this.mixer) {
          if (mouthTracks.size > 0) clip = this.stripTracks(clip, mouthTracks);
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = false;
          this.gestureActions.set(name, action);
        }
      }),
    );
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === this.currentGesture) this.backToIdle();
    });
    console.info('[stage] gestures loaded:', [...this.gestureActions.keys()].join(', '));
  }

  /** Plays a one-shot gesture crossfaded against the idle. */
  playGesture(name?: string): void {
    if (!this.mixer || this.gestureActions.size === 0 || !this.idleAction) return;
    const keys = [...this.gestureActions.keys()];
    const pick = name && this.gestureActions.has(name) ? name : keys[Math.floor(Math.random() * keys.length)]!;
    const action = this.gestureActions.get(pick)!;
    if (action === this.currentGesture) return;
    action.reset();
    action.setEffectiveWeight(1); // may be mid-flight as a micro-motion
    action.fadeIn(0.35).play();
    (this.currentGesture ?? this.idleAction).fadeOut(0.35);
    this.currentGesture = action;
  }

  /**
   * Between lines (not speaking, no gesture playing) the head occasionally
   * tilts/nods at low weight on top of the idle, like the Unity build's idle
   * layer — so Rebecca doesn't stare rigidly between turns. The take plays
   * once under a sin envelope peaking at 0.35 so it never reads as a gesture.
   */
  private updateMicroMotion(dt: number): void {
    if (this.microAction) {
      if (this.microAction === this.currentGesture) {
        // the director promoted this take to a full gesture — hands off
        this.microAction = null;
      } else {
        this.microTime += dt;
        const t = Math.min(1, this.microTime / (this.microAction.getClip().duration || 1));
        this.microAction.setEffectiveWeight(0.35 * Math.sin(Math.PI * t));
        if (t >= 1) {
          this.microAction.stop();
          this.microAction.setEffectiveWeight(1); // restore for full-gesture use
          this.microAction = null;
        }
        return;
      }
    }
    if (this.speakingLevel > 0.05 || this.currentGesture || !this.idleAction) return;
    this.microTimer -= dt;
    if (this.microTimer > 0) return;
    this.microTimer = 4 + Math.random() * 5;
    const takes = ['tilt-l', 'tilt-r', 'nod'].filter((n) => this.gestureActions.has(n));
    if (takes.length === 0) return;
    const action = this.gestureActions.get(takes[Math.floor(Math.random() * takes.length)]!)!;
    this.microTime = 0;
    this.microAction = action;
    action.reset();
    action.setEffectiveWeight(0);
    action.play();
  }

  private backToIdle(): void {
    if (!this.idleAction) return;
    this.idleAction.reset().fadeIn(0.4).play();
    this.currentGesture?.fadeOut(0.4);
    this.currentGesture = null;
  }

  /**
   * Frame index (30 fps, first of each pose's pair) per the sidecar
   * rebecca!&6_mouth_Phonemes.txt — neutral variants only; (sad)/(smile)
   * variants live at +22/+44 frames if emotional speech is ever wired.
   */
  private static readonly VISEME_FRAMES: Record<string, number> = {
    rest: 1,
    ST: 3,
    E: 5,
    MBP: 7,
    CH: 9,
    AH: 11,
    OO: 13,
    FV: 15,
    L: 17,
    A: 19,
    O: 21,
  };

  /**
   * Mouth pose layer from the Gossamer phoneme library
   * (rebecca!&6_mouth_Phonemes.fbx): a bone-pose take where the sidecar .txt
   * maps frame pairs to the 11 mouth poses (VISEME_FRAMES). The tracks whose
   * values DIFFER from the "rest" pose in ANY pose are exactly the mouth/jaw
   * bones — no Unity .mask parsing needed. One paused, weight-controlled
   * action per pose; setSpeaking drives the selected pose's weight and the
   * mixer blends weight<1 against the bind pose.
   */
  private async setupVisemeLayer(): Promise<Set<string>> {
    const mouthTrackNames = new Set<string>();
    if (!this.mixer) return mouthTrackNames;
    const obj = (await this.loadPreferred('rebecca_phonemes', {
      url: asset('unity/models/rebecca/FBX/rebecca_mouth_phonemes.fbx'),
    })) as (THREE.Object3D & { animations?: THREE.AnimationClip[] }) | null;
    const clip = obj?.animations?.[0];
    if (!clip || !this.mixer) return mouthTrackNames;

    const fps = 30;
    const sampleAt = (track: THREE.KeyframeTrack, second: number): number[] => {
      // nearest keyframe at/before the time
      let idx = 0;
      for (let i = 0; i < track.times.length; i++) {
        if (track.times[i]! <= second) idx = i;
        else break;
      }
      const stride = track.getValueSize();
      return Array.from(track.values.slice(idx * stride, (idx + 1) * stride));
    };

    // Pass 1: mouth bones = tracks where any pose differs from rest.
    const restTime = Stage.VISEME_FRAMES['rest']! / fps;
    const poseTimes = Object.entries(Stage.VISEME_FRAMES).filter(([name]) => name !== 'rest');
    for (const track of clip.tracks) {
      const rest = sampleAt(track, restTime);
      const differs = poseTimes.some(([, frame]) => {
        const pose = sampleAt(track, frame / fps);
        return rest.some((v, i) => Math.abs(v - (pose[i] ?? v)) > 1e-4);
      });
      if (differs) mouthTrackNames.add(track.name);
    }
    if (mouthTrackNames.size === 0) {
      console.info('[stage] viseme layer: no differing mouth tracks found');
      return mouthTrackNames;
    }

    // Pass 2: a single-keyframe clip + paused zero-weight action per pose.
    for (const [name, frame] of poseTimes) {
      const tracks: THREE.KeyframeTrack[] = [];
      for (const track of clip.tracks) {
        if (!mouthTrackNames.has(track.name)) continue;
        const Ctor = track.constructor as new (
          name: string,
          times: ArrayLike<number>,
          values: ArrayLike<number>,
        ) => THREE.KeyframeTrack;
        tracks.push(new Ctor(track.name, [0], sampleAt(track, frame / fps)));
      }
      const action = this.mixer.clipAction(new THREE.AnimationClip(`viseme_${name}`, 1, tracks));
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.weight = 0;
      action.play();
      this.visemeActions.set(name, action);
    }
    console.info(
      `[stage] viseme layer ready (${mouthTrackNames.size} mouth tracks, ` +
        `${this.visemeActions.size} poses)`,
    );
    return mouthTrackNames;
  }

  /**
   * Dev probe for the Gossamer facial-pose FBX files: reports whether the
   * mouth phoneme/brow/eyelid poses arrive as morph targets or animation
   * takes, to guide the viseme lip-sync implementation. Run from the console:
   *   await __port.stage.probePhonemes()
   */
  async probePhonemes(): Promise<Record<string, unknown>> {
    this.assets.register({
      id: 'rebecca_phonemes',
      url: asset('unity/models/rebecca/FBX/rebecca_mouth_phonemes.fbx'),
    });
    const obj = (await this.assets.load('rebecca_phonemes')) as
      | (THREE.Object3D & { animations?: THREE.AnimationClip[] })
      | null;
    if (!obj) return { loaded: false };
    const morphs: Record<string, string[]> = {};
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary) {
        morphs[mesh.name] = Object.keys(mesh.morphTargetDictionary);
      }
    });
    return {
      loaded: true,
      animations: (obj.animations ?? []).map((a) => ({
        name: a.name,
        duration: a.duration,
        tracks: a.tracks.length,
      })),
      morphTargets: morphs,
      children: obj.children.map((c) => `${c.type}:${c.name}`),
    };
  }

  /**
   * The pharmacy env's backdrop texture is assigned by a Unity .mat asset,
   * not inside the FBX — patch any untextured env material with the baked
   * nurse-station plane image.
   */
  private applyEnvTextures(root: THREE.Object3D): void {
    const backdrop = this.assets.loadTexture(
      asset('unity/models/env/textures/Nurse-Station_Tier3_Plane.png'),
    );
    const chair = this.assets.loadTexture(
      asset('unity/models/env/textures/baked-textures-chair-roll.png'),
    );
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const patched = materials.map((material) => {
        const std = material as THREE.MeshPhongMaterial;
        const name = `${mesh.name} ${std.name}`.toLowerCase();
        if (name.includes('plane_angle') || name.includes('nurse-station')) {
          return new THREE.MeshBasicMaterial({
            name: std.name || 'Nurse-Station_Tier3_Plane',
            map: backdrop,
            side: THREE.DoubleSide,
            toneMapped: false,
          });
        }
        if (name.includes('chair') || name.includes('baked-textures-chair-roll')) {
          std.map = std.map ?? chair;
          if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
          if ('color' in std) std.color.set(0xffffff);
          if ('specular' in std) std.specular.set(0x202020);
          if ('shininess' in std) std.shininess = 8;
          std.needsUpdate = true;
        }
        return std;
      });
      mesh.material = Array.isArray(mesh.material) ? patched : patched[0]!;
    });
  }

  /** Maps the known Rebecca textures onto materials by name. */
  private applyRebeccaTextures(root: THREE.Object3D): void {
    const base = asset('unity/models/rebecca/Textures');
    const pick = (name: string): { map: string; normal?: string } | null => {
      const n = name.toLowerCase();
      if (n.includes('scrub') || n.includes('cloth'))
        return { map: `${base}/rebecca_scrubs.png`, normal: `${base}/rebecca_scrubs-normal.png` };
      if (n.includes('hair')) return { map: `${base}/rebecca_hair.png` };
      if (n.includes('body') || n.includes('skin') || n.includes('head') || n.includes('face'))
        return { map: `${base}/rebecca_body.png`, normal: `${base}/rebecca_body-normal.png` };
      return null;
    };
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const std = material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial;
        const materialName = material.name.toLowerCase();
        const tex = pick(material.name || mesh.name);
        if (!std.map && tex) {
          std.map = this.assets.loadTexture(tex.map);
        }
        if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
        if (tex?.normal && 'normalMap' in std && !std.normalMap) {
          std.normalMap = this.assets.loadTexture(tex.normal, false);
        }
        if ('color' in std) std.color.set(0xffffff);
        if ('metalness' in std) std.metalness = 0;
        if ('roughness' in std) std.roughness = 0.78;
        if ('specular' in std) std.specular.set(0x1c1c1c);
        if ('shininess' in std) {
          std.shininess = materialName.includes('glasses') ? 28 : 10;
        }
        if (materialName.includes('hair')) {
          // Unity uses alpha-masked hair cards. Alpha blending makes the wig
          // shell sort poorly against the scalp in Three.js, while a high
          // hard cutoff drops too much of the painted hair mass.
          std.transparent = false;
          std.alphaTest = 0.01;
          std.alphaHash = true;
          std.alphaToCoverage = true;
          std.depthWrite = true;
          std.side = THREE.FrontSide;
        }
        std.needsUpdate = true;
      }
    });
  }

  /** Reads the Unity placement locator that FBXLoader preserves. */
  private captureEnvLocators(env: THREE.Object3D): void {
    this.characterLocator = env.getObjectByName('loc_char_rebecca') ?? null;
  }

  /** Places the standalone Rebecca FBX at the matching Unity env locator. */
  private placeRebecca(rebecca: THREE.Object3D): void {
    const locator = this.characterLocator;
    if (!locator) {
      rebecca.position.copy(this.character.position);
      return;
    }
    locator.updateWorldMatrix(true, false);
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    locator.matrixWorld.decompose(position, rotation, scale);
    rebecca.position.copy(position);
    rebecca.scale.multiply(scale);

    // The locator comes from Unity/FBX with Z-up basis. Rebecca's loaded FBX is
    // already Y-up, so use only the locator's horizontal facing: its -Y axis is
    // the character's forward direction in the scene.
    const forward = new THREE.Vector3(0, -1, 0).applyQuaternion(rotation);
    forward.y = 0;
    if (forward.lengthSq() > 1e-6) {
      forward.normalize();
      rebecca.rotation.y = Math.atan2(forward.x, forward.z);
    }
  }

  /** Applies a Konverse shot (camera + environment indices). */
  setShot(shotId: string | undefined): void {
    if (!shotId) return;
    const shot = this.shotsById.get(shotId.toLowerCase());
    if (!shot) return;
    const env = shot.environment ?? 0;
    const pharmacyVisible = env !== 1; // markup index 2 = Abstract-Background_env
    if (this.realEnv) this.realEnv.visible = pharmacyVisible;
    else this.pharmacy.visible = pharmacyVisible;
    this.abstractBg.visible = !pharmacyVisible;
    this.applyCamera(shot.camera ?? 0);
  }

  /**
   * The frame-filling surface is the baked nurse-station plane: the env mesh
   * with the largest XY face area (foreground props like the chair back are
   * deliberately excluded — framing against the full env bbox would let the
   * camera pull back past the plane's edges).
   */
  private findBackdropBounds(env: THREE.Object3D): THREE.Box3 | null {
    let best: THREE.Mesh | null = null;
    let bestArea = 0;
    env.updateWorldMatrix(true, true);
    env.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      const area = size.x * size.y;
      if (area > bestArea) {
        bestArea = area;
        best = mesh;
      }
    });
    if (!best) return null;
    const box = new THREE.Box3().setFromObject(best);
    this.backdropNormal = this.meshWorldNormal(best);
    this.measureBackdropExtents(best, box.getCenter(new THREE.Vector3()));
    return box;
  }

  /**
   * True in-plane half-extents along the camera right/up axes, from the plane
   * mesh's own local bounding-box corners transformed to world space (the
   * world AABB would mix the tilted quad's width into its height).
   */
  private measureBackdropExtents(mesh: THREE.Mesh, center: THREE.Vector3): void {
    const n = this.backdropNormal!;
    const right = new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP, n).normalize();
    const up = new THREE.Vector3().crossVectors(n, right).normalize();
    mesh.geometry.computeBoundingBox();
    const lb = mesh.geometry.boundingBox!;
    mesh.updateWorldMatrix(true, false);
    const corner = new THREE.Vector3();
    let halfR = 0;
    let halfU = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? lb.max.x : lb.min.x,
        i & 2 ? lb.max.y : lb.min.y,
        i & 4 ? lb.max.z : lb.min.z,
      );
      corner.applyMatrix4(mesh.matrixWorld).sub(center);
      halfR = Math.max(halfR, Math.abs(corner.dot(right)));
      halfU = Math.max(halfU, Math.abs(corner.dot(up)));
    }
    this.backdropHalfR = halfR;
    this.backdropHalfU = halfU;
  }

  /** First bone whose name matches (prefers an exact `head` over `head_tilt`
   *  etc.); used to find Rebecca's head joint for camera aim. */
  private findBone(root: THREE.Object3D, re: RegExp): THREE.Object3D | null {
    let exact: THREE.Object3D | null = null;
    let loose: THREE.Object3D | null = null;
    root.traverse((o) => {
      if (!(o as THREE.Bone).isBone || !re.test(o.name)) return;
      if (/(^|[_:.\s])head$/i.test(o.name)) exact ??= o;
      else loose ??= o;
    });
    return exact ?? loose;
  }

  /** Averaged world-space normal of a (flat) mesh, flipped into the +Z
   *  hemisphere so it points toward the viewer. */
  private meshWorldNormal(mesh: THREE.Mesh): THREE.Vector3 {
    const attr = mesh.geometry.getAttribute('normal');
    const acc = new THREE.Vector3();
    if (attr) {
      const v = new THREE.Vector3();
      for (let i = 0; i < attr.count; i++) {
        v.fromBufferAttribute(attr as THREE.BufferAttribute, i);
        acc.add(v);
      }
    }
    mesh.updateWorldMatrix(true, false);
    const nm = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    acc.applyMatrix3(nm);
    if (acc.lengthSq() < 1e-8) acc.set(0, 0, 1);
    acc.normalize();
    if (acc.z < 0) acc.negate();
    return acc;
  }

  private applyCamera(index: number): void {
    this.currentCameraIndex = index;
    const cam = this.runtime.camera;
    const f = this.focus;
    if (this.realEnv && this.backdropBox && this.backdropNormal) {
      this.applyFramedCamera(index, cam, this.backdropBox, this.backdropNormal);
      return;
    }
    const cx = f.x;
    if (index === 1) {
      cam.position.set(cx, f.y + this.cameraLift * 0.5, f.z + 1.4); // close-up framing
    } else {
      cam.position.set(cx + 0.12, f.y + this.cameraLift, f.z + 1.9); // conversation framing
    }
    cam.lookAt(cx, f.y, f.z);
  }

  /**
   * Matches the Unity build's framing: a TELEPHOTO camera (narrow FOV) pulled
   * far back along the backdrop plane's normal. The long lens compresses the
   * perspective to Unity's flat, near-frontal look, frames Rebecca waist-up,
   * and drops the off-axis second chair out of frame — whereas a wide lens up
   * close exaggerated the foreground and swept that chair in from the side.
   * The aim is centered on her (seated head, biased so her face sits in the
   * upper third), clamped so the backdrop plane still fills the frame.
   */
  private applyFramedCamera(
    index: number,
    cam: THREE.PerspectiveCamera,
    plane: THREE.Box3,
    normal: THREE.Vector3,
  ): void {
    const closeUp = index === 1;
    // Telephoto: ~15–19° vs the placeholder's 40°. Set per-call so the real
    // scene is always long-lens once the env loads.
    cam.fov = closeUp ? 15 : 19;
    cam.updateProjectionMatrix();
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const aspect = cam.aspect > 0 ? cam.aspect : 16 / 9;

    const center = plane.getCenter(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP, normal).normalize();
    const up = new THREE.Vector3().crossVectors(normal, right).normalize();

    // Distance set by how much of her to show vertically (waist-up): the lens
    // is long, so this lands the camera ~2.5–3 m back.
    const subjHalf = closeUp ? 0.34 : 0.58;
    const dist = subjHalf / tanHalf;

    // Frustum half-size AT the backdrop (it sits behind her by frontOffset);
    // used to clamp the aim so a plane edge never enters frame (no black).
    const rel = this.focus.clone().sub(center);
    const frontOffset = rel.dot(normal);
    const halfHPlane = tanHalf * (dist + frontOffset);
    const halfWPlane = halfHPlane * aspect;

    const clamp = (v: number, halfSpan: number, limit: number) =>
      limit <= halfSpan ? 0 : THREE.MathUtils.clamp(v, -(limit - halfSpan), limit - halfSpan);
    // Center her horizontally; lower the aim a touch so her face rides high
    // and the frame reads waist-up.
    const aimR = clamp(rel.dot(right), halfWPlane, this.backdropHalfR);
    const aimU = clamp(rel.dot(up) - 0.12, halfHPlane, this.backdropHalfU);

    const aim = center
      .clone()
      .add(right.clone().multiplyScalar(aimR))
      .add(up.clone().multiplyScalar(aimU));

    cam.position.copy(aim).add(normal.clone().multiplyScalar(dist));
    cam.lookAt(aim);
  }

  /**
   * Mouth-open level 0..1 plus the viseme pose to blend toward (a key of
   * VISEME_FRAMES; unknown/omitted poses fall back to the open AH). Weights
   * are eased toward the target in update() so pose switches don't pop.
   */
  setSpeaking(level: number, viseme = 'AH'): void {
    this.speakingLevel = level;
    this.currentViseme = this.visemeActions.has(viseme) ? viseme : 'AH';
  }

  private update(dt: number, elapsed: number): void {
    if (this.runtime.camera.aspect !== this.lastAspect) {
      this.lastAspect = this.runtime.camera.aspect;
      this.applyCamera(this.currentCameraIndex);
    }
    this.updateMicroMotion(dt);
    // Ease each viseme pose toward its target weight (selected pose gets the
    // speaking level, the rest decay to 0) — fast enough to track phonemes,
    // slow enough not to pop between pose switches.
    if (this.visemeActions.size > 0) {
      const ease = Math.min(1, dt * 14);
      for (const [name, action] of this.visemeActions) {
        const target = name === this.currentViseme ? Math.min(1, this.speakingLevel * 1.4) : 0;
        action.weight += (target - action.weight) * ease;
      }
    }
    this.mixer?.update(dt);

    // Once the seated idle has posed the skeleton, aim the camera at her REAL
    // head position (the bind-pose box used until now reads as standing).
    if (!this.seatedFocusCaptured && this.headBone && this.mixer) {
      this.seatedFocusCaptured = true;
      this.headBone.getWorldPosition(this.focus);
      this.focus.y += 0.05; // head joint → face
      this.applyCamera(this.currentCameraIndex);
    }

    if (this.character.visible) {
      // Idle sway so the placeholder reads as alive.
      this.character.rotation.y = Math.sin(elapsed * 0.45) * 0.05;
      this.character.position.y = Math.sin(elapsed * 1.1) * 0.012;
      if (this.mouth) {
        const open = this.speakingLevel > 0 ? 0.4 + 0.6 * Math.abs(Math.sin(elapsed * 14)) : 0.08;
        this.mouth.scale.y = open * this.speakingLevel + 0.12;
      }
    }
  }

  private buildPlaceholderPharmacy(): THREE.Group {
    const group = new THREE.Group();
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ab });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xdce4ea });
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x7d8a96 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x20a3ac });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 6), floorMat);
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    group.add(floor);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 0.1), wallMat);
    backWall.position.set(0, 1.7, -2.5);
    group.add(backWall);

    // Pharmacy shelving with "medication" boxes.
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.45), shelfMat);
      shelf.position.set(-2.2, 0.9 + i * 0.55, -2.2);
      group.add(shelf);
      for (let j = 0; j < 5; j++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.24, 0.18),
          j % 2 ? accentMat : new THREE.MeshStandardMaterial({ color: 0xc96b4a }),
        );
        box.position.set(-3.1 + j * 0.45, 1.05 + i * 0.55, -2.2);
        box.castShadow = true;
        group.add(box);
      }
    }

    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.7), shelfMat);
    counter.position.set(1.6, 0.5, -1.2);
    counter.castShadow = true;
    group.add(counter);

    return group;
  }

  private buildPlaceholderAbstract(): THREE.Group {
    const group = new THREE.Group();
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshBasicMaterial({ color: 0x16313d }),
    );
    backdrop.position.set(0, 1.6, -2.4);
    group.add(backdrop);
    return group;
  }

  /** Rebecca placeholder: capsule body + head with a "mouth" for lip flap. */
  private buildPlaceholderCharacter(): THREE.Group {
    const group = new THREE.Group();
    const scrubs = new THREE.MeshStandardMaterial({ color: 0x2e6f8e });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc6907a });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.75, 8, 16), scrubs);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), skin);
    head.position.y = 1.48;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 24, 18, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshStandardMaterial({ color: 0x3a2a20 }),
    );
    hair.position.y = 1.52;
    group.add(hair);

    this.mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x6e3b35 }),
    );
    this.mouth.position.set(0, 1.42, 0.155);
    group.add(this.mouth);

    group.position.set(0, 0, -0.2);
    return group;
  }
}
