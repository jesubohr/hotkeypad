import type { HotKeyPadCommand, HotKeyPadOptionsProps, StoredListener } from "./types"
import { createElement, createListener, extractHotkeyLetter, isValidHotkey } from "./utils"

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
  #listeners: StoredListener[] = []
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
  constructor({ closeKey, placeholder, emptyMessage, activationLetter }: HotKeyPadOptionsProps = {}) {
    const element = document.getElementById("hotkeypad")
    if (element == null) {
      throw new Error("HotKeyPad instance not found in the DOM")
    }
    this.instance = element
    this.#activationKey = navigator.userAgent.includes("Macintosh") ? "Cmd" : "Ctrl"

    if (closeKey && closeKey !== "") this.#closeKey = closeKey
    if (placeholder && placeholder !== "") this.#placeholder = placeholder
    if (emptyMessage && emptyMessage !== "") this.#emptyMessage = emptyMessage
    if (activationLetter && activationLetter !== "") this.#activationLetter = activationLetter

    this.#checkTagOptions()
    this.#init()
    return this
  }

  /* CONFIGURATION METHODS */
  #init() {
    const documentListener = createListener(document, "keydown", (event: Event) => {
      const keyEvent = event as KeyboardEvent
      const keyCode = `Key${this.#activationLetter.toUpperCase()}`
      if (keyEvent.code === keyCode && (keyEvent.metaKey || keyEvent.ctrlKey)) {
        keyEvent.preventDefault()
        this.#isOpen ? this.close() : this.open()
      }
      if (keyEvent.key.toLowerCase() === this.#closeKey.toLowerCase()) this.close()
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
  }

  #checkTagOptions() {
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
      if (keyEvent.metaKey || keyEvent.ctrlKey) {
        this.#commands.find(({ hotkey, handler }) => {
          const keyLetter = extractHotkeyLetter(hotkey)
          if (!keyLetter) return false
          const keyCode = `Key${keyLetter}`
          if (keyEvent.code === keyCode) {
            keyEvent.preventDefault()
            if (handler != null) setTimeout(() => handler(this.instance), 200)
            this.close()
          }
          return false
        })
      }
    })
    this.#listeners.push(keydownListener)

    const clickListener = createListener(this.#container, "click", (event: Event) => {
      const mouseEvent = event as MouseEvent
      const item = mouseEvent.target as HTMLElement
      if (item.tagName === "LI") this.#activateItem(item)
      if (item.parentElement?.tagName === "LI") this.#activateItem(item.parentElement)
    })
    this.#listeners.push(clickListener)

    const mouseoverListener = createListener(this.#container, "mouseover", (event: Event) => {
      const mouseEvent = event as MouseEvent
      const item = mouseEvent.target as HTMLElement
      if (item.tagName === "LI") {
        this.#items.forEach((i) => i.removeAttribute("data-active"))
        item.setAttribute("data-active", "")
      }
    })
    this.#listeners.push(mouseoverListener)

    const navigationListener = createListener(this.#container, "keydown", (event: Event) => {
      const keyEvent = event as KeyboardEvent
      const items = this.#items
      this.currentIndex = Array.from(items).findIndex((item) => item.hasAttribute("data-active"))
      this.currentIndex = this.currentIndex === -1 ? 0 : this.currentIndex
      let nextIndex = 0

      if (keyEvent.key === "Enter") {
        keyEvent.preventDefault()
        const currentItem = items[this.currentIndex]
        if (currentItem) {
          this.#activateItem(currentItem)
          currentItem.removeAttribute("data-active")
        }
        this.currentIndex = 0
      }

      if (keyEvent.key === "ArrowUp") {
        keyEvent.preventDefault()
        nextIndex = this.currentIndex - 1 < 0 ? items.length - 1 : this.currentIndex - 1
      }

      if (keyEvent.key === "ArrowDown") {
        keyEvent.preventDefault()
        nextIndex = this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      if (keyEvent.key === "Tab") {
        keyEvent.preventDefault()
        nextIndex = this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      const currentItem = items[this.currentIndex]
      const nextItem = items[nextIndex]
      if (currentItem) currentItem.removeAttribute("data-active")
      if (nextItem) {
        nextItem.setAttribute("data-active", "")
        nextItem.scrollIntoView({ behavior: "smooth" })
      }
    })
    this.#listeners.push(navigationListener)

    const inputListener = createListener(this.#container, "input", (event: Event) => {
      const inputEvent = event as InputEvent
      const input = inputEvent.target as HTMLInputElement
      const value = input.value.toLowerCase()
      const sections = this.#container?.querySelectorAll<HTMLElement>("[data-section]")
      const emptySection = this.#container?.querySelector<HTMLElement>("[data-empty]")
      
      if (!sections || !emptySection) return

      sections.forEach((section) => {
        const list = section.querySelector("ul")
        if (!list) return
        const items = list.querySelectorAll("li")

        items.forEach((item) => {
          const titleEl = item.querySelector("p")
          const title = titleEl?.innerText?.toLowerCase() ?? ""
          if (title.includes(value)) item.style.display = "flex"
          else item.style.display = "none"
        })

        const visibleItems = list.querySelectorAll("li[style='display: flex;']")
        if (visibleItems.length === 0) section.style.display = "none"
        else section.style.display = "block"
      })

      const visibleSections = this.#container?.querySelectorAll<HTMLElement>("[data-section][style='display: block;']")
      if (visibleSections && visibleSections.length === 0) emptySection.style.display = "flex"
      else emptySection.style.display = "none"
    })
    this.#listeners.push(inputListener)
  }

  /* HELPER METHODS */
  #activateItem(item: HTMLElement) {
    this.#commands.find(({ hotkey, handler }) => {
      if (item.getAttribute("data-hotkey") === hotkey) {
        if (handler != null) setTimeout(() => handler(this.instance), 200)
        this.close()
      }
      return false
    })
  }

  #verifyCommands(commands: HotKeyPadCommand[]) {
    if (commands.length === 0) throw new Error("The commands array cannot be empty")
    commands.forEach((command) => {
      if (command.id === "" || command.title === "" || command.hotkey === "" || command.handler == null)
        throw new Error("The command object is not valid. It should contain an id, title, hotkey and handler")

      if (!isValidHotkey(command.hotkey))
        throw new Error(
          "The hotkey is not valid. It should only contain CTRL, CMD, ALT, SHIFT and a letter. Also it cannot contain browser or system reserved hotkeys such as CTRL+T, CTRL+N, CTRL+W, etc."
        )

      if (command.icon != null && typeof command.icon !== "string") throw new Error("The icon should be a string")

      const keys = command.hotkey.match(/\w+/g) ?? []
      if (keys.length > 2) throw new Error("The hotkey only supports 2 keys maximum")
    })
    return commands
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
    if (this.#isDestroyed) return
    window.dispatchEvent(new CustomEvent("hotkeypad:open"))
    this.instance.setAttribute("aria-expanded", "true")

    this.instance.style.opacity = "1"
    this.instance.style.visibility = "visible"
    this.instance.style.pointerEvents = "auto"
    setTimeout(() => this.#container?.querySelector("input")?.focus(), 200)
  }

  /**
   * Close the HotKeyPad dialog.
   * Dispatches 'hotkeypad:close' custom event.
   */
  close() {
    if (this.#isDestroyed) return
    window.dispatchEvent(new CustomEvent("hotkeypad:close"))
    this.instance.setAttribute("aria-expanded", "false")

    this.instance.style.opacity = "0"
    this.instance.style.visibility = "hidden"
    this.instance.style.pointerEvents = "none"
    const input = this.#container?.querySelector("input")
    if (input) input.value = ""
  }

  /**
   * Set the commands to be displayed in the HotKeyPad.
   * @param commands Array of HotKeyPadCommand objects
   * @throws Error if commands array is empty or contains invalid commands
   */
  setCommands(commands: HotKeyPadCommand[]) {
    if (this.#isDestroyed) return
    this.#commands = this.#verifyCommands(commands)
    this.#renderCommands()
    this.#setListeners()
  }

  /**
   * Destroy the HotKeyPad instance and clean up all resources.
   * Removes event listeners, disconnects observers, and clears DOM references.
   * After calling destroy(), the instance should not be used.
   */
  destroy() {
    if (this.#isDestroyed) return
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
    return this.#container?.querySelectorAll("li") ?? document.querySelectorAll("li.nonexistent")
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
      "aria-label": "Command palette"
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

    this.#sections.forEach(([section, commands]) => {
      const sectionEl = createElement("div")
      sectionEl.setAttribute("data-section", section.toLowerCase())

      if (section !== "Unlisted") {
        const titleEl = createElement("h4", section)
        titleEl.setAttribute("id", `section-${section.toLowerCase()}`)
        sectionEl.setAttribute("aria-label", `section-${section.toLowerCase()}`)
        sectionEl.appendChild(titleEl)
      }
      const listEl = createElement("ul")
      listEl.setAttribute("role", "listbox")
      listEl.setAttribute("aria-label", `${section} commands`)

      commands.forEach(({ title, icon, hotkey }) => {
        const keys = hotkey.split("+").map((key) => key.trim())
        const iconValue = icon ?? ""
        
        const itemEl = createElement("li")
        itemEl.setAttribute("data-hotkey", hotkey)
        itemEl.setAttribute("role", "option")
        itemEl.setAttribute("aria-label", `${title}, shortcut: ${hotkey}`)

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
        itemEl.appendChild(itemKeys)
        listEl.appendChild(itemEl)
      })

      sectionEl.appendChild(listEl)
      sectionsEl.appendChild(sectionEl)
    })
    sectionsEl.appendChild(this.emptyMessage)

    this.#container.insertBefore(sectionsEl, this.#container.lastChild)
  }

  #renderCommands() {
    if (!this.#container) return
    const sectionsEl = this.#container.querySelector("[data-sections]")
    if (sectionsEl) sectionsEl.remove()
    this.#createSections()
    const firstItem = this.#items[0]
    if (firstItem) firstItem.setAttribute("data-active", "")
  }
}