// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "SpinShelf",
    defaultLocalization: "en",
    platforms: [.macOS(.v13)],
    targets: [
        .target(
            name: "SpinShelfLib",
            path: "Sources/SpinShelf",
            resources: [
                .process("Resources"),
            ],
            linkerSettings: [
                .linkedFramework("AppKit"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("ApplicationServices"),
            ]
        ),
        .executableTarget(
            name: "SpinShelf",
            dependencies: ["SpinShelfLib"],
            path: "Sources/SpinShelfApp"
        ),
        .testTarget(
            name: "SpinShelfTests",
            dependencies: ["SpinShelfLib"]
        ),
    ]
)
