# Migration Hard Parts

What was genuinely hard about porting this Unity course, how each part was
solved, and the precise semantics later work must not break. The C# sources of
truth live in `Assets/Backpack/KonverseSource/` (read-only).

## 1. Konverse engine semantics (ported, tested)

The TS engine (`src/conversation/`) is a behavioral port of
`KonverseSource/Runtime`. The invariants below were transliterated from C# and
are locked in by tests (`tests/engine.test.ts`, `tests/real-course.test.ts`):

- **Visibility**: `active && allowed && !closed && (!played || repeatable) &&
  allow_visibility && (!autoExpire || lifetimeRemaining > 0)` (Node.cs).
- **Evaluation order** in `EvaluateNode` (ConversationLogic.cs): mark played →
  add duration → evaluate ALL non-offered linkage conditions first, then apply
  them → walk events in order. A synthetic `cutscene` event is injected before
  the FIRST dialogue/mgfx event of each evaluated node (id = node.cutscene ??
  node.id) — one per recursion level.
- **Jumps**: recurse into the target; a non-returning jump (`"return": false`)
  aborts the remaining events of the current node. Self-jump is an authoring
  error. 51 of the course's 164 events are jumps — the graph is mostly jump
  chains.
- **Variables**: ints clamped to [min,max]; `min==0 && max==0` means
  unbounded. Every change emits a `variablechange` event. **Gates** fire only
  on threshold *crossing* (VariableGate.PassesThreshold has subtle
  can-start-equal rules — see `src/conversation/variable.ts`), disable
  themselves unless `repeat`, and jump like a `jump` event (honoring
  `return`).
- **Offered linkages** (`offeredclose/offereddisallow/offereddeactivate`) run
  in a separate pass after each selection, then every visible node is marked
  `offered`.
- **Lifetimes**: nodes that *will* lose lifetime are snapshotted BEFORE the
  selection is evaluated and decremented AFTER, unless a `delaylifetime` event
  fired this turn.
- **Choice menu**: visible nodes sorted by (index of tactic in Tactics.json,
  tactic_order, node file order), grouped into consecutive tactic runs.
