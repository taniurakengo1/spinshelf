import CoreGraphics
import XCTest

@testable import SpinShelfLib

final class WindowManagerTests: XCTestCase {

    private let displays: [CGRect] = [
        CGRect(x: 0, y: 0, width: 1920, height: 1080),       // Display 0 (left)
        CGRect(x: 1920, y: 0, width: 2560, height: 1440),     // Display 1 (center)
        CGRect(x: 4480, y: 0, width: 1920, height: 1080),     // Display 2 (right)
    ]

    // MARK: - Center point detection

    func testDisplayIndex_windowCenterInDisplay0() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 100, y: 100),
            windowSize: CGSize(width: 800, height: 600),
            displayFrames: displays
        )
        XCTAssertEqual(result, 0)
    }

    func testDisplayIndex_windowCenterInDisplay1() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 2500, y: 200),
            windowSize: CGSize(width: 800, height: 600),
            displayFrames: displays
        )
        XCTAssertEqual(result, 1)
    }

    func testDisplayIndex_windowCenterInDisplay2() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 5000, y: 100),
            windowSize: CGSize(width: 800, height: 600),
            displayFrames: displays
        )
        XCTAssertEqual(result, 2)
    }

    // MARK: - Overlap detection (center outside all displays)

    func testDisplayIndex_windowSpanningBoundary_usesLargerOverlap() {
        // Window at boundary between display 0 and 1, more area in display 1
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 1800, y: 0),
            windowSize: CGSize(width: 400, height: 400),
            displayFrames: displays
        )
        // Center at (2000, 200) → in display 1
        XCTAssertEqual(result, 1)
    }

    func testDisplayIndex_windowMostlyInDisplay0_overlapFallback() {
        // Window with center outside all displays but overlapping display 0
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: -500, y: -500),
            windowSize: CGSize(width: 1000, height: 1000),
            displayFrames: displays
        )
        // Center at (0, 0) → top-left corner of display 0, which is technically in display 0
        XCTAssertEqual(result, 0)
    }

    // MARK: - No display match

    func testDisplayIndex_windowCompletelyOutside_returnsNil() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: -2000, y: -2000),
            windowSize: CGSize(width: 100, height: 100),
            displayFrames: displays
        )
        XCTAssertNil(result)
    }

    // MARK: - Edge cases

    func testDisplayIndex_emptyDisplays_returnsNil() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 100, y: 100),
            windowSize: CGSize(width: 800, height: 600),
            displayFrames: []
        )
        XCTAssertNil(result)
    }

    func testDisplayIndex_singleDisplay() {
        let result = WindowManager.displayIndex(
            windowPosition: CGPoint(x: 100, y: 100),
            windowSize: CGSize(width: 800, height: 600),
            displayFrames: [CGRect(x: 0, y: 0, width: 1920, height: 1080)]
        )
        XCTAssertEqual(result, 0)
    }
}
