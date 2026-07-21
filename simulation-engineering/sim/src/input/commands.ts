/**
 * Abstract input commands, matching the command vocabulary of the Unity
 * build's KeyMapping in KAT-BackpackConfig.json.
 */
export const COMMANDS = [
  'up',
  'down',
  'left',
  'right',
  'select',
  'volume-up',
  'volume-down',
  'toggle-mute',
  'toggle-captions',
  'toggle-fullscreen',
  'toggle-play',
  'coach',
  'thoughts',
  'meter',
] as const;

export type Command = (typeof COMMANDS)[number];

export type CommandHandler = (command: Command) => void;

export class CommandBus {
  private handlers = new Map<Command, Set<CommandHandler>>();
  private anyHandlers = new Set<CommandHandler>();

  on(command: Command, handler: CommandHandler): () => void {
    let set = this.handlers.get(command);
    if (!set) {
      set = new Set();
      this.handlers.set(command, set);
    }
    set.add(handler);
    return () => set.delete(handler);
  }

  onAny(handler: CommandHandler): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  dispatch(command: Command): void {
    this.handlers.get(command)?.forEach((h) => h(command));
    this.anyHandlers.forEach((h) => h(command));
  }
}
