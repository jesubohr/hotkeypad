/**
 * Create a new element with the given tag and props
 * @param tag The tag of the element
 * @param props The props of the element
 * @returns The created element
 */
export function createElement(tag: string, props?: { [key: string]: string } | string) {
  const element = document.createElement(tag)
  if(props && typeof props === "string" && props !== "") element.textContent = props
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

type MutationObserverCallback = (event: MutationRecord[]) => void
export const Observer = (callback: MutationObserverCallback) =>
  new MutationObserver(callback.bind(this))
