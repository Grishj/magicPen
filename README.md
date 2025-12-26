# 🖊️ Magic Pen - Screen Annotation Extension

A powerful Chrome/Edge extension that lets you draw, highlight, and annotate directly on any webpage.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

### 🎨 Drawing Tools
| Tool | Description |
|------|-------------|
| **Select** | Click to select any drawing, drag to move it |
| **Pen** | Freehand drawing with smooth strokes |
| **Highlighter** | Semi-transparent highlighting (40% opacity) |
| **Eraser** | Remove drawings by clicking/dragging over them |
| **Line** | Draw straight lines |
| **Rectangle** | Draw rectangles and squares |
| **Circle** | Draw circles and ellipses |
| **Arrow** | Draw arrows with arrowheads |
| **Text** | Add text annotations anywhere |

### 🎯 Key Features
- **Move & Edit** - Select any drawing and drag to reposition
- **Sticky Drawings** - Drawings stay attached to page content when scrolling
- **Dynamic Selection** - Selection highlight adapts to background (white on dark, blue on light)
- **Color Picker** - 11 preset colors + custom color picker
- **Adjustable Stroke** - Size from 1px to 30px
- **Undo/Redo** - Full history support
- **Keyboard Shortcuts** - Quick access to common actions

---

## 📦 Installation

### From Source (Developer Mode)

1. **Download/Clone** the extension folder to your computer

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `Epicpen` folder

5. **Pin the Extension** (recommended)
   - Click the puzzle icon in Chrome toolbar
   - Click the pin icon next to "Magic Pen"

---

## 🚀 Quick Start

1. **Click** the Magic Pen icon in your browser toolbar
2. **Click "Enable"** to activate drawing mode
3. **Select a tool** from the toolbar
4. **Choose a color** and stroke size
5. **Draw** on the page!
6. Press **Escape** or click "Enable" again to exit

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Toggle drawing mode on/off |
| `Alt + P` | Select Pen tool |
| `Alt + E` | Select Eraser tool |
| `Alt + Z` | Undo last action |
| `Ctrl + Z` | Undo (while drawing) |
| `Ctrl + Shift + Z` | Redo (while drawing) |
| `Delete` / `Backspace` | Delete selected element |
| `Escape` | Deselect or exit drawing mode |

> 💡 **Tip:** Customize shortcuts at `chrome://extensions/shortcuts`

---

## 🛠️ Tools Guide

### Select Tool
- Click on any drawing to select it (blue dashed border appears)
- Drag to move the selected element
- Change color/size to update the selected element
- Press Delete to remove it

### Text Tool
- Click where you want text
- Type in the input box
- Press **Enter** to confirm or **Escape** to cancel
- Click outside to auto-save

### Eraser Tool
- Click or drag over drawings to erase them
- Eraser size is based on stroke size setting

### Shape Tools (Line, Rectangle, Circle, Arrow)
- Click and drag to draw the shape
- Release to complete

---

## ⚙️ Settings

Access settings by clicking the ⚙️ icon in the popup or pressing `Alt + O`.

### Configurable Options:
- **Default Tool** - Starting tool when extension activates
- **Default Color** - Your preferred starting color
- **Default Stroke Size** - Starting stroke width
- **Confirm Clear** - Ask before clearing all drawings
- **Show Status** - Display indicator when active

---

## 📁 Project Structure

```
Epicpen/
├── manifest.json          # Extension configuration
├── README.md              # This file
├── icons/                 # Extension icons
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
├── popup/                 # Toolbar popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Page injection scripts
│   ├── canvas.js          # Main drawing engine
│   └── content.css
├── background/            # Service worker
│   └── background.js
└── settings/              # Options page
    ├── settings.html
    ├── settings.css
    └── settings.js
```

---

## 🔧 Technical Details

- **Manifest Version:** 3 (MV3)
- **Canvas API:** Native HTML5 Canvas for performance
- **Storage:** Chrome Storage API for settings persistence
- **Permissions:** `activeTab`, `storage`, `scripting`

---

## ❓ Troubleshooting

### Extension not working on a page?
- Refresh the page after installing/updating
- Some pages (like `chrome://` URLs) don't allow extensions
- Check if the page uses iframes (content scripts don't inject into iframes by default)

### Drawings disappear on scroll?
- This is fixed in v1.0.0 - drawings now stick to content
- If still happening, reload the extension and refresh the page

### Keyboard shortcuts not working?
- Click on the page first to give it focus
- Check `chrome://extensions/shortcuts` for conflicts

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

Made with ❤️ for productivity
