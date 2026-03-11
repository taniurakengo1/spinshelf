import AppKit
import SpinShelfLib

// メニューバーエージェントアプリとして起動（Dockアイコンなし）
let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let delegate = AppDelegate()
app.delegate = delegate

app.run()
