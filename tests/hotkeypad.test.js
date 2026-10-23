import test, { afterEach } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import HotKeyPad from "../dist/index.js"
import { isValidHotkey, parseHotkey } from "../dist/utils.js"

const globalNames = ["window", "document", "navigator", "Node", "Element", "HTMLElement", "MutationObserver", "CustomEvent", "KeyboardEvent", "MouseEvent"]
const originalGlobals = new Map(globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]))
let activeDom
let activePads = []

afterEach(() => {
  activePads.forEach((pad) => pad.destroy())
  activePads = []
  activeDom?.window.close()
  activeDom = undefined
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
})

function setup(options = {}) {
  const dom = new JSDOM("<!doctype html><button id='before'>Before</button><div id='hotkeypad'></div><div id='alternate' data-empty-message='Nothing here'><span id='original-content'>Keep me</span></div><template id='hotkeypad-footer'><button id='custom'>Custom</button></template>", { pretendToBeVisual: true })
  activeDom = dom
  const { window } = dom
  for (const name of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "MutationObserver", "CustomEvent", "KeyboardEvent", "MouseEvent"]) {
    Object.defineProperty(globalThis, name, { configurable: true, value: name === "window" ? window : window[name] })
  }
  window.HTMLElement.prototype.scrollIntoView = function () {}
  const { mountId, ...padOptions } = options
  const pad = new HotKeyPad({ ...padOptions, ...(mountId ? { element: window.document.getElementById(mountId) } : {}) })
  activePads.push(pad)
  return { window, pad, input: () => window.document.querySelector("[data-container] input"), item: (id) => window.document.querySelector(`[data-command-id="${id}"]`) }
}

function command(id, title = id, handler = () => {}) {
  return { id, title, handler }
}

function key(window, target, value, modifiers = {}) {
  target.dispatchEvent(new window.KeyboardEvent("keydown", { key: value, code: `Key${value.toUpperCase()}`, bubbles: true, cancelable: true, ...modifiers }))
}

test("setCommands replaces handlers without duplicate execution", () => {
  const { pad, window } = setup()
  let oldCount = 0
  let newCount = 0
  pad.setCommands([{ ...command("save", "Save", () => oldCount++), hotkey: "Ctrl+S" }])
  pad.setCommands([{ ...command("save", "Save", () => newCount++), hotkey: "Ctrl+S" }])
  pad.open()
  key(window, window.document.querySelector("[data-container]"), "s", { ctrlKey: true })
  assert.equal(oldCount, 0)
  assert.equal(newCount, 1)
})

test("search navigation skips hidden items and other keys preserve selection", () => {
  const { pad, window, input, item } = setup()
  pad.setCommands([command("alpha", "Alpha"), command("beta", "Bet"), command("gamma", "Gamma")])
  pad.open()
  input().value = "a"
  input().dispatchEvent(new window.Event("input", { bubbles: true }))
  key(window, input(), "ArrowDown")
  assert.equal(pad.currentIndex, 1)
  assert.equal(item("alpha").hidden, false)
  assert.equal(item("beta").hidden, true)
  key(window, input(), "x")
  assert.equal(pad.currentIndex, 1)
  assert.equal(input().getAttribute("aria-activedescendant"), item("gamma").id)
})

test("search resets on close and reopen", () => {
  const { pad, window, input, item } = setup()
  pad.setCommands([command("alpha", "Alpha"), command("beta", "Beta")])
  pad.open()
  input().value = "beta"
  input().dispatchEvent(new window.Event("input", { bubbles: true }))
  pad.close()
  pad.open()
  assert.equal(input().value, "")
  assert.equal(item("alpha").hidden, false)
  assert.equal(pad.currentIndex, 0)
})

test("shortcut matching requires the exact modifier set", () => {
  const { pad, window } = setup()
  let count = 0
  pad.setCommands([{ ...command("multi", "Multi", () => count++), hotkey: "Alt+Shift+Ctrl+M" }])
  pad.open()
  const container = window.document.querySelector("[data-container]")
  key(window, container, "m", { ctrlKey: true, altKey: true })
  assert.equal(count, 0)
  key(window, container, "m", { ctrlKey: true, altKey: true, shiftKey: true })
  assert.equal(count, 1)
})

test("Alt-only and Shift-only shortcuts work, while shortcuts stay inactive when closed", () => {
  const { pad, window } = setup()
  let altCount = 0
  let shiftCount = 0
  pad.setCommands([
    { ...command("alt", "Alt", () => altCount++), hotkey: "Alt+A" },
    { ...command("shift", "Shift", () => shiftCount++), hotkey: "Shift+B" }
  ])
  const container = window.document.querySelector("[data-container]")
  key(window, container, "a", { altKey: true })
  key(window, container, "b", { shiftKey: true })
  assert.equal(altCount, 0)
  assert.equal(shiftCount, 0)
  pad.open()
  key(window, container, "a", { altKey: true })
  pad.open()
  key(window, container, "b", { shiftKey: true })
  assert.equal(altCount, 1)
  assert.equal(shiftCount, 1)
})

test("aliases and modifier order detect duplicate shortcuts; invalid updates are atomic", () => {
  const { pad, window, item } = setup()
  let count = 0
  pad.setCommands([{ ...command("kept", "Kept", () => count++), hotkey: "Ctrl+J" }])
  assert.throws(() => pad.setCommands([{ ...command("a"), hotkey: "Ctrl+Shift+X" }, { ...command("b"), hotkey: "shift+control+x" }]), /Duplicate hotkey/)
  assert.throws(() => pad.setCommands([command("same"), command("same")]), /Duplicate command id/)
  assert.ok(item("kept"))
  assert.equal(item("a"), null)
  pad.open()
  key(window, window.document.querySelector("[data-container]"), "j", { ctrlKey: true })
  assert.equal(count, 1)
})

