# HotKeyPad

HotKeypad is a lightweight package that provides you with a keyboard shortcuts interface for your website.
Built with vanilla JS, no external dependencies. Inspired in design and functionality by [NinjaKeys](https://github.com/ssleptsov/ninja-keys).

![npm](https://img.shields.io/npm/v/hotkeypad)
![npm](https://img.shields.io/npm/dw/hotkeypad)

## Demo
![Demo](./docs/hotkeypad-demo.gif)

## Motivation

There are lots of libraries that provide keyboard shortcuts for web apps, but most of them are somewhat heavy and depend on extra dependencies. I wanted to create a simple and lightweight package that provided this functionality without any dependencies and made with vanilla JS, so it could be integrated into any web project.

## Installation

You can install hotkeypad via npm, pnpm or yarn. Here's how you can do it with npm:

```bash
npm install hotkeypad
```

## Usage

To use HotKeyPad, you need to import the package and create a new instance of the HotKeyPad class. You can then add commands to the keypad and display it on your web app.

First, add thee following tag to your page:
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
    icon: `#custom-icon-print#`, // You can insert your own icon here, being and svg, image or font icon
    hotkey: `${hotKeyPad.activationKey} + P`, // You can use the default activation key or set your own
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
The default activation key is `Ctrl` for Windows/Linux and `Cmd` for Mac.

## Features

- Keyboard navigation
- Customizable commands
- Light and dark mode support
- Customizable colors with CSS variables
- Customizable activation key

## Attributes
You can pass the following attributes to the `HotKeyPad` constructor or to the html tag (data- prefix is required with kebab-case for the attribute name).

| Field       | Default        | Description                                             |
|-------------|----------------|---------------------------------------------------------|
| placeholder | Search command | Placeholder text for the search input.                  |
| emptyMessage | No commands found | Message to display when there are no commands.      |
| activationLetter | `K` | The activation letter for the commands. Default is `K`.       |
| closeKey | `Escape` | The key to close the keypad. Default is `Escape`.                |

## Commands Format
Array of HotKeyPadData that represent the commands that will be displayed on the keypad.

| Field     | Type     | Description                                                                 |
|-----------|----------|-----------------------------------------------------------------------------|
| id        | string   | The unique identifier of the command.                                       |
| title     | string   | The title of the command.                                                   |
| hotkey    | string   | The hotkey combination for the command. Format: `{ActivationKey}+{Letter}`  |
| handler   | Function | The function to be executed when the command is triggered.                  |
| icon      | string (optional)   | The icon of the command.                                                    |
| section   | string (optional)   | The section of the command. Allows you to group commands.                   |

## Methods

### `setCommands(commands: HotKeyPadData[]): void`
Set the commands that will be displayed on the keypad.  

### `open(): void`
Open the keypad.

### `close(): void`
Close the keypad.

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
#hotkeypad {
  --hotkeypad-bg-container: red;
}
```

## CSS HotKeyPad Parts
Allowing you to style specific elements from your style.
  
```css
#hotkeypad [data-backdrop] {}
#hotkeypad [data-container] {}
#hotkeypad [data-sections] {}
#hotkeypad [data-section] {}
#hotkeypad [data-empty] {}
#hotkeypad [data-hotkey] {}
#hotkeypad [data-hotkey][data-active] {}
```

## Icons
You can use any icon library or custom icons. You can use the `icon` field to set the icon of the command. You can use an image, svg or font icon:
- `<svg ...><path d="..." /></svg>`
- `<img src="path/to/image.png" alt="Title" />`
- `<i class="material-icons">print</i>`

By default will use the [Simple Icons](https://simpleicons.org/) library as this: `<img src="https://cdn.simpleicons.org/{icon}" alt="{title}" />` if you pass a normal name instead of the any previous mentioned tags.

## License

Copyright (c) [Jesus Borrero](https://me.jesubohrdev.com).

Licensed under the [MIT License](LICENSE)
