# Next Tasks (sized for smaller models)

Each task is self-contained, names its files, and has a clear done-check.
Before starting any task: `cd threejs-port && npm install && npm test` —
all 61 tests must pass before AND after your change. Do not modify anything
under `Assets/` (the Unity project) or change engine semantics
(`src/conversation/`) unless the task says so.

> **Progress note (2026-06-12):** tasks 1–3, 5–10, and 14–17 below are DONE
> (see git-less diff in threejs-port). Task 4 is done for the two tactic
> icons. Tasks 11–13 were superseded: the real FBX assets now load directly
> in the browser via FBXLoader (`Stage.upgradeToRealAssets`) — environment,
> textured Rebecca, and idle animation all render. See the NEW TASKS section
> at the bottom for what remains.

## A. UI polish (no engine knowledge needed)

1. **Typing indicator while audio plays.** In `src/main.ts` `playQueue`,
   add a CSS class to `#speaker-line` while a dialogue clip plays and remove
   it after. Style it in `index.html` (e.g. subtle pulse on the speaker
   name). Done: visible pulse during voice lines.
2. **Choice hover/focus styles + ARIA.** In `src/ui/panel.ts`, set
   `role="listbox"`/`role="option"`-appropriate attributes or proper
   `aria-pressed`, and `aria-live="polite"` on `#line-text` and `#captions`.
   Done: axe DevTools shows no new violations on the main view.
3. **Restart button.** Add a "Restart" button to `#status-bar` that calls
   `lms.clearSuspendData()` and `location.reload()`. Done: clicking it starts
   the course from the intro.
4. **Tactic icons.** Tactics carry `metadata.image` (e.g. `tactic_respond`).
   Sprites are in `Assets/ATIENGPH_DME_10_Assets/Sprites/` — copy the two
   tactic PNGs into `threejs-port/public/tactics/` (copying OUT of Assets is
   fine; never write into Assets) and show them next to group headings in
   `src/ui/panel.ts`. Done: icons render beside RESPOND / MOVE ON.
5. **Volume/caption toast.** Show a small fading toast when volume, mute, or
   captions change (currently only the status bar updates). Files:
   `src/main.ts`, `index.html`. Done: pressing -/+/V/C shows feedback.

## B. Content & validation

6. **Validate report as test fixture.** Add `tests/validate-snapshot.test.ts`
   asserting the exact event-type counts and `audio.unused` list from
   `npm run validate`, so content drift is caught. Done: new test passes.
7. **Caption timing from [br] markers.** Dialogue text embeds
   `[br<seconds>]` markers. In `src/ui/overlays.ts` add
   `splitCaptionSegments(text): {atSeconds, text}[]` (exported, unit-tested)
   and use it in `Captions.show` + `AudioHooks` to advance captions while the
   clip plays (sample `audio.currentTime` every 250ms). Done: long lines
   change captions mid-clip; unit tests for the splitter.
8. **Transcript view.** `engine.getTranscript()` already returns events per
   turn. Add a "Transcript" toggle in the panel rendering speaker lines and
   chosen answers. Files: `src/ui/transcript.ts` (new), `src/main.ts`.
   Done: full conversation history is readable after several turns.

## C. Ending / scoring (read MIGRATION_HARD_PARTS.md §7 first)

9. **Ending screen.** When `convo.completed`, render the dashboard variables
   (`var_db_MiniHeader`, `var_db_overall_intro`, `var_db_ini_*`, ... — every
   `var_db_*` with non-empty `.text`, in Variables.json order) as a results
   page replacing the choices panel. Strip TMP tags with `cleanText` but keep
   paragraph breaks. Done: completing the course shows the case-study
   feedback text.
10. **Score meter.** Compute a running score: when a node with tag
    `tag_Target/Fair/Neutral/Weak` is selected, add the matching
    `var_WEIGHT_*` value; show `score / var_TOTALSCORE_MaxRaw` when the
    `meter` command (B key) fires. Files: `src/main.ts` only (listen on the
    command bus; read tags via `convo.getNode(id)`). Done: B toggles a meter
    that changes after scored choices.

## D. Assets (bigger; do in order; needs local tooling)

11. **Convert PHARM_T3_env to GLB.** Use FBX2glTF or Blender on
    `Assets/.../PHARM_T3_env/fbx/PHARM_T3_env$.fbx` (quote the `$`). Output
    `threejs-port/public/models/pharm_t3_env.glb` (<25 MB, Draco ok). Done:
    GLB loads in https://gltf-viewer.donmccurdy.com/ with textures.
