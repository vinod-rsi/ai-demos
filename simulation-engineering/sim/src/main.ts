import * as THREE from 'three';
import { asset } from './base';
import { FetchContentSource } from './content/source';
import { loadConversationProject } from './content/loader';
import { Conversation } from './conversation/engine';
import type { RuntimeEvent } from './conversation/events';
import { SceneRuntime } from './scene/renderer';
import { AssetRegistry } from './scene/assets';
import { Stage } from './scene/stage';
import { MinimalDirector } from './performance/director';
import { AudioService } from './audio/audio-service';
import { LocalStorageLmsAdapter } from './lms/local-adapter';
import type { SuspendData } from './lms/adapter';
import { CommandBus } from './input/commands';
import { loadKeyMapping } from './input/keymap';
import { attachKeyboard } from './input/keyboard';
import { SpeakerPanel, ChoicesPanel } from './ui/panel';
import { Captions, CoachOverlay, ActivityPanel, Toast } from './ui/overlays';
import { DebugPanel } from './ui/debug';
import { TranscriptPanel } from './ui/transcript';
import { renderEndingScreen } from './ui/ending';
import { ScoreTracker } from './ui/score';
import { AmplitudeLipSync } from './performance/lipsync-amplitude';
import { MgfxOverlay, eventMgfxScreen } from './ui/mgfx';

const COURSE_ID = 'atiengph_dme_10';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

