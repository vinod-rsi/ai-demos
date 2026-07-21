# Three.js Port — Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> (This plan was executed inline by the authoring session on 2026-06-11.)

**Goal:** A runnable Vite + TypeScript + Three.js app in `threejs-port/` that plays the real ENGPH_DME_10 branching conversation (Konverse engine ported to TS), with voice audio, choice UI, validation tooling, and clean seams for scene/LMS/input/lip-sync work.

**Architecture:** A faithful TypeScript port of the Konverse runtime (`Assets/Backpack/KonverseSource/Runtime` + `ExpressionParser`) reads the untouched Unity JSON content, served read-only through a Vite middleware. The engine is pure TS (no DOM), unit-tested with Vitest against the real course data. A thin app shell wires engine → UI panel + Three.js placeholder scene + WAV audio + LMS stub + keyboard commands.

**Tech Stack:** Vite 6, TypeScript 5, three (npm), Vitest. No other runtime deps.

---

## Konverse semantics specification (from C# source — the contract the TS port must honor)

Source of truth read on 2026-06-11 from `Assets/Backpack/KonverseSource/`:

### Content files (per `ResourcesConversationProjectStorage.cs`)
- `Conversation.json` — `{id, name, intro, outro, update?, starting_tag, version, disable_undo?, auto_dialogue_variables?, behavior_shot?, default_tactic_color_{r,g,b}, behavior_menu?[]}`.
- `Nodes/*.json` — every file in the folder is a node (Graph.json is editor-only layout; **not needed at runtime**).
- `Activities/Activities.json`, `Characters/Characters.json`, `CoachStyles/CoachStyles.json`, `Shots/Shots.json`, `Tactics/Tactics.json`, `Tags/Tags.json`, `Variables/Variables.json`, `Milestones/Milestones.json` — arrays.
- `LocalizationSource/LocalizationSource.json` — flat map `"<guid>_<field>": string`. Runtime text lookup is `${localization_guid}_${field}` with inline JSON value as fallback.

### Node schema (per `NodeParser.cs`)
`id, localization_guid, allow_visibility, repeatable, behavior_menu_type (int), inaccessible, title, technique, cutscene, tactic, lifetime {type: active|offered, duration:int, action: deactivate|close} (or bare int = duration), tactic_order, tags[], linkages[{id, type, condition?}], events[], conditional_titles[], conditional_tactics[], behavior_id (int), duration (float)`.

Linkage types: `activate, deactivate, allow, disallow, close, offereddeactivate, offereddisallow, offeredclose`. Target id may be a node **or** a tag (tag applies to every node carrying it).

### Event types (per `ElementParserFactory.cs`)
`activity, coach, defaultshot, delaylifetime, dialogue, endconversation, generic, idle, jump, mgfx, questionnaire, shot, thought, variable, variabletext, milestonetext, milestone, toggleundobutton`. All have optional `condition` (RPN string; met ⇔ eval > 0.01; missing/empty ⇔ 1). This course uses: dialogue(42), jump(51), variabletext(57), variable(7), coach(3), activity(3), endconversation(1).

Key fields: dialogue `{audio, auto_assign_audio, text, character, shot, variable?}`; jump `{target, return}`; variable `{variable, expression, modifier: assign|increment}`; variabletext `{variable, text}`; coach `{style, text}`; activity `{activity}`; endconversation `{success}`.

### Node state machine (per `Node.cs`)
Booleans `played, offered, selected, active, allowed (default true), closed`, ints `lastPlayed (-1), lifetimeRemaining`.
`Visible = active && allowed && !closed && (!played || repeatable) && allowVisibility && (!autoExpire || lifetimeRemaining > 0)`.
`SetActive(true)` resets `lifetimeRemaining` to full. Lifetime decrements once per `SelectNode` for nodes that `WillLoseLifetime()` (type `active` → when active; `offered` → when visible), captured **before** the selection is evaluated, applied **after** unless a `delaylifetime` event fired; at 0 it deactivates or closes.

