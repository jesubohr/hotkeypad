# Contributing to HotKeyPad

Thank you for your interest in contributing to HotKeyPad! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm, pnpm, or yarn

### Installation

```bash
git clone https://github.com/jesubohr/hotkeypad.git
cd hotkeypad
npm install
```

### Building

```bash
npm run build
```

This will compile TypeScript to the `dist/` directory.

### CSS Files

CSS files are copied separately:

```bash
npm run init-css  # Creates dist/styles directory (first time only)
npm run css       # Copies CSS files to dist/styles
```

## Project Structure

```
hotkeypad/
├── src/
│   ├── index.ts        # Main HotKeyPad class
│   ├── types.ts        # TypeScript interfaces
│   ├── utils.ts        # Helper functions
│   └── styles/
│       ├── index.css   # Main styles
│       └── reset.css   # CSS reset
├── dist/               # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Coding Standards

### TypeScript
- Use strict mode (enabled in tsconfig.json)
- Prefer `interface` over `type` for object shapes
- Use JSDoc comments for public APIs
- Avoid non-null assertions (`!`); use proper null checks

### Code Style
- No comments unless explaining complex logic (as per project convention)
- Use private fields with `#` prefix for internal state
- Use `const` for values that don't change
- Prefer early returns to reduce nesting

### Commits
- Write clear, descriptive commit messages
- Reference issues when applicable

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Build and test your changes
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

## Reporting Issues

When reporting issues, please include:
- Browser and version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Any relevant code snippets

## License

By contributing, you agree that your contributions will be licensed under the MIT License.