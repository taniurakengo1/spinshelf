# SpinShelf

## 概要
macOS向けネイティブアプリ。複数の物理ディスプレイ間で、ウィンドウ（仮想デスクトップ）をメリーゴーランドのように巡回切り替えするツール。

## 仕様

### 基本動作
- トラックパッドのスワイプジェスチャーで、各ディスプレイに表示されている画面が一斉に隣のディスプレイへ移動する
- メリーゴーランド方式: 最後のディスプレイから出た画面は最初のディスプレイに戻る（循環）
- 例: 3画面構成で右スワイプ → 画面A→B→C→A のように巡回

### マルチディスプレイ対応
- 接続されている全物理ディスプレイを自動検出
- 各ディスプレイの解像度・配置を取得し、ウィンドウサイズ・レイアウトを自動調整
- ディスプレイの追加・取り外しにも動的に対応

### 解像度適応
- 移動先ディスプレイの解像度に合わせてウィンドウを自動リサイズ
- アスペクト比が異なる場合も適切にフィットさせる

## 技術スタック
- 言語: Swift
- フレームワーク: AppKit（macOS ネイティブ）
- macOS Accessibility API（ウィンドウ操作）
- CGDisplay API（ディスプレイ情報取得）
- NSEvent（トラックパッドジェスチャー検知）

## ビルド・実行
```bash
swift build
swift run
```

## ディレクトリ構成
```
spinshelf/
├── Package.swift
├── Sources/
│   └── SpinShelf/
│       ├── main.swift
│       ├── DisplayManager.swift      # ディスプレイ検出・情報管理
│       ├── WindowManager.swift       # ウィンドウ操作・移動
│       ├── GestureDetector.swift     # スワイプジェスチャー検知
│       └── CarouselController.swift  # 巡回ロジック制御
├── CLAUDE.md
├── README.md
└── LICENSE
```
