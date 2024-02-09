/**
 * @typedef {Object} HotKeyPadData
 * @property {string} id
 * @property {string} title
 * @property {string} icon
 * @property {string} hotkey
 * @property {string} section
 * @property {() => void} handler
 */

export default class HotKeyPad {
  /** @type {HotKeyPadData[]} */
  #commands = []
  instance
  /** @type {HTMLElement} */
  #backdrop
  /** @type {HTMLElement} */
  #container
  currentIndex = 0
  #activationKey
  #activationLetter = 'K'
  #closeKey = 'Escape'
  #placeholder = 'Search command'
  #hideBreadcrumbs = false
  // eslint-disable-next-line no-undef
  #observer = new MutationObserver(this.#observeClassChanges.bind(this))
  #iconsColor = 'black'

  /**
   * @description Creates an instance of the HotKeyPad class
   * @param {Object} options
   * @param {string} options.placeholder Placeholder for the search input
   * @param {boolean} options.hideBreadcrumbs Whether to hide the breadcrumbs or not
   * @param {string} options.activationLetter The activation letter for the pad. Default is "K"
   * @param {string} options.closeKey The key to close the pad. Default is "Escape"
   * @returns {HotKeyPad}
   */
  constructor ({
    placeholder,
    hideBreadcrumbs,
    activationLetter,
    closeKey
  } = {}) {
    this.instance = document.getElementById('hotkeypad')
    this.#activationKey = navigator.userAgent.includes('Macintosh')
      ? 'Cmd'
      : 'Ctrl'

    if (placeholder && placeholder !== '') this.#placeholder = placeholder
    if (hideBreadcrumbs) this.#hideBreadcrumbs = hideBreadcrumbs
    if (activationLetter && activationLetter !== '') {
      this.#activationLetter = activationLetter
    }
    if (closeKey && closeKey !== '') this.#closeKey = closeKey

    this.#checkTagOptions()
    this.#init()
    return this
  }

  #checkTagOptions () {
    if (
      this.instance.hasAttribute('data-placeholder') &&
      this.instance.getAttribute('data-placeholder') !== ''
    ) {
      this.#placeholder = this.instance.getAttribute('data-placeholder')
    }

    if (
      this.instance.hasAttribute('data-activation-letter') &&
      this.instance.getAttribute('data-activation-letter') !== ''
    ) {
      this.#activationLetter = this.instance
        .getAttribute('data-activation-letter')
        .toUpperCase()
    }

    if (
      this.instance.hasAttribute('data-close-key') &&
      this.instance.getAttribute('data-close-key') !== ''
    ) {
      this.#closeKey = this.instance
        .getAttribute('data-activation-letter')
        .toUpperCase()
    }

