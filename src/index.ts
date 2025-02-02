import type { HotKeyPadCommand, HotKeyPadOptionsProps } from "./types"
import { createElement, createListener, extractHotkeyLetter, isValidHotkey } from "./utils"

export default class HotKeyPad {
  instance: HTMLElement
  #backdrop: HTMLElement | null = null
  #container: HTMLElement | null = null
  #commands: HotKeyPadCommand[] = []
  currentIndex = 0

  #closeKey = "Escape"
  #activationKey: string
  #activationLetter = "K"
  #placeholder = "Search command"
  #emptyMessage = "No commands found"
  #svgIconColor = "black"
  #observer = new MutationObserver(this.#observeClassChanges.bind(this))

  constructor({ closeKey, placeholder, emptyMessage, activationLetter }: HotKeyPadOptionsProps = {}) {
    if (document.getElementById("hotkeypad") == null) {
      throw new Error("HotKeyPad instance not found in the DOM")
    }
    this.instance = document.getElementById("hotkeypad") as HTMLElement
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
    // Listen for the activation key
    createListener(document, "keydown", (event: KeyboardEvent) => {
      const keyCode = `Key${this.#activationLetter.toUpperCase()}`
      if (event.code === keyCode && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        this.#isOpen ? this.close() : this.open()
      }
      if (event.key.toLowerCase() === this.#closeKey.toLowerCase()) this.close()
    })

    // Observe the class changes on the hotkeypad instance
    this.#observer.observe(this.instance, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      characterData: false
    })

