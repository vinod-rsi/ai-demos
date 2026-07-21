# FBX → GLB conversion (production asset pipeline)

Direct FBX parsing in the browser works (and remains the automatic fallback)
but a binary glTF pipeline is smaller and faster to parse. The stage prefers
`public/models/<id>.glb` for every 3D asset and silently falls back to the
Unity FBX when a GLB is absent (`Stage.loadPreferred`), so this conversion is
**optional per-asset** — convert what you want, ship what you have.

## Target files

Place outputs in `sim/public/models/` and list their file names in
`sim/public/models/__list.json` (e.g. `["rebecca.glb"]`) — the stage reads that
manifest instead of probing each id, so an unlisted GLB is simply never used.
The `<id>.glb` names the stage looks for:

| GLB                       | Unity FBX source (read-only — never modify)                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `pharm_t3_env.glb`        | `Assets/.../ATIENGPH_DME_10_Environments/PHARM_T3_env/fbx/PHARM_T3_env$.fbx` |
| `rebecca.glb`             | `Assets/.../Rebecca/FBX/rebecca!#.fbx`                                        |
| `rebecca_idle.glb`        | `Assets/.../Rebecca/FBX/rebecca!&1_body_idle.fbx`                             |
| `rebecca_gesture-b.glb`   | `Assets/.../Rebecca/FBX/rebecca!&1_body_gesture-B.fbx`                        |
| `rebecca_gesture-l.glb`   | `Assets/.../Rebecca/FBX/rebecca!&1_body_gesture-L.fbx`                        |
| `rebecca_gesture-r.glb`   | `Assets/.../Rebecca/FBX/rebecca!&1_body_gesture-R.fbx`                        |
| `rebecca_nod.glb`         | `Assets/.../Rebecca/FBX/rebecca!&1_body_nod.fbx`                              |
| `rebecca_tilt-l.glb`      | `Assets/.../Rebecca/FBX/rebecca!&2_head_tilt-L.fbx`                           |
| `rebecca_tilt-r.glb`      | `Assets/.../Rebecca/FBX/rebecca!&2_head_tilt-R.fbx`                           |
| `rebecca_phonemes.glb`    | `Assets/.../Rebecca/FBX/rebecca!&6_mouth_Phonemes.fbx`                        |

Notes:

- **Quote the filenames** in every shell command — they contain `$ ! & #`.
- Animation-only takes (`rebecca_idle` and the gestures/phonemes) must keep
  their animation and their bone names untouched; the stage retargets them
  onto the `rebecca.glb` skeleton by track name.
- The env's backdrop texture (`Nurse-Station_Tier3_Plane.png`) is assigned by
  a Unity `.mat`, not the FBX. If your exporter leaves the plane untextured
  that's fine — `Stage.applyEnvTextures` patches it at runtime — but baking
  it in produces a self-contained GLB (assign it in Blender before export).
- Rebecca's textures live in `Assets/.../Rebecca/Textures/` (`rebecca_body`,
  `rebecca_scrubs`, `rebecca_hair` + normals). Assign them in Blender so the
  GLB embeds them; otherwise `Stage.applyRebeccaTextures` patches by
  material name at runtime.

## Option A — Blender (recommended: handles the rig + lets you fix materials)

Blender ≥ 3.6. Per asset, headless:

```bash
blender --background --python-expr "
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=r'<ABS PATH TO FBX>')
bpy.ops.export_scene.gltf(
    filepath=r'<ABS PATH TO threejs-port/public/models/<id>.glb>',
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_morph=True,
    export_draco_mesh_compression_enable=True,   # Draco; see decoder note
)
"
```

For `rebecca.glb` do an interactive pass instead of headless at least once:
import the FBX, check the skinned mesh deforms (pose a bone), assign the
Textures/ PNGs to the three materials, then export. FBX-to-Blender scale is
centimeters — leave it; the runtime auto-shrinks ×0.01 (>50-unit bboxes,
`AssetRegistry.normalize`).

## Option B — FBX2glTF (fast, no GUI; weaker material control)

```bash
npx fbx2gltf --binary --draco \
  --input 'Assets/.../PHARM_T3_env/fbx/PHARM_T3_env$.fbx' \
  --output threejs-port/public/models/pharm_t3_env.glb
```

FBX2glTF won't see the Unity `.mat` texture assignments either; the runtime
patches those (see notes above).

## Draco decoder

Draco-compressed GLBs need the WASM decoder served at `/draco/`:

```bash
cp -r node_modules/three/examples/jsm/libs/draco/gltf/ public/draco/
```

(`AssetRegistry` sets `DRACOLoader.setDecoderPath('/draco/')`.) Skip the
`--draco` / `export_draco_mesh_compression_enable` flags and you don't need
this at all.

## Verify

1. Drop the GLB into <https://gltf-viewer.donmccurdy.com/> — textures, rig
   and animation should look right (target: env < 25 MB).
2. `npm run dev`, open the console — `[stage] using GLB for <id>` confirms
   the GLB path is being taken; delete the file and the FBX fallback must
   still work.
