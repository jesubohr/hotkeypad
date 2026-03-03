# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-03-03

### Added
- `destroy()` method for proper cleanup of event listeners and observers
- JSDoc documentation for all public methods and interfaces
- Accessibility attributes (`role="dialog"`, `aria-modal`, `aria-expanded`, `aria-label`)
- `isDestroyed` getter to check instance state
- Fallback for external icon loading failures (displays first letter of title)

### Fixed
- Memory leak: MutationObserver now properly disconnects on destroy
- Memory leak: Event listeners now properly removed with stored references
- TypeScript: Updated `moduleResolution` from `node10` to `bundler`
- TypeScript: Added proper generic constraints to `createListener`
- TypeScript: Replaced all non-null assertions with proper null checks
- `extractHotkeyLetter` now returns `null` for invalid input instead of empty string

### Changed
- Internal event listeners stored for proper cleanup
- Improved type safety throughout codebase

## [1.0.1] - Previous Release

### Added
- Initial release
- Keyboard navigation support
- Customizable commands
- Light and dark mode support
- CSS variable customization
- Customizable activation key
- Search functionality
- Section grouping for commands