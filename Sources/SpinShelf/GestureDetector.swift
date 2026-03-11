import AppKit
import Combine
import CoreGraphics

/// CGEventTapでキーボードショートカットを検知（設定可能）
final class GestureDetector {
    enum Direction {
        case left
        case right
    }

    var onSwipe: ((Direction) -> Void)?

    private var eventTap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var scrollMonitor: Any?
    private var lastScrollTime: CFAbsoluteTime = 0
    private let scrollCooldown: CFAbsoluteTime = 0.5
    private var cancellables = Set<AnyCancellable>()

    func start() {
        startEventTap()
        startScrollMonitor()

        // 設定変更を監視してログ出力
        SettingsManager.shared.$rotateLeftShortcut
            .merge(with: SettingsManager.shared.$rotateRightShortcut.map { _ in
                SettingsManager.shared.rotateLeftShortcut
            })
            .sink { _ in
                NSLog(
                    "[SpinShelf] Shortcuts updated: Left=%@ Right=%@",
                    SettingsManager.shared.rotateLeftShortcut.displayString,
                    SettingsManager.shared.rotateRightShortcut.displayString
                )
            }
            .store(in: &cancellables)
    }

    func stop() {
        if let tap = eventTap {
            CGEvent.tapEnable(tap: tap, enable: false)
            if let source = runLoopSource {
                CFRunLoopRemoveSource(CFRunLoopGetCurrent(), source, .commonModes)
            }
            eventTap = nil
            runLoopSource = nil
        }
        if let monitor = scrollMonitor {
            NSEvent.removeMonitor(monitor)
            scrollMonitor = nil
        }
        cancellables.removeAll()
    }

    // MARK: - CGEventTap

    private func startEventTap() {
        let refcon = Unmanaged.passUnretained(self).toOpaque()

        guard
            let tap = CGEvent.tapCreate(
                tap: .cgSessionEventTap,
                place: .headInsertEventTap,
                options: .defaultTap,
                eventsOfInterest: CGEventMask(1 << CGEventType.keyDown.rawValue),
                callback: { _, _, event, refcon -> Unmanaged<CGEvent>? in
                    guard let refcon else { return Unmanaged.passUnretained(event) }
                    let detector = Unmanaged<GestureDetector>.fromOpaque(refcon)
                        .takeUnretainedValue()
                    return detector.handleKeyEvent(event)
                },
                userInfo: refcon
            )
        else {
            NSLog("[SpinShelf] Failed to create CGEventTap. Check Accessibility permission.")
            return
        }

        eventTap = tap
        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)

        let settings = SettingsManager.shared
        NSLog(
            "[SpinShelf] Input monitoring started (Left: %@, Right: %@)",
            settings.rotateLeftShortcut.displayString,
            settings.rotateRightShortcut.displayString
        )
    }

    private func handleKeyEvent(_ event: CGEvent) -> Unmanaged<CGEvent>? {
        let keyCode = UInt16(event.getIntegerValueField(.keyboardEventKeycode))
        let flags = event.flags

        // 修飾キーだけ抽出（Caps Lock等を除外）
        let relevantFlags =
            flags.rawValue
            & (CGEventFlags.maskControl.rawValue | CGEventFlags.maskAlternate.rawValue
                | CGEventFlags.maskShift.rawValue | CGEventFlags.maskCommand.rawValue)

        let settings = SettingsManager.shared

        // Rotate Left チェック
        let leftShortcut = settings.rotateLeftShortcut
        if keyCode == leftShortcut.keyCode && relevantFlags == UInt64(leftShortcut.modifiers) {
            NSLog("[SpinShelf] %@ detected", leftShortcut.displayString)
            onSwipe?(.left)
            return nil
        }

        // Rotate Right チェック
        let rightShortcut = settings.rotateRightShortcut
        if keyCode == rightShortcut.keyCode && relevantFlags == UInt64(rightShortcut.modifiers) {
            NSLog("[SpinShelf] %@ detected", rightShortcut.displayString)
            onSwipe?(.right)
            return nil
        }

        return Unmanaged.passUnretained(event)
    }

    // MARK: - Scroll

    private func startScrollMonitor() {
        scrollMonitor = NSEvent.addGlobalMonitorForEvents(matching: .scrollWheel) {
            [weak self] event in
            guard let self else { return }

            // Rotate Rightのショートカットの修飾キーと同じものを使う
            let settings = SettingsManager.shared
            let requiredMods = settings.rotateRightShortcut.modifiers
            let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)

            var eventMods: UInt64 = 0
            if flags.contains(.control) { eventMods |= CGEventFlags.maskControl.rawValue }
            if flags.contains(.option) { eventMods |= CGEventFlags.maskAlternate.rawValue }
            if flags.contains(.shift) { eventMods |= CGEventFlags.maskShift.rawValue }
            if flags.contains(.command) { eventMods |= CGEventFlags.maskCommand.rawValue }

            guard eventMods == UInt64(requiredMods) else { return }

            let now = CFAbsoluteTimeGetCurrent()
            guard now - self.lastScrollTime >= self.scrollCooldown else { return }

            let deltaX = event.scrollingDeltaX
            guard abs(deltaX) > 10, abs(deltaX) > abs(event.scrollingDeltaY) * 2 else { return }

            self.lastScrollTime = now
            if deltaX > 0 {
                self.onSwipe?(.left)
            } else {
                self.onSwipe?(.right)
            }
        }
    }
}
