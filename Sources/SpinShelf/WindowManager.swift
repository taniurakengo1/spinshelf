import AppKit
import ApplicationServices
import CoreGraphics

// CoreGraphics Private API（ウィンドウ透明度制御）
@_silgen_name("CGSMainConnectionID")
func CGSMainConnectionID() -> Int32

@_silgen_name("CGSSetWindowAlpha")
func CGSSetWindowAlpha(_ cid: Int32, _ wid: Int32, _ alpha: Float) -> Int32

@_silgen_name("_AXUIElementGetWindow")
func _AXUIElementGetWindow(_ element: AXUIElement, _ windowID: UnsafeMutablePointer<CGWindowID>)
    -> AXError



/// AXUIElementを使ったウィンドウの列挙と移動
final class WindowManager {
    struct WindowInfo {
        let element: AXUIElement
        let ownerPID: pid_t
        let position: CGPoint
        let size: CGSize
        let title: String
        let isMinimized: Bool
        let isFullScreen: Bool
        let zOrder: Int  // 0 = 最前面、大きいほど背面
    }

    /// 全アプリの通常ウィンドウを列挙（最小化・フルスクリーン除外、z-order付き）
    func listWindows() -> [WindowInfo] {
        // CGWindowListでz-order（前面→背面順）を取得
        var zOrderMap: [CGWindowID: Int] = [:]
        if let windowList = CGWindowListCopyWindowInfo(
            [.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID
        ) as? [[String: Any]] {
            for (index, info) in windowList.enumerated() {
                if let wid = info[kCGWindowNumber as String] as? CGWindowID {
                    zOrderMap[wid] = index
                }
            }
        }

        var windows: [WindowInfo] = []

        for app in NSWorkspace.shared.runningApplications
        where app.activationPolicy == .regular {
            let pid = app.processIdentifier
            let axApp = AXUIElementCreateApplication(pid)

            guard let axWindows = getAXArray(axApp, attribute: kAXWindowsAttribute) else {
                continue
            }

            for axWindow in axWindows {
                // z-orderを取得
                var windowID: CGWindowID = 0
                let zOrder: Int
                if _AXUIElementGetWindow(axWindow, &windowID) == .success {
                    zOrder = zOrderMap[windowID] ?? 9999
                } else {
                    zOrder = 9999
                }

                guard let info = getWindowInfo(axWindow, pid: pid, zOrder: zOrder) else {
                    continue
                }
                if info.isMinimized || info.isFullScreen { continue }
                windows.append(info)
            }
        }

        return windows
    }

    /// ウィンドウがどのディスプレイに属するか判定
    func displayIndex(
        for window: WindowInfo,
        displays: [DisplayManager.DisplayInfo]
    ) -> Int? {
        Self.displayIndex(
            windowPosition: window.position,
            windowSize: window.size,
            displayFrames: displays.map(\.frame)
        )
    }

    /// ウィンドウの所属ディスプレイを判定（テスト可能なstaticメソッド）
    static func displayIndex(
        windowPosition: CGPoint,
        windowSize: CGSize,
        displayFrames: [CGRect]
    ) -> Int? {
        let windowCenter = CGPoint(
            x: windowPosition.x + windowSize.width / 2,
            y: windowPosition.y + windowSize.height / 2
        )

        // 中心点が含まれるディスプレイを探す
        if let idx = displayFrames.firstIndex(where: { $0.contains(windowCenter) }) {
            return idx
        }

        // 中心点がどのディスプレイにもない場合、最も重なりが大きいディスプレイ
        let windowRect = CGRect(origin: windowPosition, size: windowSize)
        var bestIndex = 0
        var bestArea: CGFloat = 0

        for (i, frame) in displayFrames.enumerated() {
            let intersection = windowRect.intersection(frame)
            if !intersection.isNull {
                let area = intersection.width * intersection.height
                if area > bestArea {
                    bestArea = area
                    bestIndex = i
                }
            }
        }

        return bestArea > 0 ? bestIndex : nil
    }

    /// 移動先の座標・サイズを計算
    private func calculateTarget(
        _ window: WindowInfo,
        from source: DisplayManager.DisplayInfo,
        to target: DisplayManager.DisplayInfo
    ) -> (origin: CGPoint, size: CGSize) {
        let sourceFrame = source.visibleFrame
        let targetFrame = target.visibleFrame

        let relativeX = (window.position.x - sourceFrame.origin.x) / sourceFrame.width
        let relativeY = (window.position.y - sourceFrame.origin.y) / sourceFrame.height

        var newOrigin = CGPoint(
            x: targetFrame.origin.x + relativeX * targetFrame.width,
            y: targetFrame.origin.y + relativeY * targetFrame.height
        )

        var newSize = window.size
        if newSize.width > targetFrame.width { newSize.width = targetFrame.width }
        if newSize.height > targetFrame.height { newSize.height = targetFrame.height }

        if newOrigin.x + newSize.width > targetFrame.origin.x + targetFrame.width {
            newOrigin.x = targetFrame.origin.x + targetFrame.width - newSize.width
        }
        if newOrigin.y + newSize.height > targetFrame.origin.y + targetFrame.height {
            newOrigin.y = targetFrame.origin.y + targetFrame.height - newSize.height
        }
        newOrigin.x = max(newOrigin.x, targetFrame.origin.x)
        newOrigin.y = max(newOrigin.y, targetFrame.origin.y)

        return (newOrigin, newSize)
    }

    /// 解像度が同じか判定
    private func isSameResolution(
        _ source: DisplayManager.DisplayInfo,
        _ target: DisplayManager.DisplayInfo
    ) -> Bool {
        return abs(source.visibleFrame.width - target.visibleFrame.width) < 1
            && abs(source.visibleFrame.height - target.visibleFrame.height) < 1
    }

    /// 前面ウィンドウの移動
    func moveWindowWithFade(
        _ window: WindowInfo,
        from source: DisplayManager.DisplayInfo,
        to target: DisplayManager.DisplayInfo
    ) {
        let (newOrigin, newSize) = calculateTarget(window, from: source, to: target)
        let sameRes = isSameResolution(source, target)

        let conn = CGSMainConnectionID()
        let windowID = getWindowID(window.element)

        if sameRes {
            // 同じ解像度: 座標移動のみ
            setPosition(window.element, position: newOrigin)
        } else {
            // 異なる解像度: フェード + 3ステップ
            if let wid = windowID {
                for i in 1...4 {
                    _ = CGSSetWindowAlpha(conn, wid, 1.0 - Float(i) * 0.25)
                    usleep(25_000)
                }
            }

            let smallSize = CGSize(width: 100, height: 100)
            setSize(window.element, size: smallSize)
            setPosition(window.element, position: newOrigin)
            setSize(window.element, size: newSize)

            if let wid = windowID {
                usleep(15_000)
                for i in 1...4 {
                    _ = CGSSetWindowAlpha(conn, wid, Float(i) * 0.25)
                    usleep(25_000)
                }
            }
        }
    }

    /// 背面ウィンドウの移動
    func moveWindowInstant(
        _ window: WindowInfo,
        from source: DisplayManager.DisplayInfo,
        to target: DisplayManager.DisplayInfo
    ) {
        let (newOrigin, newSize) = calculateTarget(window, from: source, to: target)
        let sameRes = isSameResolution(source, target)

        if sameRes {
            // 同じ解像度: 座標移動のみ
            setPosition(window.element, position: newOrigin)
        } else {
            // 異なる解像度: 透明化して3ステップ
            let conn = CGSMainConnectionID()
            let windowID = getWindowID(window.element)

            if let wid = windowID { _ = CGSSetWindowAlpha(conn, wid, 0.0) }

            let smallSize = CGSize(width: 100, height: 100)
            setSize(window.element, size: smallSize)
            setPosition(window.element, position: newOrigin)
            setSize(window.element, size: newSize)

            if let wid = windowID {
                usleep(15_000)
                _ = CGSSetWindowAlpha(conn, wid, 1.0)
            }
        }
    }

    // MARK: - AXUIElement helpers

    private func getWindowInfo(_ element: AXUIElement, pid: pid_t, zOrder: Int = 9999)
        -> WindowInfo?
    {
        guard let position = getPosition(element),
            let size = getSize(element)
        else {
            return nil
        }

        let title = getString(element, attribute: kAXTitleAttribute) ?? ""
        let isMinimized = getBool(element, attribute: kAXMinimizedAttribute)
        let isFullScreen = getBool(element, attribute: kAXFullScreenAttribute ?? "AXFullScreen")

        // サイズが0のウィンドウは除外
        if size.width < 1 || size.height < 1 { return nil }

        return WindowInfo(
            element: element,
            ownerPID: pid,
            position: position,
            size: size,
            title: title,
            isMinimized: isMinimized,
            isFullScreen: isFullScreen,
            zOrder: zOrder
        )
    }

    private func getPosition(_ element: AXUIElement) -> CGPoint? {
        var value: AnyObject?
        guard AXUIElementCopyAttributeValue(element, kAXPositionAttribute as CFString, &value)
            == .success
        else { return nil }
        var point = CGPoint.zero
        guard CFGetTypeID(value!) == AXValueGetTypeID(),
            AXValueGetValue(value as! AXValue, .cgPoint, &point) else { return nil }
        return point
    }

    private func getSize(_ element: AXUIElement) -> CGSize? {
        var value: AnyObject?
        guard AXUIElementCopyAttributeValue(element, kAXSizeAttribute as CFString, &value)
            == .success
        else { return nil }
        var size = CGSize.zero
        guard CFGetTypeID(value!) == AXValueGetTypeID(),
            AXValueGetValue(value as! AXValue, .cgSize, &size) else { return nil }
        return size
    }

    private func setPosition(_ element: AXUIElement, position: CGPoint) {
        var pos = position
        guard let value = AXValueCreate(.cgPoint, &pos) else { return }
        AXUIElementSetAttributeValue(element, kAXPositionAttribute as CFString, value)
    }

    private func setSize(_ element: AXUIElement, size: CGSize) {
        var s = size
        guard let value = AXValueCreate(.cgSize, &s) else { return }
        AXUIElementSetAttributeValue(element, kAXSizeAttribute as CFString, value)
    }

    private func getWindowID(_ element: AXUIElement) -> Int32? {
        var windowID: CGWindowID = 0
        let result = _AXUIElementGetWindow(element, &windowID)
        return result == .success ? Int32(windowID) : nil
    }

    private func getString(_ element: AXUIElement, attribute: String) -> String? {
        var value: AnyObject?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value as? String
    }

    private func getBool(_ element: AXUIElement, attribute: String) -> Bool {
        var value: AnyObject?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return false }
        return (value as? NSNumber)?.boolValue ?? false
    }

    private func getAXArray(_ element: AXUIElement, attribute: String) -> [AXUIElement]? {
        var value: AnyObject?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value as? [AXUIElement]
    }
}

// kAXFullScreenAttribute はmacOS APIに定数がないため文字列で代用
private let kAXFullScreenAttribute: String? = "AXFullScreen"
