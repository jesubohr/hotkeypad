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
  const match = hotkey.match(/\w+$/)
  if (!match) return null
  const key = match[0]
  if (key.length !== 1) return null
  return key.toUpperCase()
}

const VALID_META_KEYS = ["Control", "Shift", "Alt", "Meta"]
const NOT_ALLOWED_HOTKEYS = [
  "Control+T",
  "Control+Shift+T",
  "Control+W",
  "Control+Shift+W",
  "Control+N",
  "Control+Shift+N",
  "Control+Tab",
  "Control+Shift+Tab",
  "Meta+T",
  "Meta+Shift+T",
  "Meta+W",
  "Meta+Shift+W",
  "Meta+N",
  "Meta+Shift+N",
  "Meta+Tab",
  "Meta+Shift+Tab"
]
/**
 * Validate the given hotkey
 * @param hotkey The hotkey to verify
 * @returns Whether the hotkey is valid or not
 */
export function isValidHotkey(hotkey: string) {
  const keys = hotkey.match(/\w+/g) ?? []
  if (keys.length === 0) return false

  const hotkeyString = keys
    .map((key) => {
      if (key.toUpperCase() === "CTRL") return "Control"
      if (key.toUpperCase() === "CMD") return "Meta"
      return key[0].toUpperCase() + key.slice(1).toLowerCase()
    })
    .join("+")
  return (
    !NOT_ALLOWED_HOTKEYS.includes(hotkeyString) &&
    hotkeyString
      .split("+")
      .slice(0, -1)
      .every((key) => VALID_META_KEYS.includes(key))
  )
}
