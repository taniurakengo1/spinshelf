import AppKit
import Foundation

/// GitHub Releases から最新バージョンを確認する
final class UpdateChecker {
    static let currentVersion = "0.1.0"
    private static let repoURL = "https://api.github.com/repos/taniurakengo1/spinshelf/releases/latest"

    func check() {
        guard let url = URL(string: Self.repoURL) else { return }

        var request = URLRequest(url: url)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 10

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error {
                    self.showError("Could not check for updates.\n\(error.localizedDescription)")
                    return
                }

                guard let data,
                    let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                    let tagName = json["tag_name"] as? String
                else {
                    self.showError("Could not parse update information.")
                    return
                }

                let latest = tagName.trimmingCharacters(in: CharacterSet(charactersIn: "vV"))
                if self.isNewer(latest, than: Self.currentVersion) {
                    self.showUpdateAvailable(
                        version: latest,
                        url: json["html_url"] as? String ?? "https://github.com/taniurakengo1/spinshelf/releases"
                    )
                } else {
                    self.showUpToDate()
                }
            }
        }.resume()
    }

    private func isNewer(_ remote: String, than local: String) -> Bool {
        let r = remote.split(separator: ".").compactMap { Int($0) }
        let l = local.split(separator: ".").compactMap { Int($0) }
        for i in 0..<max(r.count, l.count) {
            let rv = i < r.count ? r[i] : 0
            let lv = i < l.count ? l[i] : 0
            if rv > lv { return true }
            if rv < lv { return false }
        }
        return false
    }

    private func showUpdateAvailable(version: String, url: String) {
        let alert = NSAlert()
        alert.messageText = "Update Available"
        alert.informativeText = "SpinShelf \(version) is available.\nYou are currently running \(Self.currentVersion)."
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Open Release Page")
        alert.addButton(withTitle: "Later")

        if alert.runModal() == .alertFirstButtonReturn {
            if let releaseURL = URL(string: url) {
                NSWorkspace.shared.open(releaseURL)
            }
        }
    }

    private func showUpToDate() {
        let alert = NSAlert()
        alert.messageText = "You're Up to Date"
        alert.informativeText = "SpinShelf \(Self.currentVersion) is the latest version."
        alert.alertStyle = .informational
        alert.runModal()
    }

    private func showError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "Update Check Failed"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.runModal()
    }
}
