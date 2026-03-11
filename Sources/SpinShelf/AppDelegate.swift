import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var carouselController: CarouselController?
    private let settingsWindowController = SettingsWindowController()

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupStatusItem()

        if PermissionManager.checkAccessibility(prompt: true) {
            startCarousel()
        } else {
            PermissionManager.pollUntilGranted { [weak self] in
                self?.startCarousel()
            }
        }
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: "arrow.left.arrow.right.square",
                accessibilityDescription: "SpinShelf"
            )
        }

        rebuildMenu()

        // 設定変更時にメニューを再構築
        NotificationCenter.default.addObserver(
            forName: UserDefaults.didChangeNotification,
            object: nil, queue: .main
        ) { [weak self] _ in
            self?.rebuildMenu()
        }
    }

    private func rebuildMenu() {
        let settings = SettingsManager.shared
        let menu = NSMenu()

        // Rotate Left
        let leftItem = NSMenuItem(
            title: "Rotate Left",
            action: #selector(rotateLeft),
            keyEquivalent: ""
        )
        leftItem.image = NSImage(systemSymbolName: "arrow.left", accessibilityDescription: nil)
        setMenuShortcut(leftItem, shortcut: settings.rotateLeftShortcut)
        menu.addItem(leftItem)

        // Rotate Right
        let rightItem = NSMenuItem(
            title: "Rotate Right",
            action: #selector(rotateRight),
            keyEquivalent: ""
        )
        rightItem.image = NSImage(systemSymbolName: "arrow.right", accessibilityDescription: nil)
        setMenuShortcut(rightItem, shortcut: settings.rotateRightShortcut)
        menu.addItem(rightItem)

        menu.addItem(NSMenuItem.separator())

        // Settings
        let settingsItem = NSMenuItem(
            title: "Settings...",
            action: #selector(showSettings),
            keyEquivalent: ","
        )
        settingsItem.keyEquivalentModifierMask = .command
        settingsItem.image = NSImage(
            systemSymbolName: "gearshape", accessibilityDescription: nil)
        menu.addItem(settingsItem)

        menu.addItem(NSMenuItem.separator())

        // About
        let aboutItem = NSMenuItem(
            title: "About...",
            action: #selector(showAbout),
            keyEquivalent: ""
        )
        aboutItem.image = NSImage(
            systemSymbolName: "info.circle", accessibilityDescription: nil)
        menu.addItem(aboutItem)

        // Quit
        let quitItem = NSMenuItem(
            title: "Quit",
            action: #selector(quit),
            keyEquivalent: "q"
        )
        quitItem.keyEquivalentModifierMask = .command
        menu.addItem(quitItem)

        statusItem.menu = menu
    }

    private func setMenuShortcut(_ item: NSMenuItem, shortcut: SettingsManager.Shortcut) {
        // メニュー項目にショートカット表示を設定
        var mask: NSEvent.ModifierFlags = []
        let flags = CGEventFlags(rawValue: UInt64(shortcut.modifiers))
        if flags.contains(.maskControl) { mask.insert(.control) }
        if flags.contains(.maskAlternate) { mask.insert(.option) }
        if flags.contains(.maskShift) { mask.insert(.shift) }
        if flags.contains(.maskCommand) { mask.insert(.command) }

        item.keyEquivalentModifierMask = mask

        // keyEquivalent は表示用（矢印キーなど特殊キーはUnicode文字で表現）
        switch Int(shortcut.keyCode) {
        case 123: item.keyEquivalent = "\u{F702}"  // Left arrow
        case 124: item.keyEquivalent = "\u{F703}"  // Right arrow
        case 125: item.keyEquivalent = "\u{F701}"  // Down arrow
        case 126: item.keyEquivalent = "\u{F700}"  // Up arrow
        default:
            // 通常キーは小文字で設定
            let chars = NSEvent.characters(for: shortcut.keyCode)
            item.keyEquivalent = chars ?? ""
        }
    }

    private func startCarousel() {
        let displayManager = DisplayManager()
        let windowManager = WindowManager()
        let gestureDetector = GestureDetector()
        carouselController = CarouselController(
            displayManager: displayManager,
            windowManager: windowManager,
            gestureDetector: gestureDetector
        )
        carouselController?.start()
    }

    @objc private func rotateLeft() {
        carouselController?.rotateFromMenu(direction: .left)
    }

    @objc private func rotateRight() {
        carouselController?.rotateFromMenu(direction: .right)
    }

    @objc private func showSettings() {
        settingsWindowController.show()
    }

    @objc private func showAbout() {
        let alert = NSAlert()
        alert.messageText = "SpinShelf"
        alert.informativeText =
            "Carousel-style window rotation across multiple displays.\n\nVersion 0.1.0"
        alert.alertStyle = .informational
        alert.runModal()
    }

    @objc private func quit() {
        NSApplication.shared.terminate(nil)
    }
}

// NSEventのキーコード→文字変換ヘルパー
extension NSEvent {
    static func characters(for keyCode: UInt16) -> String? {
        let source = CGEventSource(stateID: .combinedSessionState)
        guard let event = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: true)
        else { return nil }
        let nsEvent = NSEvent(cgEvent: event)
        return nsEvent?.charactersIgnoringModifiers?.lowercased()
    }
}
