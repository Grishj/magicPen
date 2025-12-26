# Epic Pen - Screen Annotation Extension

🖊️ Draw, highlight, and annotate on any webpage with pen, shapes, and highlighter tools.

## Installation

### Chrome / Edge (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `Epicpen` folder
6. The Epic Pen icon will appear in your toolbar!

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file from the `Epicpen` folder

## Features

| Feature | Description |
|---------|-------------|
| ✏️ **Pen Tool** | Freehand drawing with adjustable stroke width and color |
| 🖍️ **Highlighter** | Semi-transparent highlight brush for emphasizing content |
| 🧹 **Eraser** | Remove individual strokes or clear all drawings |
| 📏 **Line Tool** | Draw straight lines with click and drag |
| ⭕ **Circle Tool** | Draw circles and ellipses |
| ▢ **Rectangle Tool** | Draw rectangles and squares |
| ➡️ **Arrow Tool** | Draw arrows for pointing |
| 📝 **Text Tool** | Add text annotations anywhere |
| 🎨 **Color Palette** | 11 preset colors + custom color picker |
| ↩️ **Undo/Redo** | Easily correct mistakes |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Toggle drawing mode on/off |
| `Alt + P` | Select Pen tool |
| `Alt + H` | Select Highlighter tool |
| `Alt + E` | Select Eraser tool |
| `Alt + Z` | Undo last stroke |
| `Alt + X` | Clear all drawings |
| `Ctrl + Z` | Undo (while drawing) |
| `Ctrl + Shift + Z` | Redo (while drawing) |
| `Escape` | Exit drawing mode |

### Customizing Shortcuts

To customize keyboard shortcuts:
1. Go to `chrome://extensions/shortcuts`
2. Find "Epic Pen - Screen Annotation"
3. Click the pencil icon next to any shortcut
4. Press your desired key combination

## Usage

1. **Click the Epic Pen icon** in your browser toolbar
2. **Click "Enable"** to activate drawing mode
3. **Select a tool** from the toolbar (Pen, Highlighter, Eraser, Shapes)
4. **Choose a color** from the palette
5. **Adjust stroke size** using the slider
6. **Start drawing** on the webpage!
7. **Press Escape** or click "Enabled" again to exit drawing mode

## Tips

- 💡 Use the **highlighter** at lower stroke sizes for cleaner highlighting
- 💡 Hold **Shift** while drawing shapes for perfect squares/circles (coming soon)
- 💡 Drawings are **per-page** and will clear when you navigate away
- 💡 Use **Undo (Alt+Z)** to fix mistakes quickly
- 💡 The **Text tool** prompts you for text input when you click

## Settings

Access settings by clicking the **⚙️ Settings** link in the popup, or right-click the extension icon → Options.

### Available Settings

- **Default Tool**: Choose which tool is selected when you activate drawing mode
- **Default Color**: Set your preferred starting color
- **Default Stroke Size**: Set your preferred stroke width
- **Confirm Clear**: Toggle confirmation dialog before clearing all drawings
- **Show Status Indicator**: Toggle the on-screen status when drawing mode is active

## Troubleshooting

### Extension not working on some sites?

Some websites (like `chrome://` pages, the Chrome Web Store, and some banking sites) block extensions for security. Try on a regular webpage.

### Keyboard shortcuts not working?

1. Make sure the webpage is focused (click somewhere on the page)
2. Check if another extension is using the same shortcut
3. Try customizing the shortcuts at `chrome://extensions/shortcuts`

### Drawings disappearing?

Drawings are temporary and will clear when you navigate away from the page. This is by design to keep pages clean.

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ⚠️ Manifest V2 version needed |
| Safari | ❌ Not yet supported |

## License

MIT License - Feel free to use, modify, and distribute!

---

Made with ❤️ for productivity