async function boot(): Promise<void> {
  // ---- content + engine ----
  const project = await loadConversationProject(new FetchContentSource(asset('unity/logic')));
  const convo = new Conversation(project);
  const characterNames = new Map(
    project.characters.map((c) => [
      c.id.toLowerCase(),
      convo.localization.resolve(c.localization_guid, 'name', c.name),
    ]),
  );

  // ---- presentation ----
  const runtime = new SceneRuntime($('stage'));
  const assets = new AssetRegistry();
  const stage = new Stage(runtime, assets, project.shots);
  const director = new MinimalDirector(stage);
  runtime.start();
  void stage
    .upgradeToRealAssets()
    .then((r) => console.info('[stage] real assets:', JSON.stringify(r)));
  // Dev console handle (e.g. `await __port.stage.probePhonemes()`).
  (window as unknown as Record<string, unknown>)['__port'] = {
    stage,
    convo: () => convo,
    THREE,
    runtime,
  };

  const captions = new Captions($('captions'));
  const lipSync = new AmplitudeLipSync((level, shape) => stage.setSpeaking(level, shape));
  const speakerLine = $('speaker-line');
  const audio = new AudioService(asset('unity/audio'), {
    onClipStart: (clip, text, element) => {
      captions.startTimed(text, element);
      lipSync.start(clip, text, element);
      speakerLine.classList.add('speaking');
    },
    onClipEnd: () => {
      captions.hide();
      lipSync.stop();
      speakerLine.classList.remove('speaking');
    },
  });
  const speaker = new SpeakerPanel($('speaker-name'), $('line-text'));
  const coach = new CoachOverlay($('coach-overlay'), $('coach-text'), $('coach-dismiss'));
  const mgfx = new MgfxOverlay(
    $('mgfx-overlay'),
    $('mgfx-eyebrow'),
    $('mgfx-title'),
    $('mgfx-subtitle'),
    $('mgfx-body'),
    $<HTMLImageElement>('mgfx-image'),
    $('mgfx-continue'),
  );
  const startOverlay = $('start-overlay');
  const startButton = $<HTMLButtonElement>('start-button');
  const activityPanel = new ActivityPanel(
    $('activity-ui'),
    $('activity-title'),
    $<HTMLInputElement>('activity-slider'),
    $('activity-value'),
    $('activity-submit'),
  );
  const debug = new DebugPanel($('debug-content'), $('status-bar'));
  const toast = new Toast($('toast'));
  const transcript = new TranscriptPanel($('transcript'), $('transcript-content'), characterNames);
  const score = new ScoreTracker(convo);
  let thoughtsEnabled = true;

  // ---- LMS ----
  const lms = new LocalStorageLmsAdapter();
  const session = await lms.initialize(COURSE_ID);
  void lms.sendStatement({ verb: 'launched', objectId: COURSE_ID });

  let lastNodeId: string | null = null;
  let processing = false;

  const saveProgress = () => {
    const data: SuspendData = {
      version: 1,
      courseId: COURSE_ID,
      selectedPath: convo.getSelectedPathString(),
      turnNumber: convo.turnNumber,
      completed: convo.completed,
      success: convo.success,
      savedAtIso: new Date().toISOString(),
    };
    void lms.saveSuspendData(data);
  };

  const updateStatus = () => {
    debug.setStatus({
      learner: session.learnerName,
      turn: String(convo.turnNumber),
      volume: `${Math.round(audio.volume * 100)}%${audio.muted ? ' (muted)' : ''}`,
      captions: captions.enabled ? 'on' : 'off',
      undo: convo.canUndo ? 'available (U)' : '—',
    });
  };

  /** Plays one evaluated event queue: voice lines, coach feedback, activities. */
  async function playQueue(events: readonly RuntimeEvent[]): Promise<void> {
    for (const evt of events) {
      switch (evt.type) {
        case 'cutscene':
          director.beginCutscene(evt);
          break;
        case 'dialogue': {
          const screen = eventMgfxScreen(evt);
          if (screen) {
            stage.setShot(evt.shotId);
            speaker.clear();
            await mgfx.show(screen);
            break;
          }
          const name = evt.characterId ? (characterNames.get(evt.characterId) ?? '') : '';
          speaker.show(name, evt.text);
          $('line-text').classList.remove('thought-text');
          director.beginLine(evt, null);
          await audio.play(evt.audio, evt.text);
          director.endLine(evt);
          break;
        }
        case 'thought': {
          if (!thoughtsEnabled) break;
          // Inner monologue: italicized, no speaker attribution.
          speaker.show('(thinking)', evt.text);
          $('line-text').classList.add('thought-text');
          await audio.play(evt.audio, evt.text);
          $('line-text').classList.remove('thought-text');
          break;
        }
        case 'coach':
          await coach.show(evt.replacementText ?? evt.text);
          break;
        case 'shot':
        case 'defaultshot':
          stage.setShot(evt.shotId);
          break;
        case 'mgfx': {
          const screen = eventMgfxScreen(evt);
          if (screen) await mgfx.show(screen);
          break;
        }
        default:
          break; // jump/variablechange/etc. are bookkeeping, visible in debug
      }
    }
    director.idle();
  }

  /** Pending activities → minimal slider UI → finalize. */
  async function handleActivities(): Promise<void> {
    while (convo.pendingActivities) {
      for (const evt of convo.pendingActivityEvents) {
        for (const map of evt.resultMaps) {
          if (map.id.includes('slider')) {
            map.result = await activityPanel.ask({
              title: 'How many units of insulin do you administer?',
              min: map.min,
              max: map.max,
              initial: map.initialValue,
            });
            void lms.sendStatement({
              verb: 'answered',
              objectId: `${COURSE_ID}/${evt.activityId}`,
              result: { response: String(map.result) },
            });
          } else {
            // continue/confirm flags: the learner confirmed via the submit button
            map.result = map.max;
          }
        }
      }
      convo.finalizeActivities();
      await playQueue(convo.getEventQueue());
    }
  }

  async function afterTurn(): Promise<void> {
    await handleActivities();
    if (convo.completed) {
      await playQueue(convo.getOutroEventQueue());
      choices.clear();
      speaker.show('', `Conversation complete — ${score.describe()}.`);
      renderEndingScreen($('choices'), convo);
      void lms.setComplete(convo.success);
      void lms.clearSuspendData();
    } else {
      choices.render(convo.getBehaviorSelection());
    }
    saveProgress();
    debug.update(convo, lastNodeId);
    updateStatus();
  }

  const choices: ChoicesPanel = new ChoicesPanel($('choices'), (behaviorId, select) => {
    if (processing) return;
    processing = true;
    lastNodeId = behaviorId;
    choices.clear();
    void (async () => {
      select();
      score.recordSelection(behaviorId);
      void lms.sendStatement({
        verb: 'answered',
        objectId: `${COURSE_ID}/${behaviorId}`,
      });
      await playQueue(convo.getEventQueue());
      await afterTurn();
      processing = false;
    })();
  });

  // ---- panel controls ----
  $('btn-transcript').addEventListener('click', () => transcript.toggle(convo));
  $('btn-restart').addEventListener('click', () => {
    void lms.clearSuspendData().then(() => location.reload());
  });

  // ---- keyboard commands (mapping from KAT-BackpackConfig.json) ----
  const bus = new CommandBus();
  attachKeyboard(window, await loadKeyMapping(), bus);
  bus.on('up', () => choices.moveFocus(-1));
  bus.on('down', () => choices.moveFocus(1));
  bus.on('left', () => choices.moveFocus(-1));
  bus.on('right', () => choices.moveFocus(1));
  bus.on('select', () => {
    if (mgfx.visible) mgfx.dismiss();
    else if (coach.visible) coach.dismiss();
    else choices.activateFocused();
  });
  bus.on('volume-up', () => {
    audio.changeVolume(0.1);
    toast.show(`Volume ${Math.round(audio.volume * 100)}%`);
    updateStatus();
  });
  bus.on('volume-down', () => {
    audio.changeVolume(-0.1);
    toast.show(`Volume ${Math.round(audio.volume * 100)}%`);
    updateStatus();
  });
  bus.on('toggle-mute', () => {
    toast.show(audio.toggleMute() ? 'Muted' : 'Unmuted');
    updateStatus();
  });
  bus.on('toggle-captions', () => {
    toast.show(captions.toggle() ? 'Captions on' : 'Captions off');
    updateStatus();
  });
  bus.on('toggle-fullscreen', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  });
  bus.on('toggle-play', () => audio.togglePlay());
  bus.on('coach', () => {
    if (mgfx.visible) mgfx.dismiss();
    else coach.dismiss();
  });
  bus.on('thoughts', () => {
    thoughtsEnabled = !thoughtsEnabled;
    toast.show(thoughtsEnabled ? 'Thoughts on' : 'Thoughts off');
  });
  bus.on('meter', () => toast.show(score.describe(), 2600));
  // Undo on 'U' (not in the Unity mapping; dev convenience).
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyU' && convo.canUndo && !processing) {
      convo.undo();
      lastNodeId = null;
      choices.render(convo.getBehaviorSelection());
      debug.update(convo, lastNodeId);
      updateStatus();
    }
  });

  // ---- start / resume ----
  convo.start();
  const resume = session.suspendData;
  const hasResume = !!(resume && resume.selectedPath && !resume.completed);
  const introAudioReady = hasResume
    ? Promise.resolve()
    : Promise.all(
        convo
          .getIntroEventQueue()
          .filter((evt) => evt.type === 'dialogue' || evt.type === 'thought')
          .map((evt) => audio.prepare(evt.audio)),
      ).then(() => undefined);
  startButton.disabled = !hasResume;
  startButton.textContent = hasResume ? 'Begin' : 'Loading';
  void introAudioReady
    .catch((err) => console.warn('Intro audio preload failed:', err))
    .finally(() => {
      startButton.disabled = false;
      startButton.textContent = 'Begin';
    });

  const startCourse = async () => {
    processing = true;
    startOverlay.classList.add('hidden');
    await introAudioReady.catch(() => undefined);

    if (hasResume) {
      try {
        convo.selectPath(resume.selectedPath);
        speaker.show('', `Resumed saved session (turn ${convo.turnNumber}).`);
      } catch (err) {
        console.warn('Resume failed, starting fresh:', err);
        void lms.clearSuspendData();
        await playQueue(convo.getIntroEventQueue());
      }
    } else {
      await playQueue(convo.getIntroEventQueue());
    }

    await afterTurn();
    processing = false;
  };

  startButton.addEventListener(
    'click',
    () => {
      void startCourse().catch((err) => {
        console.error(err);
        speaker.show('', `Failed to start: ${err}`);
      });
    },
    { once: true },
  );
  startButton.focus();
  updateStatus();
  debug.update(convo, lastNodeId);
}

boot().catch((err) => {
  console.error(err);
  const line = document.getElementById('line-text');
  if (line) line.textContent = `Failed to start: ${err}`;
});
