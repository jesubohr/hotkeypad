# Contributing to HotKeyPad

Thank you for your interest in contributing to HotKeyPad! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites
- Node.js (v20.6 or higher)
- pnpm

### Installation

```bash
git clone https://github.com/jesubohr/hotkeypad.git
cd hotkeypad
pnpm install --frozen-lockfile
```

### Building

```bash
pnpm build
```

This compiles TypeScript and copies the package styles to `dist/`. The build script works on Windows, macOS, and Linux.

### Checks and tests

Run the TypeScript check and test suite before opening a pull request:

```bash
pnpm check
pnpm test
pnpm test:package
```

`pnpm test` builds the package before it runs the Node test suite.
`pnpm test:package` creates a local archive, then checks imports, declarations, and styles from the unpacked package. It requires pnpm and tar on your PATH. It writes its output to `.package-check/`.

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
4. Run `pnpm check` and `pnpm test`
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
