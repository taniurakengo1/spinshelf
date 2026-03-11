import Carbon.HIToolbox
import SwiftUI

struct SettingsView: View {
    @ObservedObject var settings = SettingsManager.shared
    @State private var displays: [DisplayManager.DisplayInfo] = []
    /// 巡回順（displaysのインデックスを並べた配列）
    @State private var rotationOrder: [Int] = []
    /// クリックで順番設定中かどうか
    @State private var isSettingOrder = false
    /// クリックで設定中の順番（設定中に積み上げる）
    @State private var pendingOrder: [Int] = []

    private let identifier = DisplayIdentifier()
    private let updateChecker = UpdateChecker()

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Text(L10n.settings)
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 16)

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Display Layout & Order
                    settingsSection(L10n.displayRotationOrder) {
                        if displays.count < 2 {
                            HStack(spacing: 8) {
                                Image(systemName: "display")
                                    .foregroundColor(.secondary)
                                    .frame(width: 20)
                                Text(L10n.connectTwoOrMore)
                                    .foregroundColor(.secondary)
                            }
                        } else {
                            // 説明テキスト
                            if isSettingOrder {
                                Text(L10n.clickDisplaysInOrder)
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            } else {
                                Text(L10n.numbersShowOrder)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            // ディスプレイ配置図（クリック可能）
                            DisplayLayoutView(
                                displays: displays,
                                rotationOrder: isSettingOrder ? pendingOrder : rotationOrder,
                                isSettingOrder: isSettingOrder,
                                onClickDisplay: { displayIdx in
                                    handleDisplayClick(displayIdx)
                                }
                            )
                            .frame(height: 160)
                            .frame(maxWidth: .infinity)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color(nsColor: .controlBackgroundColor))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(isSettingOrder ? Color.blue : Color.clear, lineWidth: 2)
                            )

                            // ボタン行
                            HStack(spacing: 12) {
                                if isSettingOrder {
                                    Button(L10n.cancel) {
                                        isSettingOrder = false
                                        pendingOrder = []
                                    }
                                    .buttonStyle(.bordered)

                                    Button(L10n.done) {
                                        applyPendingOrder()
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(pendingOrder.count < 2)

                                    Spacer()

                                    Text(L10n.selectedCount(pendingOrder.count, displays.count))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                } else {
                                    // Identify ボタン
                                    Button(action: {
                                        identifier.show(
                                            displays: displays,
                                            rotationOrder: rotationOrder
                                        )
                                    }) {
                                        Label(L10n.identify, systemImage: "display.trianglebadge.exclamationmark")
                                    }
                                    .buttonStyle(.bordered)

                                    // Set Order ボタン
                                    Button(action: {
                                        isSettingOrder = true
                                        pendingOrder = []
                                    }) {
                                        Label(L10n.setOrder, systemImage: "arrow.triangle.2.circlepath")
                                    }
                                    .buttonStyle(.bordered)

                                    Spacer()

                                    // Reset
                                    Button(L10n.reset) {
                                        settings.displayOrder = []
                                        loadDisplays()
                                    }
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                }
                            }

                            // 現在の巡回順（テキスト表示）
                            if !isSettingOrder {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 4) {
                                        Text(L10n.rotation)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        ForEach(Array(rotationOrder.enumerated()), id: \.offset) { orderIdx, _ in
                                            if orderIdx > 0 {
                                                Image(systemName: "arrow.right")
                                                    .font(.system(size: 8))
                                                    .foregroundColor(.secondary)
                                            }
                                            ZStack {
                                                Circle()
                                                    .fill(colorForOrder(orderIdx))
                                                    .frame(width: 20, height: 20)
                                                Text("\(orderIdx + 1)")
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(.white)
                                            }
                                        }
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 8))
                                            .foregroundColor(.secondary)
                                        ZStack {
                                            Circle()
                                                .fill(colorForOrder(0))
                                                .frame(width: 20, height: 20)
                                            Text("\(1)")
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundColor(.white)
                                        }
                                        .opacity(0.5)
                                        Text(L10n.loop)
                                            .font(.system(size: 9))
                                            .foregroundColor(.secondary)
                                    }
                                    // 除外ディスプレイ
                                    let excluded = (0..<displays.count).filter { !rotationOrder.contains($0) }
                                    if !excluded.isEmpty {
                                        HStack(spacing: 4) {
                                            Text(L10n.excluded)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                            ForEach(excluded, id: \.self) { idx in
                                                Text(displayLabel(displays[idx]))
                                                    .font(.caption)
                                                    .foregroundColor(.secondary)
                                                    .padding(.horizontal, 6)
                                                    .padding(.vertical, 2)
                                                    .background(
                                                        RoundedRectangle(cornerRadius: 4)
                                                            .fill(Color.gray.opacity(0.15))
                                                    )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Keyboard Shortcuts
                    settingsSection(L10n.keyboardShortcuts) {
                        shortcutRow(
                            icon: "arrow.left",
                            label: L10n.rotateLeft,
                            shortcut: $settings.rotateLeftShortcut
                        )
                        shortcutRow(
                            icon: "arrow.right",
                            label: L10n.rotateRight,
                            shortcut: $settings.rotateRightShortcut
                        )
                    }
                    .disabled(isSettingOrder)
                    .opacity(isSettingOrder ? 0.4 : 1)

                    // General
                    settingsSection(L10n.general) {
                        Toggle(isOn: $settings.launchAtLogin) {
                            HStack(spacing: 8) {
                                Image(systemName: "power")
                                    .foregroundColor(.blue)
                                    .frame(width: 20)
                                Text(L10n.launchAtLogin)
                            }
                        }
                        .toggleStyle(.switch)

                        // Check for Updates
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .foregroundColor(.blue)
                                .frame(width: 20)
                            Button(L10n.checkForUpdates) {
                                updateChecker.check()
                            }
                            .buttonStyle(.link)
                        }
                        .padding(.leading, 2)
                    }
                    .disabled(isSettingOrder)
                    .opacity(isSettingOrder ? 0.4 : 1)
                }
                .padding(24)
            }
        }
        .frame(width: 460, height: 580)
        .onAppear { loadDisplays() }
        .onReceive(NotificationCenter.default.publisher(
            for: NSApplication.didChangeScreenParametersNotification
        )) { _ in
            loadDisplays()
        }
    }

    private func handleDisplayClick(_ displayIdx: Int) {
        guard isSettingOrder else { return }
        if let idx = pendingOrder.firstIndex(of: displayIdx) {
            // 既に選択済み → 選択解除（最後の1つだけ解除可能）
            if idx == pendingOrder.count - 1 {
                pendingOrder.removeLast()
            }
        } else {
            pendingOrder.append(displayIdx)
            // 全ディスプレイ選択で自動確定
            if pendingOrder.count == displays.count {
                applyPendingOrder()
            }
        }
    }

    private func applyPendingOrder() {
        guard pendingOrder.count >= 2 else { return }
        rotationOrder = pendingOrder
        settings.displayOrder = pendingOrder.map { displays[$0].id }
        isSettingOrder = false
        pendingOrder = []
        identifier.show(displays: displays, rotationOrder: rotationOrder)
    }

    private func displayLabel(_ display: DisplayManager.DisplayInfo) -> String {
        let w = Int(display.frame.width)
        let h = Int(display.frame.height)
        let main = display.id == CGMainDisplayID() ? " (Main)" : ""
        return "\(w)×\(h)\(main)"
    }

    private func colorForOrder(_ index: Int) -> Color {
        let colors: [Color] = [.blue, .green, .orange, .purple, .pink, .red]
        return colors[index % colors.count]
    }

    private func loadDisplays() {
        var displayIDs = [CGDirectDisplayID](repeating: 0, count: 16)
        var displayCount: UInt32 = 0
        CGGetActiveDisplayList(16, &displayIDs, &displayCount)

        let all: [DisplayManager.DisplayInfo] = (0..<Int(displayCount)).map { i in
            let id = displayIDs[i]
            let bounds = CGDisplayBounds(id)
            return DisplayManager.DisplayInfo(id: id, frame: bounds, visibleFrame: bounds)
        }
        .sorted { $0.frame.origin.x < $1.frame.origin.x }

        displays = all

        let savedOrder = settings.displayOrder
        if !savedOrder.isEmpty {
            var order: [Int] = []
            for savedID in savedOrder {
                if let idx = all.firstIndex(where: { $0.id == savedID }) {
                    order.append(idx)
                }
            }
            for i in 0..<all.count where !order.contains(i) {
                order.append(i)
            }
            rotationOrder = order
        } else {
            rotationOrder = Array(0..<all.count)
        }
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

/// ディスプレイ配置をミニチュア描画（クリックで順番設定可能）
struct DisplayLayoutView: View {
    let displays: [DisplayManager.DisplayInfo]
    let rotationOrder: [Int]
    var isSettingOrder: Bool = false
    var onClickDisplay: ((Int) -> Void)? = nil

    var body: some View {
        GeometryReader { geo in
            let layout = calcLayout(in: geo.size)
            ForEach(Array(displays.enumerated()), id: \.element.id) { i, display in
                let rect = layout.rects[i]
                let orderIndex = rotationOrder.firstIndex(of: i)
                let hasOrder = orderIndex != nil
                let color = hasOrder ? colorForOrder(orderIndex!) : Color.gray

                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(color.opacity(hasOrder ? 0.15 : 0.05))
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(color, lineWidth: hasOrder ? 2.5 : 1)

                    VStack(spacing: 3) {
                        if hasOrder {
                            ZStack {
                                Circle()
                                    .fill(color)
                                    .frame(width: 28, height: 28)
                                Text("\(orderIndex! + 1)")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        } else {
                            ZStack {
                                Circle()
                                    .stroke(Color.gray, lineWidth: 2)
                                    .frame(width: 28, height: 28)
                                Text("?")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.gray)
                            }
                        }
                        Text("\(Int(display.frame.width))×\(Int(display.frame.height))")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                        if display.id == CGMainDisplayID() {
                            Text("Main")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(color)
                        }
                    }
                }
                .frame(width: rect.width, height: rect.height)
                .offset(x: rect.origin.x, y: rect.origin.y)
                .onTapGesture {
                    onClickDisplay?(i)
                }
                .opacity(isSettingOrder && hasOrder ? 0.6 : 1.0)
            }
        }
    }

    private func colorForOrder(_ index: Int) -> Color {
        let colors: [Color] = [.blue, .green, .orange, .purple, .pink, .red]
        return colors[index % colors.count]
    }

    private struct Layout {
        var rects: [CGRect]
    }

    private func calcLayout(in size: CGSize) -> Layout {
        guard !displays.isEmpty else { return Layout(rects: []) }

        let allFrames = displays.map { $0.frame }
        let minX = allFrames.map(\.minX).min()!
        let minY = allFrames.map(\.minY).min()!
        let maxX = allFrames.map(\.maxX).max()!
        let maxY = allFrames.map(\.maxY).max()!
        let totalW = maxX - minX
        let totalH = maxY - minY

        let padding: CGFloat = 20
        let availW = size.width - padding * 2
        let availH = size.height - padding * 2
        let scale = min(availW / totalW, availH / totalH)

        let scaledTotalW = totalW * scale
        let scaledTotalH = totalH * scale
        let offsetX = padding + (availW - scaledTotalW) / 2
        let offsetY = padding + (availH - scaledTotalH) / 2

        let rects = displays.map { d -> CGRect in
            CGRect(
                x: offsetX + (d.frame.origin.x - minX) * scale,
                y: offsetY + (d.frame.origin.y - minY) * scale,
                width: d.frame.width * scale,
                height: d.frame.height * scale
            )
        }

        return Layout(rects: rects)
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
            label.stringValue = L10n.typeShortcut
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
            contentRect: NSRect(x: 0, y: 0, width: 460, height: 580),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        w.title = "SpinShelf \(L10n.settings)"
        w.contentView = hostingView
        w.center()
        w.isReleasedWhenClosed = false
        w.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        window = w
    }
}
