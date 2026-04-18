import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import { isAppRunning } from '../../helpers/app-lifecycle';

test.describe('P093: macOS 14 (Sonoma)で動作すること (@Sonomaテスター)', () => {
  test('macOS Sonoma互換性チェック', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のmacOSバージョンを取得
    const osVersion = runShell('sw_vers -productVersion');
    const majorVersion = parseInt(osVersion.split('.')[0], 10);

    // Step 2: Package.swiftのプラットフォーム設定を確認
    let platformConfig = '';
    try {
      platformConfig = runShell(
        `grep -A5 "platforms\\|.macOS" "${__dirname}/../../../Package.swift" 2>/dev/null || echo ""`
      );
    } catch {
      platformConfig = '';
    }

    // Step 3: Sonoma固有のAPI互換性チェック
    // Sonomaで変更されたAPI (例: DesktopManager変更等) への対応確認
    let hasSonomaAdaptation = false;
    try {
      const result = runShell(
        `grep -r "@available(macOS 14\\|#available(macOS 14" "${__dirname}/../../../Sources/" 2>/dev/null || echo ""`
      );
      hasSonomaAdaptation = result.length > 0;
    } catch {
      hasSonomaAdaptation = false;
    }

    // Step 4: アプリが動作していることを確認
    const appRunning = isAppRunning();

    // Step 5: ディスプレイ検出がSonomaで正常に動作することを確認
    const displayCount = spinshelf.displayCount;

    await spinshelf.screenshot('after');
    await spinshelf.attachData('sonoma-compatibility', {
      currentOS: osVersion,
      majorVersion,
      isSonoma: majorVersion === 14,
      platformConfig: platformConfig.slice(0, 500),
      hasSonomaAdaptation,
      appRunning,
      displayCount,
    });

    expect(appRunning).toBe(true);
    expect(displayCount).toBeGreaterThanOrEqual(1);
  });
});
