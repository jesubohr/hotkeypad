import type { HotKeyPadCommand, HotKeyPadOptionsProps, StoredListener } from "./types.js"
import { createElement, createListener, eventHotkey, parseHotkey } from "./utils.js"

export type { HotKeyPadCommand, HotKeyPadOptionsProps } from "./types.js"

let nextInstanceId = 0
let openInstance: HotKeyPad | null = null

/**
 * HotKeyPad - A lightweight keyboard shortcuts interface for web applications.
 * 
 * Provides a command palette-style interface for executing keyboard shortcuts.
 * Built with vanilla JS, no external dependencies.
 * 
 * @example
 * ```javascript
 * const hotkeypad = new HotKeyPad()
 * hotkeypad.setCommands([
 *   {
 *     id: "print",
 *     title: "Print Page",
 *     hotkey: "Ctrl+P",
 *     handler: () => window.print()
 *   }
 * ])
 * ```
 */
export default class HotKeyPad {
  instance: HTMLElement
  #backdrop: HTMLElement | null = null
  #container: HTMLElement | null = null
  #commands: HotKeyPadCommand[] = []
  #shortcuts = new Map<string, HotKeyPadCommand>()
  #listeners: StoredListener[] = []
  #previousFocus: HTMLElement | null = null
  #originalStyles: Map<string, string>
  #originalAttributes: Map<string, string | null>
  #listId = `hotkeypad-list-${++nextInstanceId}`
  currentIndex = 0

  #closeKey = "Escape"
  #activationKey: string
  #activationLetter = "K"
  #placeholder = "Search command"
  #emptyMessage = "No commands found"
  #svgIconColor = "black"
  #observer = new MutationObserver(this.#observeClassChanges.bind(this))
  #isDestroyed = false

  /**
   * Create a new HotKeyPad instance.
   * @param options Configuration options for the HotKeyPad
   * @throws Error if #hotkeypad element is not found in the DOM
   */
  constructor({ element: mount, closeKey, placeholder, emptyMessage, activationLetter }: HotKeyPadOptionsProps = {}) {
    const element = mount ?? document.getElementById("hotkeypad")
    if (element == null) {
      throw new Error("HotKeyPad instance not found in the DOM")
    }
    this.instance = element
    this.#originalStyles = new Map(["visibility", "opacity", "pointer-events"].map((name) => [name, element.style.getPropertyValue(name)]))
    this.#originalAttributes = new Map(["aria-expanded", "data-hotkeypad"].map((name) => [name, element.getAttribute(name)]))
    this.#activationKey = navigator.userAgent.includes("Macintosh") ? "Cmd" : "Ctrl"

    if (closeKey && closeKey !== "") this.#closeKey = closeKey
    if (placeholder && placeholder !== "") this.#placeholder = placeholder
    if (emptyMessage && emptyMessage !== "") this.#emptyMessage = emptyMessage
    if (activationLetter && activationLetter !== "") this.#activationLetter = activationLetter

    this.#checkTagOptions()
    if (!/^[a-z]$/i.test(this.#activationLetter)) throw new Error("The activation letter must be a letter from A to Z")
    this.instance.setAttribute("data-hotkeypad", "")
    this.#svgIconColor = this.instance.classList.contains("dark") ? "white" : "black"
    this.#init()
    return this
  }

  /* CONFIGURATION METHODS */
  #init() {
    const documentListener = createListener(document, "keydown", (event: Event) => {
      const keyEvent = event as KeyboardEvent
      if (keyEvent.defaultPrevented || keyEvent.isComposing || keyEvent.repeat) return
      const keyCode = `Key${this.#activationLetter.toUpperCase()}`
      if (keyEvent.code === keyCode && (keyEvent.metaKey !== keyEvent.ctrlKey) && !keyEvent.altKey && !keyEvent.shiftKey) {
        keyEvent.preventDefault()
        const active = openInstance
        if (active && active.#activationLetter.toUpperCase() === this.#activationLetter.toUpperCase()) active.close()
        else this.open()
      }
      if (this.#isOpen && keyEvent.key.toLowerCase() === this.#closeKey.toLowerCase()) {
        keyEvent.preventDefault()
        this.close()
      }
    })
    this.#listeners.push(documentListener)

    this.#observer.observe(this.instance, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      characterData: false
    })

    this.#createBackdrop()
    this.#createContainer()
    this.#createHeader()
    this.#createFooter()
    this.#renderCommands()
    this.#setListeners()
    this.instance.style.visibility = "hidden"
    this.instance.style.opacity = "0"
    this.instance.style.pointerEvents = "none"
    this.#container?.setAttribute("hidden", "")

    const focusListener = createListener(document, "focusin", (event: Event) => {
      if (this.#isOpen && event.target instanceof Node && !this.#container?.contains(event.target)) {
        this.#container?.querySelector("input")?.focus()
      }
    })
    this.#listeners.push(focusListener)
  }

