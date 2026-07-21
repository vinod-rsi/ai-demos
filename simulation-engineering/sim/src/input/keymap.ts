import type { Command } from './commands';
import { asset } from '../base';

/**
 * Key mapping loaded from the Unity course config
 * (Assets/StreamingAssets/KAT-BackpackConfig.json →
 *  sim-menu.courses.<id>.course.KeyMapping[0]), with Unity KeyCode names
 * translated to KeyboardEvent.code values.
 */
export type KeyMapping = Map<string, Command>;

/** Unity KeyCode name → KeyboardEvent.code (only the codes the config uses). */
const UNITY_KEYCODE_TO_DOM_CODE: Record<string, string[]> = {
  UpArrow: ['ArrowUp'],
  DownArrow: ['ArrowDown'],
  LeftArrow: ['ArrowLeft'],
  RightArrow: ['ArrowRight'],
  Space: ['Space'],
  Return: ['Enter'],
  KeypadEnter: ['NumpadEnter'],
  Minus: ['Minus'],
  KeypadMinus: ['NumpadSubtract'],
  Underscore: [], // shift+Minus — covered by Minus's code
  Plus: [], // shift+Equals — covered by Equals's code
  Equals: ['Equal'],
  KeypadPlus: ['NumpadAdd'],
  A: ['KeyA'],
  B: ['KeyB'],
  C: ['KeyC'],
  F: ['KeyF'],
  P: ['KeyP'],
  T: ['KeyT'],
  V: ['KeyV'],
};

/** Fallback copied from the course KeyMapping in KAT-BackpackConfig.json. */
export const DEFAULT_UNITY_KEY_MAPPING: Record<string, Command> = {
  UpArrow: 'up',
  DownArrow: 'down',
  LeftArrow: 'left',
  RightArrow: 'right',
  Space: 'select',
  Return: 'select',
  KeypadEnter: 'select',
  Minus: 'volume-down',
  KeypadMinus: 'volume-down',
  Underscore: 'volume-down',
  Plus: 'volume-up',
  Equals: 'volume-up',
  KeypadPlus: 'volume-up',
  V: 'toggle-mute',
  C: 'toggle-captions',
  F: 'toggle-fullscreen',
  P: 'toggle-play',
  A: 'coach',
  T: 'thoughts',
  B: 'meter',
};

export function buildKeyMapping(unityMapping: Record<string, string>): KeyMapping {
  const mapping: KeyMapping = new Map();
  for (const [unityKey, command] of Object.entries(unityMapping)) {
    for (const code of UNITY_KEYCODE_TO_DOM_CODE[unityKey] ?? []) {
      mapping.set(code, command as Command);
    }
  }
  return mapping;
}

/** Reads the live Unity config; falls back to the embedded copy. */
export async function loadKeyMapping(
  configUrl = asset('unity/config/KAT-BackpackConfig.json'),
  courseId = 'atiengph_dme_10',
): Promise<KeyMapping> {
  try {
    const res = await fetch(configUrl);
    if (res.ok) {
      const config = (await res.json()) as {
        'sim-menu'?: {
          courses?: Record<string, { course?: { KeyMapping?: Record<string, string>[] } }>;
        };
      };
      const mapping = config['sim-menu']?.courses?.[courseId]?.course?.KeyMapping?.[0];
      if (mapping) return buildKeyMapping(mapping);
    }
  } catch {
    // fall through to default
  }
  return buildKeyMapping(DEFAULT_UNITY_KEY_MAPPING);
}
