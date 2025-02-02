export interface HotKeyPadCommand {
  id: string
  title: string
  icon?: string
  hotkey: string
  section?: string
  handler: (instance: HTMLElement) => void
}

export type HotKeyPadOptionsProps = {
  closeKey?: string
  placeholder?: string
  emptyMessage?: string
  activationLetter?: string
}