  #checkTagOptions() {
    const emptyMessage = this.instance.getAttribute("data-empty-message")
    if (emptyMessage) this.#emptyMessage = emptyMessage
    if (this.instance.hasAttribute("data-placeholder") && this.instance.getAttribute("data-placeholder") !== "") {
      const attr = this.instance.getAttribute("data-placeholder")
      if (attr) this.#placeholder = attr
    }

    if (
      this.instance.hasAttribute("data-activation-letter") &&
      this.instance.getAttribute("data-activation-letter") !== ""
    ) {
      const attr = this.instance.getAttribute("data-activation-letter")
      if (attr) this.#activationLetter = attr.toUpperCase()
    }

    if (this.instance.hasAttribute("data-close-key") && this.instance.getAttribute("data-close-key") !== "") {
      const attr = this.instance.getAttribute("data-close-key")
      if (attr) this.#closeKey = attr.toUpperCase()
    }
  }

  #observeClassChanges(event: MutationRecord[]) {
    if (event.length === 0) return
    const { attributeName, target } = event[0]
    if (attributeName === "class") {
      if ((target as Element).classList.contains("dark")) this.#svgIconColor = "white"
      else this.#svgIconColor = "black"
      this.#renderCommands()
    }
  }

  #setListeners() {
    if (!this.#container) return

    const keydownListener = createListener(this.#container, "keydown", (event: Event) => {
      const keyEvent = event as KeyboardEvent
      if (!this.#isOpen || keyEvent.defaultPrevented || keyEvent.isComposing) return
      if (keyEvent.key === "Tab") {
        this.#trapFocus(keyEvent)
        return
      }
      if (keyEvent.repeat && keyEvent.key !== "ArrowUp" && keyEvent.key !== "ArrowDown") return

      const shortcut = eventHotkey(keyEvent)
      const command = shortcut ? this.#shortcuts.get(shortcut) : undefined
      if (command) {
        keyEvent.preventDefault()
        this.#executeCommand(command)
        return
      }
      if (keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.shiftKey) return
      if (!["Enter", "ArrowUp", "ArrowDown"].includes(keyEvent.key)) return
      if (keyEvent.target !== this.#container?.querySelector("input")) return
      keyEvent.preventDefault()

      const items = this.#visibleItems
      if (keyEvent.key === "Enter") {
        const item = items[this.currentIndex]
        if (item) this.#activateItem(item)
        return
      }
      if (items.length === 0) return
      const step = keyEvent.key === "ArrowUp" ? -1 : 1
      this.#selectItem(items[(this.currentIndex + step + items.length) % items.length])
      items[this.currentIndex]?.scrollIntoView({ block: "nearest" })
    })
    this.#listeners.push(keydownListener)

    const clickListener = createListener(this.#container, "click", (event: Event) => {
      const item = this.#eventItem(event)
      if (this.#isOpen && item) this.#activateItem(item)
    })
    this.#listeners.push(clickListener)

    const mouseoverListener = createListener(this.#container, "mouseover", (event: Event) => {
      const item = this.#eventItem(event)
      if (this.#isOpen && item && !item.hidden) this.#selectItem(item)
    })
    this.#listeners.push(mouseoverListener)

    const inputListener = createListener(this.#container, "input", (event: Event) => {
      if (event.target === this.#container?.querySelector("input")) this.#filterCommands()
    })
    this.#listeners.push(inputListener)
  }

  /* HELPER METHODS */
  #eventItem(event: Event) {
    if (!(event.target instanceof Element)) return null
    const item = event.target.closest<HTMLElement>("[data-command-id]")
    return item && this.#container?.contains(item) ? item : null
  }

  #trapFocus(event: KeyboardEvent) {
    if (!this.#container) return
    const elements = Array.from(this.#container.querySelectorAll<HTMLElement>(
      'input, button, a[href], select, textarea, [tabindex]'
    )).filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") &&
      !element.closest("[hidden], [inert]") && element.getClientRects().length > 0)
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (!first || !last) {
      event.preventDefault()
      this.#container.focus()
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === this.#container)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === this.#container)) {
      event.preventDefault()
      first.focus()
    }
  }

  #selectItem(item?: HTMLElement) {
    this.#items.forEach((element) => {
      element.removeAttribute("data-active")
      element.setAttribute("aria-selected", "false")
    })
    const input = this.#container?.querySelector("input")
    input?.removeAttribute("aria-activedescendant")
    this.currentIndex = item ? this.#visibleItems.indexOf(item) : 0
    if (item) {
      item.setAttribute("data-active", "")
      item.setAttribute("aria-selected", "true")
      input?.setAttribute("aria-activedescendant", item.id)
    }
  }

  #filterCommands() {
    const value = this.#container?.querySelector("input")?.value.toLowerCase() ?? ""
    this.#items.forEach((item) => {
      const title = item.querySelector("p")?.textContent?.toLowerCase() ?? ""
      item.hidden = !title.includes(value)
    })
    this.#container?.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => {
      section.hidden = !section.querySelector("[data-command-id]:not([hidden])")
    })
    const emptySection = this.#container?.querySelector<HTMLElement>("[data-empty]")
    if (emptySection) emptySection.hidden = this.#visibleItems.length > 0
    this.#selectItem(this.#visibleItems[0])
  }

  #executeCommand(command: HotKeyPadCommand) {
    this.close()
    command.handler(this.instance)
  }

  #activateItem(item: HTMLElement) {
    if (item.hidden) return
    const command = this.#commands.find(({ id }) => id === item.getAttribute("data-command-id"))
    if (command) this.#executeCommand(command)
  }

  #verifyCommands(commands: HotKeyPadCommand[]) {
    if (!Array.isArray(commands)) throw new Error("The commands must be an array")
    const ids = new Set<string>()
    const shortcuts = new Map<string, HotKeyPadCommand>()
    const verified = commands.map((command) => {
      if (!command || typeof command.id !== "string" || command.id.trim() === "" ||
        typeof command.title !== "string" || command.title.trim() === "" || typeof command.handler !== "function") {
        throw new Error("The command must contain an id, title, and handler function")
      }
      if (ids.has(command.id)) throw new Error(`Duplicate command id: ${command.id}`)
      ids.add(command.id)
      if (command.icon != null && typeof command.icon !== "string") throw new Error("The icon should be a string")
      const copy = { ...command }
      if (command.hotkey !== undefined) {
        const shortcut = typeof command.hotkey === "string" ? parseHotkey(command.hotkey) : null
        if (!shortcut) throw new Error(`Invalid hotkey: ${command.hotkey}`)
        if (shortcuts.has(shortcut)) throw new Error(`Duplicate hotkey: ${command.hotkey}`)
        const letter = this.#activationLetter.toUpperCase()
        if (shortcut === `Control+${letter}` || shortcut === `Meta+${letter}`) {
          throw new Error("The command hotkey conflicts with the palette activation shortcut")
        }
        shortcuts.set(shortcut, copy)
      }
      return copy
    })
    this.#shortcuts = shortcuts
    return verified
  }

  #hasCustomFooter(footerEl: HTMLElement) {
    const template = document.querySelector("#hotkeypad-footer") as HTMLTemplateElement | null

    if (template == null) return false
    const clone = template.content.cloneNode(true) as DocumentFragment
    const children = Array.from(clone.children)
    children.forEach((child) => footerEl.appendChild(child))
    return true
  }

  /* PUBLIC METHODS */
  /**
   * Open the HotKeyPad dialog.
   * Dispatches 'hotkeypad:open' custom event.
   */
  open() {
    if (this.#isDestroyed || this.#isOpen) return
    openInstance?.close()
    openInstance = this
    this.#previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    this.instance.setAttribute("aria-expanded", "true")
    this.#container?.removeAttribute("hidden")
    this.instance.style.opacity = "1"
    this.instance.style.visibility = "visible"
    this.instance.style.pointerEvents = "auto"
    const input = this.#container?.querySelector("input")
    input?.setAttribute("aria-expanded", "true")
    input?.focus()
    window.dispatchEvent(new CustomEvent("hotkeypad:open"))
  }

  /**
   * Close the HotKeyPad dialog.
   * Dispatches 'hotkeypad:close' custom event.
   */
  close() {
    if (this.#isDestroyed || !this.#isOpen) return
    if (openInstance === this) openInstance = null
    this.instance.setAttribute("aria-expanded", "false")

    this.instance.style.opacity = "0"
    this.instance.style.visibility = "hidden"
    this.instance.style.pointerEvents = "none"
    const input = this.#container?.querySelector("input")
    if (input) {
      input.value = ""
      input.setAttribute("aria-expanded", "false")
    }
    this.#filterCommands()
    this.#container?.setAttribute("hidden", "")
    const previousFocus = this.#previousFocus
    this.#previousFocus = null
    if (previousFocus?.isConnected) previousFocus.focus()
    window.dispatchEvent(new CustomEvent("hotkeypad:close"))
  }

  /**
   * Set the commands to be displayed in the HotKeyPad.
   * @param commands Array of HotKeyPadCommand objects
   * @throws Error if commands contain invalid entries or duplicate ids or hotkeys
   */
  setCommands(commands: HotKeyPadCommand[]) {
    if (this.#isDestroyed) return
    this.#commands = this.#verifyCommands(commands)
    this.#renderCommands()
  }

  /**
   * Destroy the HotKeyPad instance and clean up all resources.
   * Removes event listeners, disconnects observers, and clears DOM references.
   * After calling destroy(), the instance should not be used.
   */
  destroy() {
    if (this.#isDestroyed) return
    this.close()
    this.#isDestroyed = true

    this.#observer.disconnect()

    this.#listeners.forEach(({ element, event, callback }) => {
      element.removeEventListener(event, callback)
    })
    this.#listeners = []

    if (this.#backdrop) {
      this.#backdrop.remove()
      this.#backdrop = null
    }
    if (this.#container) {
      this.#container.remove()
      this.#container = null
    }

    this.#commands = []
    this.#shortcuts.clear()
    this.#previousFocus = null
    this.#originalStyles.forEach((value, name) => {
      if (value) this.instance.style.setProperty(name, value)
      else this.instance.style.removeProperty(name)
    })
    this.#originalAttributes.forEach((value, name) => {
      if (value === null) this.instance.removeAttribute(name)
      else this.instance.setAttribute(name, value)
    })
  }

  /* GETTERS */
  get #isOpen() {
    return this.instance.style.visibility === "visible"
  }

  /**
   * Get the current activation key (Ctrl for Windows/Linux, Cmd for Mac).
   */
  get activationKey() {
    return this.#activationKey
  }

  /**
   * Check if the HotKeyPad instance has been destroyed.
   */
  get isDestroyed() {
    return this.#isDestroyed
  }

  get #sections() {
    const map = new Map<string, Omit<HotKeyPadCommand, 'section'>[]>()
    this.#commands.forEach((item) => {
      const key = typeof item.section !== "string" || item.section === "" ? "Unlisted" : item.section
      const { section, ...content } = item
      const collection = map.get(key)
      if (!collection) map.set(key, [content])
      else collection.push(content)
    })
    return Array.from(map) as Array<[string, Omit<HotKeyPadCommand, 'section'>[]]>
  }

  get #items() {
    return Array.from(this.#container?.querySelectorAll<HTMLElement>("[data-command-id]") ?? [])
  }

  get #visibleItems() {
    return this.#items.filter((item) => !item.hidden)
  }

  get emptyMessage() {
    const message = createElement("div", this.#emptyMessage)
    message.setAttribute("data-empty", "")
    message.setAttribute("role", "status")
    message.setAttribute("aria-live", "polite")
    return message
  }

  /* ICON METHODS */
  #iconURL(icon: string) {
    return `https://cdn.simpleicons.org/${icon}/${this.#svgIconColor}`
  }

  #isCustomIcon(icon: string) {
    return /<svg/.test(icon) || /<img/.test(icon) || /<i/.test(icon) || icon === ""
  }

  #createIconElement(icon: string, title: string): HTMLElement {
    const itemIcon = createElement("span")
    if (this.#isCustomIcon(icon)) {
      if (icon !== "") {
        itemIcon.innerHTML = icon
      }
    } else {
      const img = document.createElement("img")
      img.src = this.#iconURL(icon)
      img.alt = title
      img.onerror = () => {
        img.remove()
        itemIcon.textContent = title.charAt(0).toUpperCase()
      }
      itemIcon.appendChild(img)
    }
    return itemIcon
  }

  /* RENDERING METHODS */
  #createBackdrop() {
    this.#backdrop = createElement("div", {
      "data-backdrop": "",
      "aria-hidden": "true"
    })
    const backdropListener = createListener(this.#backdrop, "click", () => this.close())
    this.#listeners.push(backdropListener)
    this.instance.appendChild(this.#backdrop)
  }

  #createContainer() {
    this.#container = createElement("div", {
      "data-container": "",
      "role": "dialog",
      "aria-modal": "true",
      "aria-label": "Command palette",
      "tabindex": "-1"
    })
    this.instance.setAttribute("aria-expanded", "false")
    this.instance.appendChild(this.#container)
  }

  #createHeader() {
    if (!this.#container) return
    const headerEl = createElement("header")
    const inputEl = createElement("input", {
      type: "text",
      name: this.#placeholder.toLocaleLowerCase(),
      placeholder: this.#placeholder,
      "aria-label": this.#placeholder,
      "role": "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": "false",
      "aria-controls": this.#listId,
      autocomplete: "off",
      spellcheck: "false"
    })

    headerEl.appendChild(inputEl)
    this.#container.appendChild(headerEl)
  }

  #createFooter() {
    if (!this.#container) return
    const footerEl = createElement("footer")
    if (!this.#hasCustomFooter(footerEl)) {
      const keyEnter = createElement("kbd", "↩")
      const keyUp = createElement("kbd", "↑")
      const keyDown = createElement("kbd", "↓")
      const keyEsc = createElement("kbd", this.#closeKey)
      const keyCmdK = createElement("kbd", `${this.#activationKey} + ${this.#activationLetter}`)

      const pEnter = createElement("p", " to select")
      const pUpDown = createElement("p", " to navigate")
      const pCmdK = createElement("p", " to close")

      pEnter.prepend(keyEnter)
      pUpDown.prepend(keyUp, keyDown)
      pCmdK.prepend(keyCmdK, keyEsc)

      footerEl.append(pEnter, pUpDown, pCmdK)
    }
    this.#container.appendChild(footerEl)
  }

  #createSections() {
    if (!this.#container) return
    const sectionsEl = createElement("div")
    sectionsEl.setAttribute("data-sections", "")
    sectionsEl.id = this.#listId
    sectionsEl.setAttribute("role", "listbox")
    sectionsEl.setAttribute("aria-label", "Commands")

    this.#sections.forEach(([section, commands], sectionIndex) => {
      const sectionEl = createElement("div")
      sectionEl.setAttribute("data-section", section.toLowerCase())
      sectionEl.setAttribute("role", "group")
      sectionEl.setAttribute("aria-label", section)

      if (section !== "Unlisted") {
        const titleEl = createElement("h4", section)
        titleEl.id = `${this.#listId}-section-${sectionIndex}`
        sectionEl.setAttribute("aria-labelledby", titleEl.id)
        sectionEl.appendChild(titleEl)
      }
      const listEl = createElement("ul")
      listEl.setAttribute("role", "presentation")

      commands.forEach(({ id, title, icon, hotkey }, itemIndex) => {
        const keys = hotkey?.split("+").map((key) => key.trim()) ?? []
        const iconValue = icon ?? ""
        
        const itemEl = createElement("li")
        itemEl.setAttribute("data-hotkey", hotkey ?? "")
        itemEl.setAttribute("data-command-id", id)
        itemEl.id = `${this.#listId}-item-${sectionIndex}-${itemIndex}`
        itemEl.setAttribute("role", "option")
        itemEl.setAttribute("aria-selected", "false")
        itemEl.setAttribute("aria-label", hotkey ? `${title}, shortcut: ${hotkey}` : title)

        const iconEl = this.#createIconElement(iconValue, title)
        if (iconEl.hasChildNodes() || iconEl.textContent) {
          itemEl.appendChild(iconEl)
        }

        const itemTitle = createElement("p")
        itemTitle.append(title)

        const itemKeys = createElement("div")
        keys.forEach((key) => {
          const keyEl = createElement("span", key)
          itemKeys.appendChild(keyEl)
        })

        itemEl.appendChild(itemTitle)
        if (keys.length > 0) itemEl.appendChild(itemKeys)
        listEl.appendChild(itemEl)
      })

      sectionEl.appendChild(listEl)
      sectionsEl.appendChild(sectionEl)
    })
    this.#container.insertBefore(sectionsEl, this.#container.lastChild)
    this.#container.insertBefore(this.emptyMessage, this.#container.lastChild)
  }

  #renderCommands() {
    if (!this.#container) return
    const activeId = this.#items.find((item) => item.hasAttribute("data-active"))?.getAttribute("data-command-id")
    const sectionsEl = this.#container.querySelector("[data-sections]")
    if (sectionsEl) sectionsEl.remove()
    this.#container.querySelector("[data-empty]")?.remove()
    this.#createSections()
    this.#filterCommands()
    const activeItem = this.#visibleItems.find((item) => item.getAttribute("data-command-id") === activeId)
    if (activeItem) this.#selectItem(activeItem)
  }
}
