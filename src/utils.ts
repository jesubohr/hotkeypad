/**
 * Create a new element with the given tag and props
 * @param tag The tag of the element
 * @param props The props of the element
 * @returns The created element
 */
export function createElement(tag: string, props?: { [key: string]: string }) {
  const element = document.createElement(tag)
  if (props)
    Object.keys(props).forEach((key) => {
      element.setAttribute(key, props[key])
    })
  return element
}

type MutationObserverCallback = (event: MutationRecord[]) => void
export const Observer = (callback: MutationObserverCallback) =>
  new MutationObserver(callback.bind(this))
