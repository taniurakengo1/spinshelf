import Carbon.HIToolbox
import SwiftUI

struct SettingsView: View {
    @ObservedObject var settings = SettingsManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Text("Settings")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 16)

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Keyboard Shortcuts
                    settingsSection("Keyboard Shortcuts") {
                        shortcutRow(
                            icon: "arrow.left",
                            label: "Rotate Left",
                            shortcut: $settings.rotateLeftShortcut
                        )
                        shortcutRow(
                            icon: "arrow.right",
                            label: "Rotate Right",
                            shortcut: $settings.rotateRightShortcut
                        )
                    }

                    // General
                    settingsSection("General") {
                        Toggle(isOn: $settings.launchAtLogin) {
                            HStack(spacing: 8) {
                                Image(systemName: "power")
                                    .foregroundColor(.blue)
                                    .frame(width: 20)
                                Text("Launch at login")
                            }
                        }
                        .toggleStyle(.switch)
                    }
                }
                .padding(24)
            }
        }
        .frame(width: 420, height: 320)
    }

    @ViewBuilder
    private func settingsSection<Content: View>(
        _ title: String, @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundColor(.secondary)
            VStack(spacing: 8) {
                content()
            }
        }
    }

    @ViewBuilder
    private func shortcutRow(
        icon: String,
        label: String,
        shortcut: Binding<SettingsManager.Shortcut>
    ) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)
            Text(label)
            Spacer()
            ShortcutRecorderView(shortcut: shortcut)
                .frame(width: 140, height: 28)
        }
    }
}

/// ショートカット入力用のNSViewRepresentable
struct ShortcutRecorderView: NSViewRepresentable {
    @Binding var shortcut: SettingsManager.Shortcut

    func makeNSView(context: Context) -> ShortcutRecorderNSView {
        let view = ShortcutRecorderNSView()
        view.shortcut = shortcut
        view.onShortcutChanged = { newShortcut in
            shortcut = newShortcut
        }
        return view
    }

    func updateNSView(_ nsView: ShortcutRecorderNSView, context: Context) {
        nsView.shortcut = shortcut
        nsView.updateDisplay()
    }
}

final class ShortcutRecorderNSView: NSView {
    var shortcut: SettingsManager.Shortcut = .init(keyCode: 0, modifiers: 0)
    var onShortcutChanged: ((SettingsManager.Shortcut) -> Void)?

    private let label = NSTextField(labelWithString: "")
    private var isRecording = false
    private var monitor: Any?
    private var trackingArea: NSTrackingArea?

    override init(frame: NSRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        wantsLayer = true
        layer?.cornerRadius = 6
        layer?.borderWidth = 1
        updateBorder()

        label.alignment = .center
        label.font = .systemFont(ofSize: 12, weight: .medium)
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(label)

        NSLayoutConstraint.activate([
            label.centerYAnchor.constraint(equalTo: centerYAnchor),
            label.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            label.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
        ])

        updateDisplay()
    }

    private func updateBorder() {
        layer?.borderColor =
            isRecording
            ? NSColor.controlAccentColor.cgColor
            : NSColor.separatorColor.cgColor
        layer?.backgroundColor =
            isRecording
            ? NSColor.controlAccentColor.withAlphaComponent(0.05).cgColor
            : NSColor.controlBackgroundColor.cgColor
    }

    func updateDisplay() {
        if isRecording {
            label.stringValue = "Type shortcut..."
            label.textColor = .secondaryLabelColor
        } else {
            label.stringValue = shortcut.displayString
            label.textColor = .labelColor
        }
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let existing = trackingArea {
            removeTrackingArea(existing)
        }
        trackingArea = NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeInKeyWindow],
            owner: self, userInfo: nil
        )
        addTrackingArea(trackingArea!)
    }

    override func mouseDown(with event: NSEvent) {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }

    private func startRecording() {
        isRecording = true
        updateBorder()
        updateDisplay()

        monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            self?.handleKey(event)
            return nil  // イベントを消費
        }
    }

    private func stopRecording() {
        isRecording = false
        updateBorder()
        updateDisplay()

        if let monitor {
            NSEvent.removeMonitor(monitor)
        }
        monitor = nil
    }

    private func handleKey(_ event: NSEvent) {
        let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)

        // Escapeで録音キャンセル
        if event.keyCode == UInt16(kVK_Escape) {
            stopRecording()
            return
        }

        // 修飾キーが必要
        guard !flags.isEmpty else { return }

        // CGEventFlags に変換
        var cgFlags: UInt64 = 0
        if flags.contains(.control) { cgFlags |= CGEventFlags.maskControl.rawValue }
        if flags.contains(.option) { cgFlags |= CGEventFlags.maskAlternate.rawValue }
        if flags.contains(.shift) { cgFlags |= CGEventFlags.maskShift.rawValue }
        if flags.contains(.command) { cgFlags |= CGEventFlags.maskCommand.rawValue }

        shortcut = SettingsManager.Shortcut(
            keyCode: event.keyCode,
            modifiers: UInt(cgFlags)
        )
        onShortcutChanged?(shortcut)
        stopRecording()
    }
}

/// Settings ウィンドウの管理
final class SettingsWindowController {
    private var window: NSWindow?

    func show() {
        if let window, window.isVisible {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let settingsView = SettingsView()
        let hostingView = NSHostingView(rootView: settingsView)

        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 320),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        w.title = "SpinShelf Settings"
        w.contentView = hostingView
        w.center()
        w.isReleasedWhenClosed = false
        w.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        window = w
    }
}
