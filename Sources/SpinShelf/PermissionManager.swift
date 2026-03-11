import AppKit
import ApplicationServices

enum PermissionManager {
    /// タイマーをプロパティとして保持（GC防止）
    private static var pollTimer: DispatchSourceTimer?

    /// Accessibility権限をチェック。promptがtrueならシステムダイアログを表示
    static func checkAccessibility(prompt: Bool) -> Bool {
        let options =
            [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: prompt] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    /// 権限が付与されるまでポーリングし、付与後にコールバック実行
    static func pollUntilGranted(completion: @escaping () -> Void) {
        NSLog("[SpinShelf] Waiting for Accessibility permission...")

        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now() + 1, repeating: 1.0)
        timer.setEventHandler {
            if checkAccessibility(prompt: false) {
                timer.cancel()
                pollTimer = nil
                NSLog("[SpinShelf] Accessibility permission granted")
                completion()
            }
        }
        timer.resume()
        pollTimer = timer  // GCされないようstaticプロパティで保持
    }
}