test("nested SVG click activates its command by ID", () => {
  const { pad, window } = setup()
  let count = 0
  pad.setCommands([{ ...command("svg", "SVG", () => count++), icon: '<svg><path id="inner" /></svg>' }])
  pad.open()
  window.document.querySelector("#inner").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.equal(count, 1)
})

test("commands without shortcuts and an empty command list work", () => {
  const { pad, window } = setup()
  pad.setCommands([command("plain", "Plain")])
  pad.open()
  assert.equal(window.document.querySelectorAll("[data-command-id]").length, 1)
  pad.setCommands([])
  assert.equal(window.document.querySelectorAll("[data-command-id]").length, 0)
  assert.equal(window.document.querySelector("[data-empty]").hidden, false)
})

test("custom mount uses its data-empty-message", () => {
  const { pad, window } = setup({ mountId: "alternate" })
  pad.setCommands([])
  assert.equal(pad.instance.id, "alternate")
  assert.equal(window.document.querySelector("[data-empty]").textContent, "Nothing here")
})

test("changing theme preserves the search query and filtered active command", async () => {
  const { pad, window, input, item } = setup()
  pad.setCommands([command("alpha", "Alpha"), command("gamma", "Gamma"), command("beta", "Bet")])
  pad.open()
  input().value = "a"
  input().dispatchEvent(new window.Event("input", { bubbles: true }))
  key(window, input(), "ArrowDown")
  assert.equal(input().getAttribute("aria-activedescendant"), item("gamma").id)
  pad.instance.classList.add("dark")
  await Promise.resolve()
  assert.equal(input().value, "a")
  assert.equal(item("beta").hidden, true)
  assert.equal(input().getAttribute("aria-activedescendant"), item("gamma").id)
})

test("open and close are idempotent and restore focus", () => {
  const { pad, window, input } = setup()
  const before = window.document.querySelector("#before")
  before.focus()
  let opens = 0
  let closes = 0
  window.addEventListener("hotkeypad:open", () => opens++)
  window.addEventListener("hotkeypad:close", () => closes++)
  pad.open()
  pad.open()
  assert.equal(window.document.activeElement, input())
  pad.close()
  pad.close()
  assert.equal(window.document.activeElement, before)
  assert.equal(opens, 1)
  assert.equal(closes, 1)
})

test("focus trap includes custom footer and wraps in both directions", () => {
  const { pad, window } = setup()
  const proto = window.HTMLElement.prototype
  Object.defineProperty(proto, "getClientRects", { configurable: true, value() { return [{ width: 1, height: 1 }] } })
  pad.open()
  const input = window.document.querySelector("[data-container] input")
  const custom = window.document.querySelector("#custom")
  custom.focus()
  const forward = new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })
  custom.dispatchEvent(forward)
  assert.equal(forward.defaultPrevented, true)
  assert.equal(window.document.activeElement, input)
  const backward = new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })
  input.dispatchEvent(backward)
  assert.equal(window.document.activeElement, custom)
})

test("destroy removes listeners and DOM", () => {
  const { pad, window } = setup()
  let calls = 0
  pad.setCommands([command("one", "One", () => calls++)])
  pad.open()
  pad.destroy()
  assert.equal(window.document.querySelector("[data-container]"), null)
  assert.equal(window.document.querySelector("[data-backdrop]"), null)
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyK", key: "k", ctrlKey: true, bubbles: true }))
  assert.equal(pad.isDestroyed, true)
  assert.equal(calls, 0)
  assert.equal(window.document.querySelector("[data-container]"), null)
})

test("opening one instance closes another instance", () => {
  const { pad, window } = setup()
  const secondElement = window.document.createElement("div")
  window.document.body.appendChild(secondElement)
  const second = new HotKeyPad({ element: secondElement })
  activePads.push(second)
  pad.open()
  assert.equal(pad.instance.style.visibility, "visible")
  second.open()
  assert.equal(pad.instance.style.visibility, "hidden")
  assert.equal(second.instance.style.visibility, "visible")
  key(window, window.document, "k", { ctrlKey: true })
  assert.equal(pad.instance.style.visibility, "hidden")
  assert.equal(second.instance.style.visibility, "hidden")
  second.destroy()
})

test("destroy restores the mount element content", () => {
  const { pad, window } = setup({ mountId: "alternate" })
  pad.destroy()
  assert.equal(window.document.querySelector("#original-content")?.textContent, "Keep me")
  assert.equal(pad.instance.querySelector("[data-container]"), null)
  assert.equal(pad.instance.style.visibility, "")
  assert.equal(pad.instance.style.opacity, "")
  assert.equal(pad.instance.style.pointerEvents, "")
  assert.equal(pad.instance.hasAttribute("data-hotkeypad"), false)
  assert.equal(pad.instance.hasAttribute("aria-expanded"), false)
})

test("hotkey parser accepts aliases and rejects malformed, duplicate, and reserved shortcuts", () => {
  assert.equal(parseHotkey("shift + ctrl + x"), "Control+Shift+X")
  assert.equal(isValidHotkey("Meta+Alt+Shift+P"), true)
  for (const value of ["", "X", "Ctrl+", "Ctrl+F1", "Ctrl+Ctrl+X", "Cmd+Meta+X", "Ctrl+N", "Meta+Shift+T", "Ctrl+Q+X"]) {
    assert.equal(isValidHotkey(value), false, value)
  }
})
