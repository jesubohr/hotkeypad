# HotKeyPad

HotKeypad is a lightweight package that provides you with a keyboard shortcuts interface for your website.
Built with vanilla JS, no external dependencies. Inspired in design and functionality by [NinjaKeys](https://github.com/ssleptsov/ninja-keys).

![npm](https://img.shields.io/npm/v/hotkeypad)
![npm](https://img.shields.io/npm/dw/hotkeypad)

## Demo
To see it in action, check out my [resume](https://resume.jesubohr.dev).

Also check the [Detailed Documentation](https://jesubohr-hotkeypad.mintlify.app/introduction).

![Demo](./docs/hotkeypad-demo.gif)

## Motivation

There are lots of libraries that provide keyboard shortcuts for web apps, but most of them are somewhat heavy and depend on extra dependencies. I wanted to create a simple and lightweight package that provided this functionality without any dependencies and made with vanilla JS, so it could be integrated into any web project.

## Installation

You can install hotkeypad via npm, pnpm or yarn. Here's how you can do it with npm:

```bash
npm install hotkeypad
```

Import the stylesheet in your application:

```javascript
import 'hotkeypad/index.css'
```

For a page without a bundler, load the ESM entry and stylesheet from a CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/hotkeypad@latest/dist/styles/index.css">
<div id="hotkeypad"></div>
<script type="module">
  import HotKeyPad from 'https://unpkg.com/hotkeypad@latest/dist/index.js'
  const element = document.querySelector('#hotkeypad')
  const hotkeypad = new HotKeyPad({ element })
</script>
```

## Usage

To use HotKeyPad, you need to import the package and create a new instance of the HotKeyPad class. You can then add commands to the keypad and display it on your web app.

Add the palette element to your page. The default element ID is `hotkeypad`. The library adds `data-hotkeypad` to custom mount elements so the package styles can target them.

```html
<div id="hotkeypad"></div>
```

Then, you can use the following code to add the keypad to your page:
```javascript
import HotKeyPad from 'hotkeypad'

const hotkeypad = new HotKeyPad()

// This will set the commands and render the keypad automatically
hotkeypad.setCommands([
  {
    section: "Actions",
    id: "print",
    title: "Print Page",
    hotkey: `${hotkeypad.activationKey}+Shift+P`,
    handler: () => {
      window.print()
    }
  },
])

// You can also add a listener to the open and close events
window.addEventListener('hotkeypad:open', () => {
  console.log('HotKeyPad is open')
})

window.addEventListener('hotkeypad:close', () => {
  console.log('HotKeyPad is closed')
})
```
The default activation key is `Ctrl` on Windows and Linux, and `Cmd` on macOS. You can pass an element directly with `new HotKeyPad({ element })` instead of using the default ID.

## Features

- Keyboard navigation
- Customizable commands
- Light and dark mode support
- Customizable colors with CSS variables
- Customizable activation key

## Options

Pass options to the constructor or set the matching `data-*` attributes on the palette element.

| Option | Default | Data attribute | Description |
|---|---|---|---|
| `element` | Element with ID `hotkeypad` | Not available | Palette root element. |
| `placeholder` | `Search command` | `data-placeholder` | Search field placeholder. |
| `emptyMessage` | `No commands found` | `data-empty-message` | Text shown when the list is empty. |
| `activationLetter` | `K` | `data-activation-letter` | Final letter in the activation shortcut. |
| `closeKey` | `Escape` | `data-close-key` | Key that closes the palette. |

The activation shortcut accepts `Ctrl` or `Cmd` plus the activation letter. The displayed modifier follows the operating system. Command shortcuts can include one or more modifiers and must end with a letter from `A` to `Z`, for example `Ctrl+Shift+P`.

## Commands Format
Array of HotKeyPadCommand objects that represent the commands that will be displayed on the keypad.

| Field     | Type     | Description                                                                 |
|-----------|----------|-----------------------------------------------------------------------------|
| id        | string   | The unique identifier of the command.                                       |
| title     | string   | The title of the command.                                                   |
| hotkey    | string (optional) | Shortcut with one or more modifiers and a final letter, such as `Ctrl+Shift+P`. |
| handler   | Function | The function to be executed when the command is triggered.                  |
| icon      | string (optional)   | The icon of the command.                                                    |
| section   | string (optional)   | The section of the command. Allows you to group commands.                   |

Command IDs and normalized shortcuts must be unique. Shortcuts cannot use the palette activation combination or the reserved Ctrl/Cmd combinations for T, N, and W. An empty command array is allowed. Command shortcuts run only while the palette is open. Modifier keys must match the shortcut exactly.

## Methods

### `setCommands(commands: HotKeyPadCommand[]): void`
Set the commands that will be displayed on the keypad.  

### `open(): void`
Open the keypad.

### `close(): void`
Close the keypad.

### `destroy(): void`
Remove the palette and its event listeners. Call this when you remove the palette from your application.

### `isDestroyed: boolean`
Read whether `destroy()` has been called.

Only one palette can remain open at a time. The palette traps focus while open and restores focus when it closes. It runs command handlers immediately after activation. It adds event listeners once, even when you call `setCommands` more than once.

## Events

### `hotkeypad:open`
Fired when the keypad is opened.

### `hotkeypad:close`
Fired when the keypad is closed.

## CSS Variables

You can customize the colors of the keypad by changing the CSS variables. Here are the available variables:

```css
--hotkeypad-bg-kbd: #f9fafb;
--hotkeypad-bg-backdrop: #fff;
--hotkeypad-bg-container: #fff;
--hotkeypad-bg-item-hover: #f3f4f6;
--hotkeypad-border-container: #d1d5db;
--hotkeypad-border-container-hover: #9ca3af;
--hotkeypad-fg-muted: #4b5563;
```

Example:
```css
[data-hotkeypad] {
  --hotkeypad-bg-container: red;
}
```

## CSS HotKeyPad Parts
Allowing you to style specific elements from your style.
  
```css
[data-hotkeypad] [data-backdrop] {}
[data-hotkeypad] [data-container] {}
[data-hotkeypad] [data-sections] {}
[data-hotkeypad] [data-section] {}
[data-hotkeypad] [data-empty] {}
[data-hotkeypad] [data-hotkey] {}
[data-hotkeypad] [data-hotkey][data-active] {}
```

## Icons

Custom icon markup must come from a trusted source. The library inserts it as HTML.
You can use any icon library or custom icons. You can use the `icon` field to set the icon of the command. You can use an image, svg or font icon:
- `<svg ...><path d="..." /></svg>`
- `<img src="path/to/image.png" alt="Title" />`
- `<i class="material-icons">print</i>`

By default will use the [Simple Icons](https://simpleicons.org/) library as this: `<img src="https://cdn.simpleicons.org/{icon}" alt="{title}" />` if you pass a normal name instead of the any previous mentioned tags.

## License

Copyright (c) [Jesus Borrero](https://me.jesubohrdev.com).

Licensed under the [MIT License](LICENSE)