### Evaluation loop (per `ConversationLogic.cs`, `Conversation.cs`)
1. `Start()`: activate all nodes tagged with `starting_tag`; evaluate intro node (if any); `PerformOfferedLinkages()`.
2. `SelectNode(node)`: reject if initializing / selected&&!repeatable / !visible / pending activities. Apply pending variable overrides. Reset `reset_text` variable texts to defaults. Snapshot lifetime-expiring nodes → `node.Select()` → `EvaluateNode(node)` → evaluate `update` node if configured → apply lifetimes → `PerformOfferedLinkages()` → if completed, evaluate outro. Record history turn.
3. `EvaluateNode(node)` (recursive): mark played, add node.duration to TotalDuration; evaluate **non-offered** linkages whose condition is met (activate/deactivate/allow/disallow/close on node-or-tag targets); then for each event in order, if condition met:
   - First dialogue/mgfx event: inject synthetic `cutscene` event before it (id = node.cutscene ?? node.id).
   - `jump`: recurse into target (self-jump is an error); append its events; stop processing remaining events if `return == false`.
   - `variable`: clamp to [min,max] ((0,0) ⇒ unbounded), emit `variablechange` event {old,new}; if a gate triggers, recurse into gate target (stop if `gate.return == false`).
   - `milestone`/`milestonetext`: set state / set text, emit change event.
   - `coach`/`variabletext`: substitute `$text(var)`, `$value(var)`, `$pathtime(fmt)`, `$seattime(fmt)`, `$formattime(fmt,val)` in text; coach result goes to event.replacementText, variabletext sets variable.text.
   - `activity`: push to pending list (blocks node selection until finalized).
   - `delaylifetime`: suppress this turn's lifetime decrement.
   - `endconversation`: mark conversation completed(success).
   - `toggleundobutton`: set undo enabled flag.
   - `defaultshot`: **applied regardless of condition** (C# quirk — handled outside the ConditionMet block).
   - `camefrom(node)` tracks the current recursive evaluation chain (`CameFromNodes`, cleared at top-level return).
4. `PerformOfferedLinkages()`: for visible nodes, apply offered-type linkages whose condition is met, then mark all visible nodes `offered`.
5. Activities: `FinalizeActivities()` applies each result map to its variable (`set-values`/ResultType add vs assign), emits variablechange, follows gates, then evaluates the activity's `node` (auto-select), records an activity history turn.

### Choice menu (per `Conversation.GetBehaviorSelection`)
Visible nodes sorted by (index of node.tacticId in Tactics list, node.tactic_order, node list order), grouped into consecutive runs of equal tacticId → `TacticContainer{name, metadata, behaviors}`. Conditional titles/tactics: first row whose condition is met wins, else default.

### History/undo (per `History/*.cs`)
Every state mutation (`AddChange`) goes into the **current turn**'s change journal (skipped while initializing). `RecordSelection(node, events)` pushes current turn and opens a new one carrying {node, events}. `TurnNumber` counts non-activity turns. `Undo()` pops turns (reverse-applying each change journal) through any activity turns until a selection turn is undone, and returns the events of the restored turn.

### Expressions (per `ExpressionParser/`)
Infix grammar → RPN (shunting-yard) → stack evaluation over doubles.
- Identifiers (case-insensitive): `true`→1, `false`→0, `pi`→π, `pathtime`→TotalDuration, `seattime`→SeatTime, `var_*`→variable value, `mile_*`→milestone state, `node_*`/`tag_*`→0 (only meaningful as function args, matched by **FieldName**).
- Functions: `Min(a,b)`, `Max(a,b)`, `Approx(a,b[,tol=0.05])`; node-status functions (1 arg): `Played, Offered, Selected, Active, Allowed, Closed, Visible, Duration, CameFrom/ComingFrom/JumpingFrom, TurnsAgo` — arg may be a node id or a tag id (tag ⇒ **sum** over tagged nodes, except TurnsAgo ⇒ min of non-negative); `mile_` arg ⇒ milestone status fns (`upcoming, inprogress, completed, failed, skipped, value`).
- Operators: `|| && ! == != (<>) < <= > >= + - * / // (int div) % ** ?:` and unary `+ -`. Logical ops treat non-zero as true and return 1/0. `!fn(...)` negates the function result. **C# quirk:** `!identifier` and `!constant` parse but the negate flag is silently ignored (only functions and `!(...)` apply it); the TS port applies real negation and the validator flags any `!identifier` usage (none in this course).
- Condition met ⇔ result > 0.01. Empty/missing expression ⇔ 1.

### Suspend/resume (per `Conversation.SelectPath`)
The selected path (comma-joined node ids + JSON segments for activity results / variable overrides) is the durable conversation state; restore = replay `selectPath(string)` from a fresh engine. This is what goes in LMS suspend data.

### Other course facts
- Audio: dialogue `audio` field + `.wav` in `Assets/ATIENGPH_DME_10_Assets/ATIENGPH_DME_10_Audio/Conversations/ENGPH_DME_10/`; `"empty"` = silence. Text contains `[br<seconds>]` timing markers (caption/line-break hints) to strip for display and keep for caption timing hooks.
- Key mapping (from `Assets/StreamingAssets/KAT-BackpackConfig.json` → course `KeyMapping`): arrows→up/down/left/right, Space/Return/KeypadEnter→select, Minus/Underscore/KeypadMinus→volume-down, Plus/Equals/KeypadPlus→volume-up, V→toggle-mute, C→toggle-captions, F→toggle-fullscreen, P→toggle-play, A→coach, T→thoughts, B→meter.
- Shots: index into MarkUp containers (`Environments`: [Fade Plane, PHARM_T3_env, Abstract-Background_env]; `Characters`: [rebecca]). Models are FBX only (no glTF in repo) → placeholder scene + documented FBX→glTF pipeline.
- 60 nodes, 62 variables (12 with min/max, none with gates), 11 tags, 2 tactics, 2 shots, 1 character, 3 coach styles, 3 slider activities, 0 milestones.

---

## File structure

```
threejs-port/
├── package.json / tsconfig.json / vite.config.ts / index.html
├── docs/  (this plan, MIGRATION_HARD_PARTS.md, NEXT_MODEL_TASKS.md)
├── scripts/validate-content.ts          ← npm run validate
└── src/
    ├── main.ts                          ← app bootstrap
    ├── content/
    │   ├── types.ts                     ← raw JSON schema types
    │   ├── source.ts                    ← ContentSource (fetch | fs) abstraction
    │   ├── loader.ts                    ← loadConversationProject()
    │   ├── localization.ts              ← guid_field lookup
    │   └── validate.ts                  ← validation report builder
    ├── conversation/
    │   ├── expression/{lexer,parser,evaluator}.ts  ← infix→AST→eval (IEvaluationData equiv.)
    │   ├── events.ts                    ← runtime event union + factory
    │   ├── node.ts / variable.ts / milestone.ts / linkage.ts
    │   ├── history.ts                   ← turns + change journal + undo
    │   ├── logic.ts                     ← EvaluateNode / linkages / activities
    │   └── engine.ts                    ← Conversation facade (start/select/undo/selection/paths)
    ├── scene/{renderer,assets,stage}.ts ← Three.js runtime + asset registry + placeholder stage
    ├── audio/audio-service.ts           ← WAV playback, caption/lip-sync hooks
    ├── lms/{adapter,local-adapter,xapi-adapter}.ts
    ├── input/{commands,keymap,keyboard}.ts
    ├── performance/director.ts          ← Gossamer/Timeline replacement interfaces + minimal impl
    └── ui/{panel,choices,debug,captions}.ts
tests/ (vitest): expression.test.ts, variable.test.ts, node-state.test.ts,
                 engine-traversal.test.ts (real data), content-validate.test.ts
```

Content access: `vite.config.ts` registers a middleware serving `/unity/logic/*` → the Unity `ENGPH_DME_10_Logic` folder and `/unity/audio/*` → the WAV folder, plus `/unity/config/KAT-BackpackConfig.json`. Tests/scripts read the same folders via `fs` through the shared `ContentSource` interface. Unity files are never copied or modified.

## Tasks (executed inline)

### Task 1: Scaffold
- [x] package.json (vite, typescript, three, vitest, @types/three), tsconfig, vite config with Unity content middleware, index.html, smoke `npm install` + `tsc --noEmit`.

### Task 2: Content layer (loader → types → validation)
- [x] types.ts mirroring parser schema above; loader assembling a `ConversationProject` from ContentSource; localization lookup; validate.ts producing `{nodeCount, eventTypeCounts, unsupported[], missingRefs[], missingAudio[], missingLocalization[], expressionErrors[]}`.
- [x] Test: loads all 60 real nodes, zero missing refs.

### Task 3: Expression engine (TDD)
- [x] Failing tests for: literals, unary !/-, && || precedence, comparisons, ?:, Min/Max/Approx, Played()/!Played() with stub data, tag aggregation, turnsago min, var_ identifiers, > 0.01 condition rule, empty ⇒ 1.
- [x] Lexer/parser (recursive descent → AST), evaluator with EvaluationData callback interface; run tests green.

### Task 4: Conversation engine (TDD)
- [x] variable.ts (clamping, gates crossing semantics per VariableGate.PassesThreshold), node.ts (visibility, lifetime), history.ts (record/undo), events.ts (factory + text substitution), logic.ts (EvaluateNode recursion, linkages, offered pass, activities), engine.ts (start/selection/getBehaviorSelection/selectPath/undo/suspend snapshot).
- [x] Tests with synthetic fixtures for each rule + integration test driving the real course: start → intro chain reaches first choice menu (a01–a03), select each branch, verify variable side effects, jump chains, coach events, completion via a5x path.

### Task 5: App shell (scene/audio/lms/input/ui + performance interfaces)
- [x] Three.js renderer (canvas, resize, lights, camera, loop), asset registry preferring GLB with FBX documented, placeholder pharmacy + Rebecca proxy reacting to shots; performance/director.ts interfaces (IPerformanceDirector: playCutscene, setShot, idle hooks, lip-sync hook) with minimal implementation; audio service playing `/unity/audio/<id>.wav` with mute/volume + caption hook; LMS adapter interface + localStorage dev stub + xAPI adapter skeleton (config-injected endpoint, no prod URLs); keyboard mapping from KAT config semantics; UI panel (speaker line with [br] stripped, tactic-grouped choices, activity slider UI, coach overlay, debug pane: node/variables/history/path, undo button).

### Task 6: Validation script + report
- [x] `npm run validate` → scripts/validate-content.ts prints the content report against the real Unity folders; exits non-zero on hard errors.

### Task 7: Docs + verification
- [x] MIGRATION_HARD_PARTS.md (semantics above + risks + FBX pipeline), NEXT_MODEL_TASKS.md (small follow-up tasks), README. Verify: `npm install`, `npx tsc --noEmit`, `npx vitest run`, `npm run validate`, `npm run dev` + browser smoke via chrome-devtools.
