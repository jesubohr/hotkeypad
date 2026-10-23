/**
 * Create a new element with the given tag and props
 * @param tag The tag of the element
 * @param props The props of the element
 * @returns The created element
 */
export function createElement(
  tag: string,
  props?: { [key: string]: string } | string
) {
  const element = document.createElement(tag)
  if (props && typeof props === "string" && props !== "")
    element.textContent = props
  if (props && typeof props === "object")
    Object.keys(props).forEach((key) => {
      element.setAttribute(key, props[key])
    })
  return element
}

/**
 * Create a new listener for the given element and event
 * @param element The element to listen to
 * @param event The event to listen for
 * @param callback The callback to execute
 * @returns The stored listener object for cleanup
 */
export function createListener<E extends HTMLElement | Document | Window>(
  element: E,
  event: string,
  callback: EventListener
): { element: E; event: string; callback: EventListener } {
  element.addEventListener(event, callback)
  return { element, event, callback }
}

/**
 * Extract the valid letter from the hotkey
 * @param hotkey The hotkey to extract the letter from
 * @returns The activation letter in uppercase, or null if invalid
 * @example
 * extractHotkeyLetter("Control + D") // "D"
 * extractHotkeyLetter("control + shift + l") // "L"
 * extractHotkeyLetter("") // null
 */
export function extractHotkeyLetter(hotkey: string): string | null {
  return parseHotkey(hotkey)?.split("+").pop() ?? null
}

const MODIFIERS = ["Control", "Meta", "Alt", "Shift"]

/** Normalize a shortcut for validation, conflict checks, and event matching. */
export function parseHotkey(hotkey: string): string | null {
  const keys = hotkey.split("+").map((key) => key.trim().toLowerCase())
  const letter = keys.pop()
  if (!letter || !/^[a-z]$/.test(letter) || keys.length === 0) return null

  const modifiers: string[] = keys.map((key) => {
    if (key === "ctrl" || key === "control") return "Control"
    if (key === "cmd" || key === "meta") return "Meta"
    if (key === "alt") return "Alt"
    if (key === "shift") return "Shift"
    return ""
  })
  if (modifiers.includes("") || new Set(modifiers).size !== modifiers.length) return null

  const normalized = MODIFIERS.filter((key) => modifiers.includes(key))
  if (
    /^[tnw]$/.test(letter) &&
    (normalized.join("+") === "Control" || normalized.join("+") === "Control+Shift" ||
      normalized.join("+") === "Meta" || normalized.join("+") === "Meta+Shift")
  ) return null

  return [...normalized, letter.toUpperCase()].join("+")
}

export function eventHotkey(event: KeyboardEvent): string | null {
  if (!/^Key[A-Z]$/.test(event.code)) return null
  const modifiers = [event.ctrlKey, event.metaKey, event.altKey, event.shiftKey]
  return [...MODIFIERS.filter((_, index) => modifiers[index]), event.code.slice(3)].join("+")
}
/**
 * Validate the given hotkey
 * @param hotkey The hotkey to verify
 * @returns Whether the hotkey is valid or not
 */
export function isValidHotkey(hotkey: string) {
  return parseHotkey(hotkey) !== null
}
