import type { HotKeyPadCommand, HotKeyPadOptionsProps } from "./types"
import { createElement } from "./utils"

export default class HotKeyPad {
  instance: HTMLElement | null
  #backdrop: HTMLElement | null = null
  #container: HTMLElement | null = null
  #commands: HotKeyPadCommand[] = []
  currentIndex = 0

  #closeKey = "Escape"
  #activationKey: string
  #activationLetter = "K"
  #placeholder = "Search command"
  #svgIconColor = "black"

  constructor({
    closeKey,
    placeholder,
    activationLetter
  }: HotKeyPadOptionsProps = {}) {
    if (document.getElementById("hotkeypad") == null) {
      throw new Error("HotKeyPad instance not found in the DOM")
    }
    this.instance = document.getElementById("hotkeypad")
    this.#activationKey = navigator.userAgent.includes("Macintosh")
      ? "Cmd"
      : "Ctrl"

    if (closeKey && closeKey !== "") this.#closeKey = closeKey
    if (placeholder && placeholder !== "") this.#placeholder = placeholder
    if (activationLetter && activationLetter !== "")
      this.#activationLetter = activationLetter

    this.#init()
    return this
  }

  #init() {
    // Listen for the activation key
    document.addEventListener("keydown", (event) => {
      const keyCode = `Key${this.#activationLetter.toUpperCase()}`
      if (event.code === keyCode && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        this.#isOpen ? this.close() : this.open()
      }
      if (event.key === this.#closeKey) this.close()
    })

    // Render first blocks of the hotkeypad
    this.#createBackdrop()
    this.#createContainer()
    this.#createHeader()
    this.#createFooter()
  }

  /* PUBLIC METHODS */
  open() {
    window.dispatchEvent(new CustomEvent("hotkeypad:open")) // Allow to listen for the open event
    if (this.instance === null) return

    this.instance.style.opacity = "1"
    this.instance.style.visibility = "visible"
    this.instance.style.pointerEvents = "auto"
    setTimeout(() => this.#container!.querySelector("input")!.focus(), 200)
  }

  close() {
    window.dispatchEvent(new CustomEvent("hotkeypad:close")) // Allow to listen for the close event
    if (this.instance === null) return

    this.instance.style.opacity = "0"
    this.instance.style.visibility = "hidden"
    this.instance.style.pointerEvents = "none"
    this.#container!.querySelector("input")!.value = ""
    this.#container!.removeEventListener("keydown", () => {})
    this.#container!.removeEventListener("mouseover", () => {})
    this.#container!.removeEventListener("input", () => {})
  }

  setCommands(commands: HotKeyPadCommand[]) {
    this.#commands = commands
    this.#renderCommands()
  }

  /* GETTERS */
  get #isOpen() {
    return this.instance!.style.visibility === "visible"
  }

  get activationKey() {
    return this.#activationKey
  }

  get #sections() {
    const map = new Map()
    this.#commands.forEach((item) => {
      const key = item.section
      const collection = map.get(key)
      if (!collection) map.set(key, [item])
      else collection.push(item)
    })
    return Array.from(map) as Array<[string, HotKeyPadCommand[]]>
  }

  get #items() {
    return this.#container!.querySelectorAll("li")
  }

  /* ICON METHODS */
  #iconURL(icon: string) {
    return `https://cdn.simpleicons.org/${icon}/${this.#svgIconColor}`
  }

  #isCustomIcon(icon: string) {
    return (
      /<svg/.test(icon) || /<img/.test(icon) || /<i/.test(icon) || icon === ""
    )
  }

  /* RENDERING METHODS */
  #createBackdrop() {
    this.#backdrop = createElement("div", {
      "data-backdrop": "",
      "aria-hidden": "true"
    })
    this.#backdrop.addEventListener("click", () => this.close())
    this.instance!.appendChild(this.#backdrop)
  }

  #createContainer() {
    this.#container = createElement("div", { "data-container": "" })
    this.instance!.appendChild(this.#container)
  }

  #createHeader() {
    const headerEl = createElement("header")
    const inputEl = createElement("input", {
      type: "text",
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
    const keyEnter = createElement("kbd", { innerText: "↩" })
    const keyUp = createElement("kbd", { innerText: "↑" })
    const keyDown = createElement("kbd", { innerText: "↓" })
    const keyEsc = createElement("kbd", { innerText: this.#closeKey })
    const keyCmdK = createElement("kbd", {
      innerText: `${this.#activationKey} + ${this.#activationLetter}`
    })

    const pEnter = createElement("p", { innerText: " to select" })
    const pUpDown = createElement("p", { innerText: " to navigate" })
    const pCmdK = createElement("p", { innerText: " to close" })

    pEnter.prepend(keyEnter)
    pUpDown.prepend(keyUp, keyDown)
    pCmdK.prepend(keyCmdK, keyEsc)

    footerEl.append(pEnter, pUpDown, pCmdK)
    this.#container!.appendChild(footerEl)
  }

  #createSections() {
    const sectionsEl = createElement("div")
    sectionsEl.setAttribute("data-sections", "")

    this.#sections.forEach(([section, commands]) => {
      const sectionEl = createElement("div")
      sectionEl.setAttribute("data-section", section.toLowerCase())

      const titleEl = createElement("h4", { innerText: section })
      const listEl = createElement("ul")

      commands.forEach(({ title, icon, hotkey }) => {
        const keys = hotkey.split("+").map((key) => key.trim())
        const stringIcon = this.#isCustomIcon(icon)
          ? icon
          : `<img src="${this.#iconURL(icon)}" alt="${title}" />`

        const itemEl = createElement("li")
        itemEl.setAttribute("data-hotkey", hotkey)
        itemEl.setAttribute("tabindex", "0")

        const itemIcon = createElement("span")
        itemIcon.innerHTML = stringIcon

        const itemTitle = createElement("p")
        itemTitle.append(title)

        const itemKeys = createElement("div")
        keys.forEach((key) => {
          const keyEl = createElement("span", { innerText: key })
          itemKeys.appendChild(keyEl)
        })

        itemEl.appendChild(itemIcon)
        itemEl.appendChild(itemTitle)
        itemEl.appendChild(itemKeys)
        listEl.appendChild(itemEl)
      })

      sectionEl.appendChild(titleEl)
      sectionEl.appendChild(listEl)
      sectionsEl.appendChild(sectionEl)
    })

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