- **History/undo**: every mutation journals into the *current* turn;
  `RecordSelection` pushes the journal and opens a new turn holding that
  selection's events. Undo pops back through activity turns until one
  selection is reverted. Intro evaluation happens while `initializing` so it
  is NOT journaled (turn 0 can't be undone).
- **Suspend data = the selected path string.** Restore is
  `engine.selectPath(path)` replay — node ids, `{"override":{...}}` segments,
  and `{"activity_x":{var:value}}` segments, comma-joined with balanced-brace
  parsing. This mirrors Unity (Conversation.SelectPath) and is what the LMS
  adapter stores.

### C# quirks deliberately preserved

- `&&` and `||` share ONE precedence level, left-associative
  (`1 || 0 && 0 === 0`). Same for `| ^ &` and for all comparisons. From
  MathParser.cs's precedence table; tests pin this.
- `=` means `==`; `<>` means `!=`.
- `defaultshot` events apply **even when their condition is false**
  (the C# handles them outside the ConditionMet block).
- Condition "met" means `evaluate() > 0.01`; missing/empty condition is 1.
- Unknown identifiers/functions throw (editor behavior), they don't return 0.

### Known divergences (safe for this course, validator-guarded)

- `!identifier` / `!constant`: the C# RPN evaluator silently DROPS the
  negation (only functions and `!(...)` apply it). The TS port applies real
  negation. `npm run validate` flags any usage (this course has none — `!` is
  only used as `!Played(...)`).
- `**` (exponent): C#'s MathOperator has no Exponent case so it returns 0;
  TS returns `Math.pow`. Unused in this course.
- String operands are only minimally supported (numeric coercion); the course
  uses none.

## 2. Auto-assigned audio (solved — easy to get wrong)

Only 1 of 42 dialogue events names its WAV explicitly. The rest use
`"auto_assign_audio": true` and derive the clip at runtime
(DialogueEventElement.GetAutoAssign):

```
clip = nodeId.replace(/^node_/, '')
     + ('a' + index of this event among the node's DIALOGUE events)
# node_a31_0, first dialogue  -> a31_0a.wav
# thought events insert "thought" before the letter
```

Implemented in `src/content/types.ts: resolveEventAudio`. `"empty"` is the
authored silence marker. All 38 referenced clips resolve against
`ATIENGPH_DME_10_Audio/Conversations/ENGPH_DME_10/` (validated).

Dialogue text embeds `[br<seconds>]` markers — caption/line-break timing
hints. UI strips them for display; keep them for future caption timing and
lip-sync alignment (they're passed to `AudioHooks.onClipStart`).

## 3. Localization scheme (solved)

Every element may carry a `localization_guid`; display text resolves
`"<guid>_<field>"` (e.g. `550cea39_text`, `29e4d969_title`) in
`LocalizationSource/LocalizationSource.json`, falling back to the inline JSON
value. Implemented in `src/content/localization.ts`; applied to dialogue/coach
/variabletext text, node titles, tactic/character names. The Unity runtime
loads compiled `localization.bpb` bundles instead — for new locales, generate
a new LocalizationSource-shaped map and inject it into the loader.

## 4. Activities (minimal path solved)

The course has 3 `insulin_*` activities (slider 0–30, correct value 3, plus a
continue flag). Engine flow: an `activity` event blocks node selection until
all result maps are set and `finalizeActivities()` runs — results are
assigned (`set-values: true`) or added to the mapped variables, gates fire,
then the activity's `node` (auto-select logic node) is evaluated, recorded as
an *activity turn* (doesn't count toward turnNumber, undo skips through it).
The logic nodes branch on `var_activity_insulin_continue == 0/1` to loop the
activity or move on. UI: `src/ui/overlays.ts: ActivityPanel` renders the
slider with the Unity syringe MGFX sprites so the dosage activity matches the
original screen more closely.

## 5. Scene/character/Gossamer (real FBX assets now load; sequencing pending)

Unity drives Rebecca with Timeline sequences + Gossamer (body anim, facial
expressions, WAV-derived lip-sync via `AutoLipSyncKonverse.cs`). The port
defines seams in `src/performance/director.ts` (`PerformanceDirector`,
`BodyAnimationDriver`, `FacialExpressionDriver`, `LipSyncDriver`,
`ShotDriver`); `MinimalDirector` switches camera/environment per Konverse
shot, and `AmplitudeLipSync` (WebAudio analyser) drives the mouth level.

**Status: the real Unity FBX assets load directly in the browser** via
three's FBXLoader (`src/scene/assets.ts` + `Stage.upgradeToRealAssets`), with
the procedural placeholders as automatic fallback. Verified working: the
PHARM_T3_env baked backdrop, the textured Rebecca rig (`rebecca!#.fbx`), and
her idle animation (`rebecca!&1_body_idle.fbx`) retargeted via
AnimationMixer. Hard-won loader facts:

- **One FBXLoader instance per load.** `resourcePath` is loader state;
  concurrent `loadAsync` calls clobber each other's texture base path.
- FBX files reference textures by bare filename; the PNGs live in sibling
  `textures/` (env) and `Textures/` (Rebecca) folders → set
  `loader.setResourcePath()` to those (served at `/unity/models/*`).
- The env backdrop's texture (`Nurse-Station_Tier3_Plane.png`) is assigned by
  a Unity `.mat` asset, NOT inside the FBX — `Stage.applyEnvTextures` patches
  any untextured env material with it (it renders magenta otherwise).
- Unity rigs are centimeter-scaled: bounding boxes > 50 units are shrunk
  ×0.01 (`AssetRegistry.loadFbx`).
- Filenames contain `!`, `&`, `#`, `$` — `#` MUST be percent-encoded in URLs
  (`rebecca!%23.fbx`), and shell commands need quoting.
- The character naming scheme is Gossamer's layering: `!#` base mesh,
  `!&1_body_*` body takes (idle/gesture/nod/...), `!&2_head_*` head,
  `!&3_brows/_4_eyelids/_5_eyeballs_Poses` facial poses,
  `!&6_mouth_Phonemes` visemes (each with a sidecar `.txt` naming the poses).

Body gestures are wired: `Stage.loadGestures` loads six body/head takes,
`Stage.playGesture` one-shots them crossfaded against the idle, and
`MinimalDirector.beginLine` picks one deterministically per dialogue id.

**Viseme finding (probed via `__port.stage.probePhonemes()` in the dev
console):** `rebecca!&6_mouth_Phonemes.fbx` contains NO morph targets — it is
a single 2.2 s, 492-track bone-pose animation. The sidecar
`rebecca!&6_mouth_Phonemes.txt` maps frame pairs (30 fps) to poses:
`rest, ST, E, MBP, CH, AH, OO, FV, L, A, O` in neutral / `(sad)` / `(smile)`
variants (frames 1–66). Brows/eyelids/eyeballs pose files follow the same
scheme. So lip-sync = sample that clip at `frame/30` on a mouth-masked bone
subset (Unity uses `rebecca_mouth.mask`) and crossfade between paused
actions — implement as a pose layer, not morph weights.

The viseme pose layer IS implemented (`Stage.setupVisemeLayer`): it samples
the `rest` and `AH` frames, keeps only the tracks that differ (=the mouth
bones, 71 tracks — no Unity-mask parsing needed), builds a single-pose clip,
and `setSpeaking(level)` drives its action weight from the amplitude
lip-sync. Crucially the mouth tracks are STRIPPED from the idle/gesture
clips, otherwise their full-weight playback dilutes the viseme blend to
near-invisibility (verified visually both ways).

**Done since:** all 11 viseme poses build from the phoneme FBX and a crude
RMS+zero-crossing formant analysis picks AH/MBP/OO/FV per frame
(`AmplitudeLipSync` → `setSpeaking(level, viseme)`); GLB (Draco) delivery is
supported (`Stage.loadPreferred` prefers `public/models/<id>.glb`, see
`scripts/convert-assets.md`). Camera framing is now driven by the backdrop
plane's true normal (`Stage.applyFramedCamera`) — the plane is rotated ~33°
about Y, so looking along its normal gives the designed 3/4 angle that fills
the plane AND keeps the foreground chair beside Rebecca rather than across
her torso (the earlier straight-down-Z bbox framing viewed the tilted scene
head-on and let the chair occlude her).

**Remaining:** emotional viseme variants ((sad)/(smile) at frames +22/+44) or
offline per-WAV viseme tracks for exact lip-sync; per-shot camera transforms
lifted from the Unity scene (the Main Camera in
`Animation/template-PH_T3_conv.unity` sits at `(-1.99, 1.29, 2.96)` looking
back along `(0.54, -0.11, -0.83)` — note the env FBX is imported with a y/z
axis flip, so Unity coords can't be copied directly). Shots map indices into
`MarkUp/ENGPH_DME_10_environments_markup.json` containers:
`[Fade Plane, PHARM_T3_env, Abstract-Background_env]`.

## 6. LMS / xAPI boundary (stubbed by design)

`src/lms/adapter.ts` defines the seam; `LocalStorageLmsAdapter` is the dev
implementation; `XapiLmsAdapter` is a config-injected skeleton (endpoint,
auth, actor, activity IRI passed in — **no production endpoints are
hard-coded**; the Unity build pointed at `https://expapi.kognito.com/` via
Knet). Suspend data is `{selectedPath, turnNumber, completed, success}` —
replaying selectedPath restores everything else.

## 7. Scoring/transcripts (data available, UI not built)

Tactic weights live in variables (`var_WEIGHT_Target=10`, `_Fair=8`,
`_Neutral=5`, `_Weak=3`, `var_TOTALSCORE_MaxRaw=10`) and node tags
(`tag_Target/Fair/Neutral/Weak/Poor`). The dashboard nodes
(`node_db_step*`) populate `var_db_*` text variables via conditional
`variabletext` events — the engine already evaluates them (test-verified);
an ending screen just needs to render those variables' `.text`.

## Top risks for whoever continues

1. **Engine drift**: don't "fix" the quirks above — the content was authored
   against them. The tests encode them; keep tests green.
2. **FBX conversion fidelity** (rig/blendshapes/material slots) is unproven.
   Budget a manual Blender pass.
3. **Lip-sync**: Unity bakes visemes offline per WAV. Browser options:
   precompute viseme tracks offline (recommended; store JSON next to GLBs) or
   live amplitude analysis (cheap but flappy). The `LipSyncDriver` seam
   accepts either.
4. **Undo depth with audio**: undo restores engine state instantly but the
   app does not replay/rewind audio mid-line; current UI only allows undo
   between turns — keep it that way unless you add audio scrubbing.
5. **Single-course assumptions**: loader paths and course id are constants in
   `unity-paths.ts` / `main.ts`; generalize before pointing at sibling
   courses.