    // Render first blocks of the hotkeypad
    this.#createBackdrop()
    this.#createContainer()
    this.#createHeader()
    this.#createFooter()
  }

  #checkTagOptions() {
    if (this.instance.hasAttribute("data-placeholder") && this.instance.getAttribute("data-placeholder") !== "") {
      this.#placeholder = this.instance.getAttribute("data-placeholder") as string
    }

    if (
      this.instance.hasAttribute("data-activation-letter") &&
      this.instance.getAttribute("data-activation-letter") !== ""
    ) {
      this.#activationLetter = (this.instance.getAttribute("data-activation-letter") as string).toUpperCase()
    }

    if (this.instance.hasAttribute("data-close-key") && this.instance.getAttribute("data-close-key") !== "") {
      this.#closeKey = (this.instance.getAttribute("data-close-key") as string).toUpperCase()
    }
  }

  #observeClassChanges(event: MutationRecord[]) {
    const { attributeName, target } = event[0]
    if (attributeName === "class") {
      if ((target as Element).classList.contains("dark")) this.#svgIconColor = "white"
      else this.#svgIconColor = "black"
      this.#renderCommands()
    }
  }

  #setListeners() {
    // Listen for hotkey combinations registered in the hotkeypad
    createListener(this.instance, "keydown", (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        this.#commands.find(({ hotkey, handler }) => {
          const keyLetter = extractHotkeyLetter(hotkey)
          const keyCode = `Key${keyLetter}`
          if (event.code === keyCode) {
            event.preventDefault()
            if (handler != null) setTimeout(() => handler(this.instance), 200)
            this.close()
          }
          return false
        })
      }
    })

    // Listen for click events on the items
    createListener(this.#container!, "click", (event: MouseEvent) => {
      const item = event.target as HTMLElement
      if (item.tagName === "LI") this.#activateItem(item)
      if (item.parentElement?.tagName === "LI") this.#activateItem(item.parentElement)
    })

    // Listen for the mouse over event on the items
    createListener(this.#container!, "mouseover", (event: MouseEvent) => {
      const item = event.target as HTMLElement
      if (item.tagName === "LI") {
        this.#items.forEach((item) => item.removeAttribute("data-active"))
        item.setAttribute("data-active", "")
      }
    })

    // Listen for the keyboard navigation events
    createListener(this.#container!, "keydown", (event: KeyboardEvent) => {
      const items = this.#items
      this.currentIndex = Array.from(items).findIndex((item) => item.hasAttribute("data-active"))
      this.currentIndex = this.currentIndex === -1 ? 0 : this.currentIndex
      let nextIndex = 0

      if (event.key === "Enter") {
        event.preventDefault()
        this.#activateItem(items[this.currentIndex])
        items[this.currentIndex].removeAttribute("data-active")
        this.currentIndex = 0
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        nextIndex = this.currentIndex - 1 < 0 ? items.length - 1 : this.currentIndex - 1
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        nextIndex = this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      if (event.key === "Tab") {
        event.preventDefault()
        nextIndex = this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      items[this.currentIndex].removeAttribute("data-active")
      items[nextIndex].setAttribute("data-active", "")
    })

    // Listen for the search input
    createListener(this.#container!, "input", (event: InputEvent) => {
      const input = event.target as HTMLInputElement
      const value = input.value.toLowerCase()
      const sections = this.#container!.querySelectorAll<HTMLElement>("[data-section]")
      const emptySection = this.#container!.querySelector<HTMLElement>("[data-empty]")
      
      sections.forEach((section) => {
        const list = section.querySelector("ul")!
        const items = list.querySelectorAll("li")

        items.forEach((item) => {
          const title = item.querySelector("p")!.innerText.toLowerCase()
          if (title.includes(value)) item.style.display = "flex"
          else item.style.display = "none"
        })

        const visibleItems = list.querySelectorAll("li[style='display: flex;']")
        if (visibleItems.length === 0) section.style.display = "none"
        else section.style.display = "block"
      })

      const visibleSections = this.#container!.querySelectorAll<HTMLElement>("[data-section][style='display: block;']")
      if (visibleSections.length === 0) emptySection!.style.display = "flex"
      else emptySection!.style.display = "none"
    })
  }

  /* HELPER METHODS */
  /**
   * Activate the item with the corresponding hotkey
   * @param item The item to activate
   * @executes The handler of the item
   */
  #activateItem(item: HTMLElement) {
    this.#commands.find(({ hotkey, handler }) => {
      if (item.getAttribute("data-hotkey") === hotkey) {
        if (handler != null) setTimeout(() => handler(this.instance), 200)
        this.close()
      }
      return false
    })
  }

  /**
   * Verify the commands array
   * @param commands The commands array to verify
   * @returns The verified commands array
   * @throws An error if the commands array is not valid
   */
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
  open() {
    window.dispatchEvent(new CustomEvent("hotkeypad:open")) // Allow to listen for the open event

    this.instance.style.opacity = "1"
    this.instance.style.visibility = "visible"
    this.instance.style.pointerEvents = "auto"
    setTimeout(() => this.#container!.querySelector("input")!.focus(), 200)
  }

  close() {
    window.dispatchEvent(new CustomEvent("hotkeypad:close")) // Allow to listen for the close event

    this.instance.style.opacity = "0"
    this.instance.style.visibility = "hidden"
    this.instance.style.pointerEvents = "none"
    this.#container!.querySelector("input")!.value = ""
    this.#container!.removeEventListener("keydown", () => {})
    this.#container!.removeEventListener("mouseover", () => {})
    this.#container!.removeEventListener("input", () => {})
  }

  setCommands(commands: HotKeyPadCommand[]) {
    this.#commands = this.#verifyCommands(commands)
    this.#renderCommands()
    this.#setListeners()
  }

  /* GETTERS */
  get #isOpen() {
    return this.instance.style.visibility === "visible"
  }

  get activationKey() {
    return this.#activationKey
  }

  get #sections() {
    const map = new Map()
    this.#commands.forEach((item) => {
      const key = typeof item.section !== "string" || item.section === "" ? "Unlisted" : item.section
      const { section, ...content } = item
      const collection = map.get(key)
      if (!collection) map.set(key, [content])
      else collection.push(content)
    })
    return Array.from(map) as Array<[string, HotKeyPadCommand[]]>
  }

  get #items() {
    return this.#container!.querySelectorAll("li")
  }

  get emptyMessage() {
    const message = createElement("div", this.#emptyMessage)
    message.setAttribute("data-empty", "")
    return message
  }

  /* ICON METHODS */
  #iconURL(icon: string) {
    return `https://cdn.simpleicons.org/${icon}/${this.#svgIconColor}`
  }

  #isCustomIcon(icon: string) {
    return /<svg/.test(icon) || /<img/.test(icon) || /<i/.test(icon) || icon === ""
  }

  /* RENDERING METHODS */
  #createBackdrop() {
    this.#backdrop = createElement("div", {
      "data-backdrop": "",
      "aria-hidden": "true"
    })
    createListener(this.#backdrop, "click", () => this.close())
    this.instance.appendChild(this.#backdrop)
  }

  #createContainer() {
    this.#container = createElement("div", { "data-container": "" })
    this.instance.appendChild(this.#container)
  }

  #createHeader() {
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
    this.#container!.appendChild(headerEl)
  }

  #createFooter() {
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
    this.#container!.appendChild(footerEl)
  }

  #createSections() {
    const sectionsEl = createElement("div")
    sectionsEl.setAttribute("data-sections", "")

    this.#sections.forEach(([section, commands]) => {
      const sectionEl = createElement("div")
      sectionEl.setAttribute("data-section", section.toLowerCase())

      if (section !== "Unlisted") {
        const titleEl = createElement("h4", section)
        titleEl.setAttribute("id", `section-${section.toLowerCase()}`)
        sectionEl.setAttribute("aria-labelledby", `section-${section.toLowerCase()}`)
        sectionEl.appendChild(titleEl)
      }
      const listEl = createElement("ul")

      commands.forEach(({ title, icon, hotkey }) => {
        const keys = hotkey.split("+").map((key) => key.trim())
        if (icon == null) icon = ""
        const stringIcon = this.#isCustomIcon(icon) ? icon : `<img src="${this.#iconURL(icon)}" alt="${title}" />`

        const itemEl = createElement("li")
        itemEl.setAttribute("data-hotkey", hotkey)

        if (stringIcon !== "") {
          const itemIcon = createElement("span")
          itemIcon.innerHTML = stringIcon
          itemEl.appendChild(itemIcon)
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

    // Append the sections between the header and footer
    this.#container!.insertBefore(sectionsEl, this.#container!.lastChild)
  }

  #renderCommands() {
    // Remove the previous sections and insert after the header
    const sectionsEl = this.#container!.querySelector("[data-sections]")
    if (sectionsEl) sectionsEl.remove()
    this.#createSections()
    this.#items[0].setAttribute("data-active", "")
  }
}
