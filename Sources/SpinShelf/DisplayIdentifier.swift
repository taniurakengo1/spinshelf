import AppKit

/// 各物理ディスプレイの中央に大きな番号を一時表示する（Windows風 Identify）
final class DisplayIdentifier {
    private var windows: [NSWindow] = []

    func show(displays: [DisplayManager.DisplayInfo], rotationOrder: [Int]) {
        dismiss()

        for (orderIdx, displayIdx) in rotationOrder.enumerated() {
            guard displayIdx < displays.count else { continue }
            let display = displays[displayIdx]

            // CGDisplay座標（左上原点）→ NSScreen座標（左下原点）に変換
            let mainHeight = CGDisplayBounds(CGMainDisplayID()).height
            let size: CGFloat = 200
            let x = display.frame.midX - size / 2
            let y = mainHeight - display.frame.midY - size / 2

            let window = NSWindow(
                contentRect: NSRect(x: x, y: y, width: size, height: size),
                styleMask: .borderless,
                backing: .buffered,
                defer: false
            )
            window.level = .screenSaver
            window.isOpaque = false
            window.backgroundColor = .clear
            window.ignoresMouseEvents = true
            window.collectionBehavior = [.canJoinAllSpaces, .stationary]

            let label = NSTextField(labelWithString: "\(orderIdx + 1)")
            label.font = .systemFont(ofSize: 120, weight: .bold)
            label.textColor = .white
            label.alignment = .center
            label.frame = NSRect(x: 0, y: 0, width: size, height: size)

            let bg = NSView(frame: NSRect(x: 0, y: 0, width: size, height: size))
            bg.wantsLayer = true
            bg.layer?.backgroundColor = NSColor.black.withAlphaComponent(0.75).cgColor
            bg.layer?.cornerRadius = 24

            bg.addSubview(label)
            label.frame = bg.bounds
            window.contentView = bg

            window.orderFrontRegardless()
            windows.append(window)
        }

        // 3秒後に自動で消す
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.dismiss()
        }
    }

    func dismiss() {
        for w in windows {
            w.orderOut(nil)
        }
        windows.removeAll()
    }
}
