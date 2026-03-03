/**
 * Represents a command in the HotKeyPad.
 * Each command has a unique identifier, title, hotkey combination, and handler function.
 */
export interface HotKeyPadCommand {
  /** Unique identifier for the command */
  id: string
  /** Display title of the command */
  title: string
  /** Optional icon (SVG string, img tag, i tag, or Simple Icons name) */
  icon?: string
  /** Hotkey combination (e.g., "Ctrl+K", "Cmd+P") */
  hotkey: string
  /** Optional section to group commands under */
  section?: string
  /** Handler function executed when command is triggered */
  handler: (instance: HTMLElement) => void
}

/**
 * Configuration options for the HotKeyPad instance.
 */
export type HotKeyPadOptionsProps = {
  /** Key to close the keypad (default: "Escape") */
  closeKey?: string
  /** Placeholder text for the search input (default: "Search command") */
  placeholder?: string
  /** Message when no commands match search (default: "No commands found") */
  emptyMessage?: string
  /** Letter combined with activation key (default: "K") */
  activationLetter?: string
}

/**
 * Internal stored event listener for proper cleanup.
 */
export interface StoredListener {
  element: HTMLElement | Document
  event: string
  callback: EventListener
}
