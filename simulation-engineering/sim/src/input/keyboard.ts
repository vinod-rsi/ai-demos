import type { CommandBus } from './commands';
import type { KeyMapping } from './keymap';

/** Routes keydown events through the key mapping onto the command bus. */
export function attachKeyboard(
  target: Window,
  mapping: KeyMapping,
  bus: CommandBus,
): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    // Don't steal keys from form fields (the activity slider handles its own).
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    const command = mapping.get(e.code);
    if (command) {
      e.preventDefault();
      bus.dispatch(command);
    }
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
