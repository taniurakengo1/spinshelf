import CoreGraphics
import XCTest

@testable import SpinShelfLib

final class DisplayManagerTests: XCTestCase {

    private func makeDisplay(id: UInt32, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat)
        -> DisplayManager.DisplayInfo
    {
        DisplayManager.DisplayInfo(
            id: CGDirectDisplayID(id),
            frame: CGRect(x: x, y: y, width: w, height: h),
            visibleFrame: CGRect(x: x, y: y, width: w, height: h)
        )
    }

    // MARK: - applyDisplayOrder

    func testApplyDisplayOrder_emptyOrder_returnsAll() {
        let displays = [
            makeDisplay(id: 1, x: 0, y: 0, w: 1920, h: 1080),
            makeDisplay(id: 2, x: 1920, y: 0, w: 2560, h: 1440),
            makeDisplay(id: 3, x: 4480, y: 0, w: 1920, h: 1080),
        ]
        let result = DisplayManager.applyDisplayOrder(allDisplays: displays, savedOrder: [])
        XCTAssertEqual(result.count, 3)
        XCTAssertEqual(result.map(\.id), [1, 2, 3])
    }

    func testApplyDisplayOrder_fullSelection_reordersAll() {
        let displays = [
            makeDisplay(id: 1, x: 0, y: 0, w: 1920, h: 1080),
            makeDisplay(id: 2, x: 1920, y: 0, w: 2560, h: 1440),
            makeDisplay(id: 3, x: 4480, y: 0, w: 1920, h: 1080),
        ]
        // Reverse order
        let result = DisplayManager.applyDisplayOrder(allDisplays: displays, savedOrder: [3, 2, 1])
        XCTAssertEqual(result.count, 3)
        XCTAssertEqual(result.map(\.id), [3, 2, 1])
    }

    func testApplyDisplayOrder_partialSelection_excludesUnselected() {
        let displays = [
            makeDisplay(id: 1, x: 0, y: 0, w: 1920, h: 1080),
            makeDisplay(id: 2, x: 1920, y: 0, w: 2560, h: 1440),
            makeDisplay(id: 3, x: 4480, y: 0, w: 1920, h: 1080),
        ]
        // Only displays 1 and 3
        let result = DisplayManager.applyDisplayOrder(allDisplays: displays, savedOrder: [1, 3])
        XCTAssertEqual(result.count, 2)
        XCTAssertEqual(result.map(\.id), [1, 3])
    }

    func testApplyDisplayOrder_singleSelection_returnsAll() {
        let displays = [
            makeDisplay(id: 1, x: 0, y: 0, w: 1920, h: 1080),
            makeDisplay(id: 2, x: 1920, y: 0, w: 2560, h: 1440),
        ]
        // Only 1 display selected → need >= 2, so returns all
        let result = DisplayManager.applyDisplayOrder(allDisplays: displays, savedOrder: [1])
        XCTAssertEqual(result.count, 2)
        XCTAssertEqual(result.map(\.id), [1, 2])
    }

    func testApplyDisplayOrder_unknownIDs_ignored() {
        let displays = [
            makeDisplay(id: 1, x: 0, y: 0, w: 1920, h: 1080),
            makeDisplay(id: 2, x: 1920, y: 0, w: 2560, h: 1440),
        ]
        // ID 99 doesn't exist → only 1 match → falls back to all
        let result = DisplayManager.applyDisplayOrder(allDisplays: displays, savedOrder: [99, 1])
        XCTAssertEqual(result.count, 2)
        XCTAssertEqual(result.map(\.id), [1, 2])
    }
}
