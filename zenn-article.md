---
title: "100均のハンコ回転台を見て「PCの画面もこう回せたらな」と思ったので作った"
emoji: "🎠"
type: "tech"
topics: ["macOS", "Swift", "AppKit", "Accessibility", "OSS"]
published: false
---

合同会社ハットウの taniura です。

## きっかけは100均のハンコ回転台

複数ディスプレイでプログラミングしていますが、基本的に見ているのは正面の1画面です。

左のディスプレイに置いたターミナルを見たいとき、右のブラウザを確認したいとき、そのたびにマウスを動かし、視線を動かし、首を回す。地味にめんどくさい。

先日、妻の買い物を待つ間に100均をぶらぶらしていて、ハンコの回転台を見つけました。くるくる回すと次のハンコが正面に来るやつです。

自分の名前は長いかなー、とぐるぐる回しながら（すみません、買う気はなかったです）、ふと思いました。

**「これ、パソコンの画面でもできたらよくない？」**

視線を動かすんじゃなくて、画面のほうを回す。正面のディスプレイに欲しいウィンドウが来る。

こんなツール、実はなかったんだな、と。

あーーー、作ってみるか。

作ってみた。

## 作ったもの

**SpinShelf** — マルチディスプレイの全ウィンドウを一斉に隣のディスプレイへ巡回移動させる macOS メニューバーアプリです。

https://github.com/taniurakengo1/spinshelf

```
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Display1 │   │ Display2 │   │ Display3 │
  │  Editor  │   │ Terminal │   │ Browser  │
  └──────────┘   └──────────┘   └──────────┘

              Ctrl+Shift+→ 🎠

  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Display1 │   │ Display2 │   │ Display3 │
  │ Browser  │   │  Editor  │   │ Terminal │
  └──────────┘   └──────────┘   └──────────┘
```

視線は正面のまま。回るのは画面のほう。

## 技術的なポイント

ここからは macOS でこれを実現するために必要だった技術の話です。

### 1. Accessibility API でウィンドウを操作する

macOS でウィンドウの位置やサイズを外部から操作するには、**Accessibility API（`AXUIElement`）** を使います。

```swift
for app in NSWorkspace.shared.runningApplications
where app.activationPolicy == .regular {
    let axApp = AXUIElementCreateApplication(app.processIdentifier)
    // kAXWindowsAttribute でウィンドウ一覧を取得
    // kAXPositionAttribute / kAXSizeAttribute で位置・サイズを読み書き
}
```

ポイント:
- `activationPolicy == .regular` でDockに表示されるアプリのみ対象にする
- 最小化やフルスクリーンのウィンドウは除外
- サイズが1px未満の不可視ウィンドウも除外

### 2. Z-order を考慮した移動順序

単純に全ウィンドウを同時に移動すると、背面のウィンドウが前面に来てしまうことがあります。**前面のウィンドウを先に移動**することで、視覚的な違和感を減らしています。

```swift
// CGWindowList で z-order（前面→背面順）を取得
let windowList = CGWindowListCopyWindowInfo(
    [.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID
)

// AXUIElement → CGWindowID のマッピングに Private API を使用
var windowID: CGWindowID = 0
_AXUIElementGetWindow(axWindow, &windowID)
```

`CGWindowListCopyWindowInfo` は画面に表示されているウィンドウを前面から順に返してくれます。ただし AXUIElement から CGWindowID を取得する公開 API は存在しないため、`_AXUIElementGetWindow` という Private API を使っています。

### 3. 解像度が異なるディスプレイ間の移動

同じ解像度なら座標をずらすだけですが、解像度が異なる場合は工夫が必要です。

```swift
if sameResolution {
    setPosition(window, position: newOrigin)
} else {
    // 3ステップ: 縮小 → 移動 → リサイズ
    setSize(window, size: CGSize(width: 100, height: 100))
    setPosition(window, position: newOrigin)
    setSize(window, size: newSize)
}
```

**大きなウィンドウを小さいディスプレイに移動しようとすると、macOS がウィンドウを元のディスプレイに留めてしまいます。** 先に小さくしておけばこの制約を回避できます。

### 4. Private API でフェードエフェクト

解像度の異なるディスプレイへの移動時、リサイズの過程が見えるとちらつきます。`CGSSetWindowAlpha` という Private API でウィンドウを一時的に透明にしています。

```swift
@_silgen_name("CGSSetWindowAlpha")
func CGSSetWindowAlpha(_ cid: Int32, _ wid: Int32, _ alpha: Float) -> Int32

// フェードアウト → 移動・リサイズ → フェードイン
for i in 1...4 {
    CGSSetWindowAlpha(conn, wid, 1.0 - Float(i) * 0.25)
    usleep(25_000)
}
// ...ウィンドウ移動...
for i in 1...4 {
    CGSSetWindowAlpha(conn, wid, Float(i) * 0.25)
    usleep(25_000)
}
```

`@_silgen_name` は Swift から C のシンボルを直接呼び出すための属性です。ヘッダファイルがなくても関数シグネチャを宣言すれば呼べます。

### 5. ウィンドウの所属ディスプレイ判定

ウィンドウの中心座標がどのディスプレイの矩形に含まれるかで判定します。ディスプレイの境界にまたがる場合は、重なり面積が最大のディスプレイに所属させます。

```swift
let windowCenter = CGPoint(
    x: window.position.x + window.size.width / 2,
    y: window.position.y + window.size.height / 2
)
if let idx = displays.firstIndex(where: { $0.frame.contains(windowCenter) }) {
    return idx
}
// 中心がどこにもない場合 → 重なり面積で判定
```

### 6. CGEventTap でグローバルショートカット

`CGEvent.tapCreate` でシステム全体のキーイベントを監視します。

```swift
let tap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .defaultTap,  // イベントを消費できる
    eventsOfInterest: CGEventMask(1 << CGEventType.keyDown.rawValue),
    callback: { _, _, event, refcon -> Unmanaged<CGEvent>? in
        // ショートカットに一致 → nil を返してイベント消費
        // 不一致 → passUnretained で通過
    },
    userInfo: refcon
)
```

## アーキテクチャ

```
GestureDetector (CGEventTap)
    │ onSwipe
    ▼
CarouselController
    │  Phase 1: 前面ウィンドウを移動
    │  Phase 2: 背面ウィンドウを移動
    ├──→ DisplayManager  … ディスプレイ検出・ホットプラグ対応
    └──→ WindowManager   … AXUIElement でウィンドウ操作
```

4つのクラスだけのシンプルな構成です。

## Private API の注意

| API | 用途 |
|---|---|
| `CGSMainConnectionID` | CoreGraphics のコネクション取得 |
| `CGSSetWindowAlpha` | ウィンドウの透明度制御 |
| `_AXUIElementGetWindow` | AXUIElement → CGWindowID 変換 |

Private API を使っているため **Mac App Store では配布できません**。macOS のアップデートで動作しなくなるリスクもあります。だから OSS にしています。壊れたら直せばいい。

## インストール

```bash
git clone https://github.com/taniurakengo1/spinshelf.git
cd spinshelf
sudo make install
make start
```

初回起動時に Accessibility 権限の許可が必要です。

## おわりに

100均のハンコ回転台から着想を得て、マルチディスプレイのウィンドウをくるくる回すツールを作りました。

作ってみたので使ってほしいです。

Issue や PR も歓迎です。

https://github.com/taniurakengo1/spinshelf
