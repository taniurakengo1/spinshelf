// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "SpinShelf",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "SpinShelf",
            path: "Sources/SpinShelf",
            linkerSettings: [
                .linkedFramework("AppKit"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("ApplicationServices"),
            ]
        ),
    ]
)
