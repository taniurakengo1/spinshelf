import AppKit
import os

/// 全体のオーケストレーション: ウィンドウをメリーゴーランド式に巡回移動
final class CarouselController {
    private let displayManager: DisplayManager
    private let windowManager: WindowManager
    private let gestureDetector: GestureDetector
    private let lock = OSAllocatedUnfairLock(initialState: false)  // isRotating

    init(
        displayManager: DisplayManager,
        windowManager: WindowManager,
        gestureDetector: GestureDetector
    ) {
        self.displayManager = displayManager
        self.windowManager = windowManager
        self.gestureDetector = gestureDetector
    }

    func start() {
        gestureDetector.onSwipe = { [weak self] direction in
            self?.rotate(direction: direction)
        }
        gestureDetector.start()
        NSLog("[SpinShelf] Carousel started")
    }

    func stop() {
        gestureDetector.stop()
    }

    /// メニューバーのボタンから呼び出し用
    func rotateFromMenu(direction: GestureDetector.Direction) {
        rotate(direction: direction)
    }

    /// ウィンドウを指定方向に1ディスプレイ分巡回移動
    private func rotate(direction: GestureDetector.Direction) {
        // スレッドセーフな再入防止
        let canProceed = lock.withLock { (isRotating: inout Bool) -> Bool in
            if isRotating { return false }
            isRotating = true
            return true
        }
        guard canProceed else { return }

        // ディスプレイ情報のスナップショットを取得
        let displays = displayManager.displays
        guard displays.count >= 2 else {
            NSLog("[SpinShelf] Need at least 2 displays for rotation")
            lock.withLock { $0 = false }
            return
        }

        let windows = windowManager.listWindows()
        NSLog(
            "[SpinShelf] Rotating %@ with %d windows across %d displays",
            direction == .right ? "right" : "left",
            windows.count,
            displays.count
        )

        // ウィンドウをディスプレイごとにグルーピング
        struct MoveTask {
            let window: WindowManager.WindowInfo
            let source: DisplayManager.DisplayInfo
            let target: DisplayManager.DisplayInfo
        }

        var tasks: [MoveTask] = []
        let displayCount = displays.count

        for window in windows {
            guard let idx = windowManager.displayIndex(for: window, displays: displays) else {
                continue
            }
            let targetIndex: Int
            switch direction {
            case .right:
                targetIndex = (idx + 1) % displayCount
            case .left:
                targetIndex = (idx - 1 + displayCount) % displayCount
            }
            tasks.append(MoveTask(
                window: window,
                source: displays[idx],
                target: displays[targetIndex]
            ))
        }

        // z-orderでソート（前面が先）
        tasks.sort { $0.window.zOrder < $1.window.zOrder }

        // 各ディスプレイの最前面ウィンドウ（zOrderが最小）を特定
        var frontmostPerDisplay: Set<Int> = []
        var seenDisplays: Set<Int> = []
        for (i, task) in tasks.enumerated() {
            if let idx = windowManager.displayIndex(for: task.window, displays: displays),
                !seenDisplays.contains(idx)
            {
                seenDisplays.insert(idx)
                frontmostPerDisplay.insert(i)
            }
        }

        let moveQueue = DispatchQueue(
            label: "com.spinshelf.move",
            attributes: .concurrent
        )

        // Phase 1: 前面ウィンドウをフェード付きで移動
        let frontGroup = DispatchGroup()
        for i in frontmostPerDisplay {
            let task = tasks[i]
            frontGroup.enter()
            moveQueue.async { [windowManager] in
                windowManager.moveWindowWithFade(task.window, from: task.source, to: task.target)
                frontGroup.leave()
            }
        }
        frontGroup.wait()

        // Phase 2: 背面ウィンドウを高速で移動（透明→移動→復元、フェードなし）
        let backGroup = DispatchGroup()
        for (i, task) in tasks.enumerated() where !frontmostPerDisplay.contains(i) {
            backGroup.enter()
            moveQueue.async { [windowManager] in
                windowManager.moveWindowInstant(task.window, from: task.source, to: task.target)
                backGroup.leave()
            }
        }

        // メインスレッドをブロックせず、完了後にフラグを解除
        backGroup.notify(queue: .main) { [lock] in
            lock.withLock { $0 = false }
            NSLog("[SpinShelf] Rotation complete")
        }
    }
}
