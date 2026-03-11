import Carbon.HIToolbox
import XCTest

@testable import SpinShelfLib

final class SettingsManagerTests: XCTestCase {

    // MARK: - Shortcut encoding/decoding

    func testShortcutRoundTrip() throws {
        let original = SettingsManager.Shortcut(
            keyCode: UInt16(kVK_LeftArrow),
            modifiers: UInt(CGEventFlags.maskControl.rawValue | CGEventFlags.maskShift.rawValue)
        )

        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(SettingsManager.Shortcut.self, from: data)

        XCTAssertEqual(decoded.keyCode, original.keyCode)
        XCTAssertEqual(decoded.modifiers, original.modifiers)
    }

    func testShortcutDisplayString_controlShiftLeft() {
        let shortcut = SettingsManager.Shortcut(
            keyCode: UInt16(kVK_LeftArrow),
            modifiers: UInt(CGEventFlags.maskControl.rawValue | CGEventFlags.maskShift.rawValue)
        )
        let display = shortcut.displayString
        // Should contain control (⌃) and shift (⇧) symbols and left arrow (←)
        XCTAssertTrue(display.contains("\u{2303}"), "Should contain control symbol")
        XCTAssertTrue(display.contains("\u{21E7}"), "Should contain shift symbol")
        XCTAssertTrue(display.contains("\u{2190}"), "Should contain left arrow")
    }

    func testShortcutDisplayString_commandRight() {
        let shortcut = SettingsManager.Shortcut(
            keyCode: UInt16(kVK_RightArrow),
            modifiers: UInt(CGEventFlags.maskCommand.rawValue)
        )
        let display = shortcut.displayString
        XCTAssertTrue(display.contains("\u{2318}"), "Should contain command symbol")
        XCTAssertTrue(display.contains("\u{2192}"), "Should contain right arrow")
    }

    func testShortcutEquality() {
        let a = SettingsManager.Shortcut(keyCode: 123, modifiers: 456)
        let b = SettingsManager.Shortcut(keyCode: 123, modifiers: 456)
        let c = SettingsManager.Shortcut(keyCode: 124, modifiers: 456)

        XCTAssertEqual(a, b)
        XCTAssertNotEqual(a, c)
    }
}
