import AppKit
import Combine
import CoreGraphics

/// ディスプレイ情報を管理し、左→右の順序で提供する
final class DisplayManager {
    struct DisplayInfo {
        let id: CGDirectDisplayID
        let frame: CGRect       // CGDisplay座標系（左上原点）
        let visibleFrame: CGRect // メニューバー/Dockを除いた領域
    }

    /// ローテーション対象ディスプレイ（順序付き）
    private(set) var displays: [DisplayInfo] = []
    /// 接続中の全ディスプレイ（除外含む）
    private(set) var allDisplays: [DisplayInfo] = []
    private var changeObserver: NSObjectProtocol?
    private var cancellables = Set<AnyCancellable>()

    init() {
        refreshDisplays()
        observeDisplayChanges()

        // Settings UIでdisplayOrderが変更されたら再読み込み
        SettingsManager.shared.$displayOrder
            .dropFirst()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                NSLog("[SpinShelf] Display order changed in settings")
                self?.refreshDisplays()
            }
            .store(in: &cancellables)
    }

    deinit {
        if let observer = changeObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    /// ディスプレイ一覧を再取得（X座標昇順＝左→右）
    func refreshDisplays() {
        var displayIDs = [CGDirectDisplayID](repeating: 0, count: 16)
        var displayCount: UInt32 = 0
        CGGetActiveDisplayList(16, &displayIDs, &displayCount)

        let screens = NSScreen.screens
        allDisplays = (0..<Int(displayCount)).compactMap { i in
            let id = displayIDs[i]
            let bounds = CGDisplayBounds(id)

            // NSScreenのvisibleFrameを取得（メニューバー/Dock除外）
            // CGDisplay座標系（左上原点）に変換
            let visibleFrame: CGRect
            if let screen = screens.first(where: {
                let screenID = $0.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")]
                    as? CGDirectDisplayID
                return screenID == id
            }) {
                // NSScreen座標系（左下原点）→ CGDisplay座標系（左上原点）に変換
                let mainHeight = CGDisplayBounds(CGMainDisplayID()).height
                let nsVisible = screen.visibleFrame
                visibleFrame = CGRect(
                    x: nsVisible.origin.x,
                    y: mainHeight - nsVisible.origin.y - nsVisible.height,
                    width: nsVisible.width,
                    height: nsVisible.height
                )
            } else {
                visibleFrame = bounds
            }

            return DisplayInfo(id: id, frame: bounds, visibleFrame: visibleFrame)
        }
        .sorted { $0.frame.origin.x < $1.frame.origin.x }

        displays = Self.applyDisplayOrder(
            allDisplays: allDisplays,
            savedOrder: SettingsManager.shared.displayOrder
        )

        NSLog("[SpinShelf] Active rotation displays: %d", displays.count)
        for (i, d) in displays.enumerated() {
            NSLog(
                "[SpinShelf]   Display %d: %.0fx%.0f at (%.0f, %.0f)",
                i, d.frame.width, d.frame.height, d.frame.origin.x, d.frame.origin.y
            )
        }
    }

    // MARK: - Testable Logic

    /// 保存された順序でディスプレイをフィルタ・並べ替えする（テスト可能なstaticメソッド）
    static func applyDisplayOrder(
        allDisplays: [DisplayInfo],
        savedOrder: [UInt32]
    ) -> [DisplayInfo] {
        guard !savedOrder.isEmpty else { return allDisplays }
        let ordered = savedOrder.compactMap { savedID in
            allDisplays.first { $0.id == savedID }
        }
        return ordered.count >= 2 ? ordered : allDisplays
    }

    private func observeDisplayChanges() {
        changeObserver = NotificationCenter.default.addObserver(
            forName: NSApplication.didChangeScreenParametersNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            NSLog("[SpinShelf] Display configuration changed")
            self?.refreshDisplays()
        }
    }
}