    if (this.instance.hasAttribute('data-hide-breadcrumbs')) {
      this.#hideBreadcrumbs = true
    }
  }

  #init () {
    // Listen for the activation key
    document.addEventListener('keydown', (event) => {
      const keyCode = `Key${this.#activationLetter.toUpperCase()}`
      if (event.code === keyCode && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        this.#isOpen ? this.close() : this.open()
      }
      if (event.key === this.#closeKey) this.close()
    })

    // Observe the class changes on the hotkeypad instance
    this.#observer.observe(this.instance, {
      attributes: true,
      attributeFilter: ['class'],
      childList: false,
      characterData: false
    })

    // Render first blocks of the hotkeypad
    this.#createBackdrop()
    this.#createContainer()
    this.#createHeader()
    this.#createFooter()
  }

  /**
   * Observes the class changes on the hotkeypad instance
   * @param {MutationRecord[]} event
   * @returns {void}
   */
  #observeClassChanges (event) {
    const { attributeName, target } = event[0]
    if (attributeName === 'class') {
      if (target.classList.contains('dark')) {
        this.#iconsColor = 'white'
      } else {
        this.#iconsColor = 'black'
      }
      this.#render()
    }
  }

  /**
   * Sets the commands for the hotkeypad and renders it
   * @param {HotKeyPadData[]} commands Data to be set
   */
  setCommands (commands) {
    this.#commands = commands
    this.#render()
    this.#setListeners()
  }

  #activateItem (item) {
    this.#commands.find(({ hotkey, handler }) => {
      console.log(item, item.getAttribute('data-hotkey'))
      if (item.getAttribute('data-hotkey') === hotkey) {
        handler()
        this.close()
      }
      return false
    })
  }

  #setListeners () {
    // Listen for hotkey combinations registered in the hotkeypad
    this.instance.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey) {
        this.#commands.find(({ hotkey, handler }) => {
          const pairKey = hotkey
            .split('+')
            .map((key) => key.trim())[1]
            .toLowerCase()
          if (event.key.toLowerCase() === pairKey) {
            event.preventDefault()
            if (handler != null) handler()
            this.close()
          }
          return false
        })
      }
    })

    // Listen for the search input
    this.#container.addEventListener('input', (event) => {
      const value = event.target.value.toLowerCase()
      const sections = this.#container.querySelectorAll('[data-section]')
      sections.forEach((section) => {
        const list = section.querySelector('ul')
        const items = list.querySelectorAll('li')

        items.forEach((item) => {
          const title = item.querySelector('p').innerText.toLowerCase()
          if (title.includes(value)) item.style.display = 'flex'
          else item.style.display = 'none'
        })
      })
    })

    // Listen for click events on the items
    this.#container.addEventListener('click', (event) => {
      if (event.target.tagName === 'LI') this.#activateItem(event.target)
      if (event.target.parentElement.tagName === 'LI') this.#activateItem(event.target.parentElement)
    })

    // Listen for the keyboard navigation events
    this.#container.addEventListener('keydown', (event) => {
      const items = this.#items
      this.currentIndex = Array.from(items).findIndex((item) =>
        item.hasAttribute('data-active')
      )
      this.currentIndex = this.currentIndex === -1 ? 0 : this.currentIndex
      let nextIndex = 0

      if (event.key === 'Enter') {
        event.preventDefault()
        this.#activateItem(items[this.currentIndex])
        items[this.currentIndex].removeAttribute('data-active')
        this.currentIndex = 0
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        nextIndex =
          this.currentIndex - 1 < 0 ? items.length - 1 : this.currentIndex - 1
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        nextIndex =
          this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        nextIndex =
          this.currentIndex + 1 > items.length - 1 ? 0 : this.currentIndex + 1
      }

      items[this.currentIndex].removeAttribute('data-active')
      items[nextIndex].setAttribute('data-active', '')
    })

    // Listen for the mouse over event on the items
    this.#container.addEventListener('mouseover', (event) => {
      if (event.target.tagName === 'LI') {
        this.#items.forEach((item) => item.removeAttribute('data-active'))
        event.target.setAttribute('data-active', '')
      }
    })
  }

  get #isOpen () {
    return this.instance.style.visibility === 'visible'
  }

  get activationKey () {
    return this.#activationKey
  }

  /**
   * Returns the URL of the icon
   * @param {string} icon Name of the icon
   * @returns {string} URL of the icon
   */
  #iconURL (icon) {
    return `https://cdn.simpleicons.org/${icon}/${this.#iconsColor}`
  }

  /**
   * @type {Array<[string, HotKeyPadData[]]>}
   */
  get #sections () {
    const map = new Map()
    this.#commands.forEach((item) => {
      const key = item.section
      const collection = map.get(key)
      if (!collection) {
        map.set(key, [item])
      } else {
        collection.push(item)
      }
    })
    return Array.from(map)
  }

  get #items () {
    return this.#container.querySelectorAll('li')
  }

  open () {
    window.dispatchEvent(new CustomEvent('hotkeypad:open')) // Allow to listen for the open event
    this.instance.style.visibility = 'visible'
    this.instance.style.opacity = '1'
    this.instance.style.pointerEvents = 'auto'
    setTimeout(() => this.#container.querySelector('input').focus(), 200)
  }

  close () {
    window.dispatchEvent(new CustomEvent('hotkeypad:close')) // Allow to listen for the close event
    this.instance.style.visibility = 'hidden'
    this.instance.style.opacity = '0'
    this.instance.style.pointerEvents = 'none'
    this.#container.querySelector('input').value = ''
    this.#container.removeEventListener('keydown', () => {})
    this.#container.removeEventListener('mouseover', () => {})
    this.#container.removeEventListener('input', () => {})
  }

  #isCustomIcon (icon) {
    return (
      /<svg/.test(icon) || /<img/.test(icon) || /<i/.test(icon) || icon === ''
    )
  }

  /**
   * Creates an HTML element
   * @param {string} tagName Tag name of the element to create
   * @param {string} content Content of the element
   * @returns Element
   * @private
   */
  #createElement (tagName, content) {
    const el = document.createElement(tagName)
    el.innerText = content
    return el
  }

  #createBackdrop () {
    const backdropEl = this.#createElement('div', '')
    backdropEl.setAttribute('data-backdrop', '')
    backdropEl.setAttribute('aria-hidden', true)

    this.#backdrop = backdropEl
    this.#backdrop.addEventListener('click', () => this.close())
    this.instance.appendChild(backdropEl)
  }

  #createContainer () {
    const containerEl = this.#createElement('div', '')
    containerEl.setAttribute('data-container', '')
    this.#container = containerEl
    this.instance.appendChild(containerEl)
  }

  #createHeader () {
    const headerEl = this.#createElement('header', '')
    const inputEl = this.#createElement('input', '')
    inputEl.setAttribute('type', 'text')
    inputEl.setAttribute('placeholder', this.#placeholder)
    inputEl.setAttribute('aria-label', this.#placeholder)
    inputEl.setAttribute('autocomplete', 'off')
    inputEl.setAttribute('spellcheck', 'false')

    if (!this.#hideBreadcrumbs) {
      const sectionTitleEl = this.#createElement('span', 'Home')
      headerEl.appendChild(sectionTitleEl)
    }

    headerEl.appendChild(inputEl)
    this.#container.appendChild(headerEl)
  }

  #createSections () {
    const sectionsEl = this.#createElement('div', '')
    sectionsEl.setAttribute('data-sections', '')

    this.#sections.forEach(([section, commands]) => {
      const sectionEl = this.#createElement('div', '')
      sectionEl.setAttribute('data-section', section.toLowerCase())

      const titleEl = this.#createElement('h4', section)
      const listEl = this.#createElement('ul', '')

      commands.forEach(({ title, icon, hotkey }) => {
        const keys = hotkey.split('+').map((key) => key.trim())
        const stringIcon = this.#isCustomIcon(icon)
          ? icon
          : `<img src="${this.#iconURL(icon)}" alt="${title}" />`

        const itemEl = this.#createElement('li', '')
        itemEl.setAttribute('data-hotkey', hotkey)
        itemEl.setAttribute('tabindex', '0')

        const itemIcon = this.#createElement('span', '')
        itemIcon.innerHTML = stringIcon

        const itemTitle = this.#createElement('p', '')
        itemTitle.append(title)

        const itemKeys = this.#createElement('div', '')
        keys.forEach((key) => {
          const keyEl = this.#createElement('span', key)
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
    this.#container.insertBefore(sectionsEl, this.#container.lastChild)
  }

  #createFooter () {
    const footerEl = this.#createElement('footer', '')

    const keyEnter = this.#createElement('kbd', '↩')
    const keyUp = this.#createElement('kbd', '↑')
    const keyDown = this.#createElement('kbd', '↓')
    const keyCmdK = this.#createElement(
      'kbd',
      `${this.#activationKey} + ${this.#activationLetter}`
    )
    const keyEsc = this.#createElement('kbd', this.#closeKey)

    const pEnter = this.#createElement('p', ' to select')
    pEnter.prepend(keyEnter)

    const pUpDown = this.#createElement('p', ' to navigate')
    pUpDown.prepend(keyUp, keyDown)

    const pCmdK = this.#createElement('p', ' to close')
    pCmdK.prepend(keyCmdK, keyEsc)

    footerEl.append(pEnter, pUpDown, pCmdK)
    this.#container.appendChild(footerEl)
  }

  #render () {
    // Remove the previous sections and insert after the header
    const sectionsEl = this.#container.querySelector('[data-sections]')
    if (sectionsEl) sectionsEl.remove()
    this.#createSections()
    this.#items[0].setAttribute('data-active', '')
  }
}
