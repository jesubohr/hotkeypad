import HotKeyPad, { type HotKeyPadCommand, type HotKeyPadOptionsProps } from "hotkeypad"

const options: HotKeyPadOptionsProps = { element: document.createElement("div") }
const commands: HotKeyPadCommand[] = [{ id: "print", title: "Print", handler: () => window.print() }]
const pad = new HotKeyPad(options)
pad.setCommands(commands)
const destroyed: boolean = pad.isDestroyed
pad.destroy()
void destroyed
