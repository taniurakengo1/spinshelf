# SpinShelf

A macOS menu bar app that rotates all windows across multiple displays in a carousel pattern.

Unlike typical window managers that move individual windows, SpinShelf shifts **every window** to the next display simultaneously — like a merry-go-round.

## Features

- **Carousel rotation** — All windows rotate one display to the left or right
- **Configurable keyboard shortcuts** — Default: `Ctrl+Shift+←/→`, changeable in Settings
- **Resolution-aware** — Same resolution displays: instant position-only move. Different resolutions: fade + proportional resize
- **Z-order aware** — Foreground windows move first for a smoother visual experience
- **Menu bar app** — Runs silently in the menu bar, no Dock icon
- **Display hotplug** — Automatically detects when displays are connected or disconnected

## Requirements

- macOS 13.0 (Ventura) or later
- Two or more displays
- Accessibility permission (required for window manipulation)

## Installation

### Homebrew

```bash
brew tap taniurakengo1/tap
brew install spinshelf
spinshelf
```

### Build from source

```bash
git clone https://github.com/taniurakengo1/spinshelf.git
cd spinshelf
swift build
swift run
```

> **Note:** Xcode Command Line Tools are required. Install with `xcode-select --install` if needed.

### First launch

1. SpinShelf will request Accessibility permission on first launch
2. Go to **System Settings → Privacy & Security → Accessibility**
3. Click **+** and add the SpinShelf binary
4. Toggle it **ON**

## Usage

### Keyboard shortcuts

| Action | Default shortcut |
|---|---|
| Rotate Left | `Ctrl+Shift+←` |
| Rotate Right | `Ctrl+Shift+→` |

Shortcuts can be changed in **Settings** (click the menu bar icon → Settings...).

### Menu bar

Click the SpinShelf icon in the menu bar to:
- Rotate Left / Rotate Right
- Open Settings
- Quit

## How it works

SpinShelf uses the macOS Accessibility API (`AXUIElement`) to enumerate and reposition windows. When a rotation is triggered:

1. All visible windows are grouped by their current display
2. Each window's target display is calculated (one step left or right, wrapping around)
3. Foreground windows are moved first, background windows follow
4. For same-resolution displays, only the position is changed (no resize needed)
5. For different-resolution displays, a 3-step move is performed (shrink → move → resize) with a fade effect

## Technical notes

### Private API usage

SpinShelf uses the following Apple private APIs for smooth window transitions:

- `CGSMainConnectionID` / `CGSSetWindowAlpha` — Window fade effects during cross-resolution moves
- `_AXUIElementGetWindow` — Mapping AXUIElement to CGWindowID for z-order detection

These APIs are undocumented and may break in future macOS versions. **This app cannot be distributed on the Mac App Store** due to private API usage.

### Accessibility permission

SpinShelf requires full Accessibility access to read and modify window positions. It does **not** collect, store, or transmit any window content or titles. The permission is used solely for window enumeration and repositioning.

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

[MIT License](LICENSE)
