# Changelog

All notable changes to Epic Pen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-26

### Added

- **Drawing Tools**
  - Pen tool with freehand drawing
  - Highlighter tool with semi-transparent strokes
  - Eraser tool to remove individual strokes
  - Line tool for straight lines
  - Rectangle tool for boxes
  - Circle/Ellipse tool
  - Arrow tool for pointing
  - Text tool for annotations

- **Color & Styling**
  - 11 preset colors in the palette
  - Custom color picker for unlimited colors
  - Adjustable stroke size (1-30px)

- **User Interface**
  - Clean, modern popup toolbar
  - Dark theme design
  - Responsive layout
  - Accessibility support with keyboard navigation

- **Keyboard Shortcuts**
  - Alt+D: Toggle drawing mode
  - Alt+P: Select Pen
  - Alt+H: Select Highlighter
  - Alt+E: Select Eraser
  - Alt+Z: Undo
  - Alt+X: Clear all
  - Ctrl+Z: Undo (while drawing)
  - Ctrl+Shift+Z: Redo (while drawing)
  - Escape: Exit drawing mode

- **Settings**
  - Default tool preference
  - Default color preference
  - Default stroke size
  - Confirm before clearing toggle
  - Settings persistence across sessions

- **Other Features**
  - Undo/Redo support
  - Touch device support
  - Works on any webpage
  - Per-tab drawing isolation

### Technical

- Built with Manifest V3 for modern browser compatibility
- Native Canvas API for lightweight performance
- Chrome Storage API for preferences
- Chrome Commands API for keyboard shortcuts

---

## Future Plans

- [ ] Persist drawings across page refreshes
- [ ] Export drawings as images
- [ ] Shape fill option
- [ ] Text formatting options
- [ ] Floating toolbar mode
- [ ] Firefox Manifest V2 compatibility
- [ ] Safari support
