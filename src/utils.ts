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
 */
export function createListener<T>(
  element: HTMLElement | Document | Window,
  event: keyof HTMLElementEventMap,
  callback: (event: T) => void
) {
  element.addEventListener(event, callback as EventListener)
}

/**
 * Extract the valid letter from the hotkey
 * @param hotkey The hotkey to extract the letter from
 * @returns The activation letter in uppercase
 * @example
 * extractHotkey("Control + D") // "D"
 * extractHotkey("control + shift + l") // "L"
 */
export function extractHotkeyLetter(hotkey: string) {
  const key = hotkey.match(/\w+$/)?.[0]! ?? ""
  return key === "" || key.length > 1 ? "" : key.toUpperCase()
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
