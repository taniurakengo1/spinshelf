import AppKit
import Carbon.HIToolbox

/// ショートカット設定の永続化
final class SettingsManager: ObservableObject {
    static let shared = SettingsManager()

    struct Shortcut: Codable, Equatable {
        var keyCode: UInt16
        var modifiers: UInt  // CGEventFlags.rawValue

        var displayString: String {
            var parts: [String] = []
            let flags = CGEventFlags(rawValue: UInt64(modifiers))
            if flags.contains(.maskControl) { parts.append("\u{2303}") }
            if flags.contains(.maskAlternate) { parts.append("\u{2325}") }
            if flags.contains(.maskShift) { parts.append("\u{21E7}") }
            if flags.contains(.maskCommand) { parts.append("\u{2318}") }
            parts.append(keyCodeToString(keyCode))
            return parts.joined()
        }

        private func keyCodeToString(_ code: UInt16) -> String {
            switch Int(code) {
            case kVK_LeftArrow: return "\u{2190}"
            case kVK_RightArrow: return "\u{2192}"
            case kVK_UpArrow: return "\u{2191}"
            case kVK_DownArrow: return "\u{2193}"
            case kVK_Return: return "\u{21A9}"
            case kVK_Space: return "\u{2423}"
            case kVK_Tab: return "\u{21E5}"
            case kVK_Delete: return "\u{232B}"
            case kVK_Escape: return "\u{238B}"
            case kVK_F1: return "F1"
            case kVK_F2: return "F2"
            case kVK_F3: return "F3"
            case kVK_F4: return "F4"
            case kVK_F5: return "F5"
            case kVK_F6: return "F6"
            case kVK_F7: return "F7"
            case kVK_F8: return "F8"
            case kVK_F9: return "F9"
            case kVK_F10: return "F10"
            case kVK_F11: return "F11"
            case kVK_F12: return "F12"
            default:
                // 通常キー: キーコードから文字を取得
                let source = TISCopyCurrentKeyboardInputSource().takeRetainedValue()
                let layoutData = TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData)
                guard let data = layoutData else { return "?" }
                let layout = unsafeBitCast(data, to: CFData.self)
                let keyLayoutPtr = CFDataGetBytePtr(layout)!
                var deadKeyState: UInt32 = 0
                var chars = [UniChar](repeating: 0, count: 4)
                var length: Int = 0
                keyLayoutPtr.withMemoryRebound(to: UCKeyboardLayout.self, capacity: 1) { ptr in
                    UCKeyTranslate(
                        ptr,
                        code, UInt16(kUCKeyActionDisplay), 0, UInt32(LMGetKbdType()),
                        UInt32(kUCKeyTranslateNoDeadKeysBit), &deadKeyState,
                        4, &length, &chars
                    )
                }
                return String(utf16CodeUnits: chars, count: length).uppercased()
            }
        }
    }

    @Published var rotateLeftShortcut: Shortcut {
        didSet { save() }
    }

    @Published var rotateRightShortcut: Shortcut {
        didSet { save() }
    }

    /// ディスプレイ巡回順序（CGDirectDisplayID の配列）。空ならX座標順（デフォルト）
    @Published var displayOrder: [UInt32] = [] {
        didSet { saveDisplayOrder() }
    }

    @Published var launchAtLogin: Bool {
        didSet {
            UserDefaults.standard.set(launchAtLogin, forKey: "launchAtLogin")
        }
    }

    private init() {
        // デフォルト: Ctrl+Shift+←/→
        let defaultLeft = Shortcut(
            keyCode: UInt16(kVK_LeftArrow),
            modifiers: UInt(CGEventFlags.maskControl.rawValue | CGEventFlags.maskShift.rawValue)
        )
        let defaultRight = Shortcut(
            keyCode: UInt16(kVK_RightArrow),
            modifiers: UInt(CGEventFlags.maskControl.rawValue | CGEventFlags.maskShift.rawValue)
        )

        if let data = UserDefaults.standard.data(forKey: "rotateLeftShortcut"),
            let shortcut = try? JSONDecoder().decode(Shortcut.self, from: data)
        {
            rotateLeftShortcut = shortcut
        } else {
            rotateLeftShortcut = defaultLeft
        }

        if let data = UserDefaults.standard.data(forKey: "rotateRightShortcut"),
            let shortcut = try? JSONDecoder().decode(Shortcut.self, from: data)
        {
            rotateRightShortcut = shortcut
        } else {
            rotateRightShortcut = defaultRight
        }

        launchAtLogin = UserDefaults.standard.bool(forKey: "launchAtLogin")

        if let data = UserDefaults.standard.data(forKey: "displayOrder"),
            let order = try? JSONDecoder().decode([UInt32].self, from: data)
        {
            displayOrder = order
        }
    }

    private func saveDisplayOrder() {
        if let data = try? JSONEncoder().encode(displayOrder) {
            UserDefaults.standard.set(data, forKey: "displayOrder")
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(rotateLeftShortcut) {
            UserDefaults.standard.set(data, forKey: "rotateLeftShortcut")
        }
        if let data = try? JSONEncoder().encode(rotateRightShortcut) {
            UserDefaults.standard.set(data, forKey: "rotateRightShortcut")
        }
    }
}
