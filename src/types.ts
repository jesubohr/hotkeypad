export interface HotKeyPadCommand {
  id: string
  title: string
  icon?: string
  hotkey: string
  section?: string
  handler: () => void
}

export type HotKeyPadOptionsProps = {
  closeKey?: string
  placeholder?: string
  activationLetter?: string
}
