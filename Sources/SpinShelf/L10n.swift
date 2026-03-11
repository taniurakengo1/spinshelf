import Foundation

/// Localization helper using Bundle.module (SPM resource bundle)
/// CLIツールではBundle.preferredLocalizationsが正しく動かないため、
/// システム言語に対応するlprojサブバンドルを明示的にロードする
enum L10n {
    private static let bundle: Bundle = {
        let base = Bundle.module
        // システムの優先言語からバンドル内の対応lprojを探す
        for lang in Locale.preferredLanguages {
            let code = Locale(identifier: lang).language.languageCode?.identifier ?? lang
            if let path = base.path(forResource: code, ofType: "lproj"),
               let localized = Bundle(path: path) {
                return localized
            }
        }
        return base
    }()

    static func tr(_ key: String) -> String {
        NSLocalizedString(key, bundle: bundle, comment: "")
    }

    // MARK: - Settings Window

    static var settings: String { tr("settings") }
    static var displayRotationOrder: String { tr("display_rotation_order") }
    static var connectTwoOrMore: String { tr("connect_two_or_more") }
    static var clickDisplaysInOrder: String { tr("click_displays_in_order") }
    static var numbersShowOrder: String { tr("numbers_show_order") }
    static var cancel: String { tr("cancel") }
    static var done: String { tr("done") }
    static func selectedCount(_ count: Int, _ total: Int) -> String {
        String(format: tr("selected_count"), count, total)
    }
    static var identify: String { tr("identify") }
    static var setOrder: String { tr("set_order") }
    static var reset: String { tr("reset") }
    static var rotation: String { tr("rotation") }
    static var loop: String { tr("loop") }
    static var excluded: String { tr("excluded") }
    static var keyboardShortcuts: String { tr("keyboard_shortcuts") }
    static var rotateLeft: String { tr("rotate_left") }
    static var rotateRight: String { tr("rotate_right") }
    static var general: String { tr("general") }
    static var launchAtLogin: String { tr("launch_at_login") }
    static var checkForUpdates: String { tr("check_for_updates") }
    static var typeShortcut: String { tr("type_shortcut") }

    // MARK: - Menu

    static var settingsMenu: String { tr("settings_menu") }
    static var about: String { tr("about") }
    static var quit: String { tr("quit") }

    // MARK: - About

    static var aboutText: String { tr("about_text") }
}