12. **Load the GLB in the stage.** Register it in `AssetRegistry`
    (`src/scene/stage.ts`): try `assets.load('pharm_t3_env')`, add it to the
    scene on success, keep the placeholder on failure. Done: real pharmacy
    visible at http://localhost:5180, placeholder still works if the file is
    deleted.
13. **Convert + load Rebecca** the same way (idle FBX first:
    `Rebecca/FBX/rebecca!&2_head_tilt-D.fbx`...). Verify the skinned mesh and
    blendshapes import; play the idle animation with THREE.AnimationMixer in
    `Stage`. Done: rigged Rebecca idles in the scene.
14. **Amplitude lip-flap.** Implement a `LipSyncDriver`
    (`src/performance/lipsync-amplitude.ts`) using WebAudio AnalyserNode on
    the dialogue HTMLAudioElement; drive the jaw/viseme blendshape (or the
    placeholder mouth via `Stage.setSpeaking(level)`). Wire it in
    `MinimalDirector.beginLine`. Done: mouth movement follows actual audio
    amplitude, silent for "empty" clips.

## E. Engine extensions (careful — read MIGRATION_HARD_PARTS.md §1 fully)

15. **Thought events UI.** The engine already passes `thought` events
    through `playQueue`. Render them as italicized self-talk (distinct from
    spoken lines), gated behind the `thoughts` command (T key). Done: a
    synthetic test node with a thought event displays correctly (add a unit
    test using `makeProject` from `tests/fixtures.ts`).
16. **xAPI adapter integration test.** Add `tests/xapi-adapter.test.ts`
    mocking `fetch` and asserting `XapiLmsAdapter` produces well-formed
    statements/state calls (verb IRIs, state document URL params). Done: new
    tests pass without network access.
17. **Generalize course paths.** Move `COURSE_ID` and the Unity paths into a
    single `course-config.ts` consumed by `unity-paths.ts`, `main.ts`, and
    `vite.config.ts`, so a sibling course is a one-file change. Done: grep
    shows no other hard-coded `atiengph_dme_10` / ENGPH_DME_10 outside that
    file and docs/tests.

## NEW TASKS (after the FBX milestone, 2026-06-12)

18. **Frame the backdrop fully.** DONE (2026-06-12). The fix was NOT a
    straight-on fill: the baked plane is rotated ~33° about Y, so
    `Stage.applyFramedCamera` now looks ALONG the plane's true normal (stored
    as `backdropNormal`) — the designed 3/4 angle, which both fills the plane
    and moves the foreground chair to the side instead of guillotining
    Rebecca's torso. Camera distance over-fills the (short) plane so framing
    her face never exposes the top edge; in-plane extents are measured from
    the plane mesh's own corners (`measureBackdropExtents`), and the aim is
    panned to seat her on the right third at her own depth, clamped to the
    plane. Verified: no black margins and Rebecca in shot at 16:9, 4:3, and
    portrait.
19. **Gesture playback.** DONE (2026-06-12): `Stage.loadGestures` +
    `playGesture` crossfade six takes against the idle; the director picks
    one per dialogue id hash.
20. **Phoneme/viseme lip-sync.** DONE (2026-06-12). `Stage.setupVisemeLayer`
    now builds all 11 mouth poses from the phoneme FBX (`VISEME_FRAMES`,
    sampling each pose's `frame/30`); mouth bones = tracks differing from rest
    in any pose, stripped from the body takes. `AmplitudeLipSync` does crude
    formant analysis (RMS + zero-crossing rate) to pick AH/MBP/OO/FV per
    frame with a 2-frame debounce; `setSpeaking(level, viseme)` eases the
    chosen pose's weight. Thresholds pinned by `tests/lipsync.test.ts`.
    Remaining: emotional (sad)/(smile) variants, or offline per-WAV tracks.
21. **GLB production pipeline.** DONE (2026-06-12): `scripts/convert-assets.md`
    documents the Blender/FBX2glTF → Draco GLB conversion (per-asset filename
    table, decoder note). `AssetRegistry` wires a `DRACOLoader`;
    `Stage.loadPreferred` HEAD-checks `public/models/<id>.glb` and uses it
    when present, else the Unity FBX. Verified the FBX fallback still loads
    with no GLBs present.
22. **Head/eye micro-motion.** DONE (2026-06-12): `Stage.updateMicroMotion`
    plays the `tilt-l/tilt-r/nod` takes at low weight (sin envelope, peak
    0.35) at random 4–9 s intervals between lines, suppressed while speaking
    or gesturing, so she doesn't stare rigidly between turns.
