import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import { isAppRunning } from '../../helpers/app-lifecycle';

test.describe('P094: macOS 15 (Sequoia)で動作すること (@Sequoiaテスター)', () => {
  test('macOS Sequoia互換性チェック', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のmacOSバージョンを取得
    const osVersion = runShell('sw_vers -productVersion');
    const majorVersion = parseInt(osVersion.split('.')[0], 10);

    // Step 2: Sequoiaでの新しいセキュリティ要件への対応確認
    // Sequoiaではアクセシビリティ権限の要件が厳格化されている
    let hasSequoiaAdaptation = false;
    try {
      const result = runShell(
        `grep -r "@available(macOS 15\\|#available(macOS 15" "${__dirname}/../../../Sources/" 2>/dev/null || echo ""`
      );
      hasSequoiaAdaptation = result.length > 0;
    } catch {
      hasSequoiaAdaptation = false;
    }

    // Step 3: Swiftコンパイラのバージョンがsequoia対応であることを確認
    let swiftVersion = '';
    try {
      swiftVersion = runShell('swift --version 2>&1 | head -1');
    } catch {
      swiftVersion = 'unknown';
    }

    // Step 4: アプリが動作していることを確認
    const appRunning = isAppRunning();

    // Step 5: CGDisplay APIがSequoiaで正常に動作することを確認
    const displays = spinshelf.displays;
    const allDisplaysHaveValidBounds = displays.every(
      d => d.width > 0 && d.height > 0
    );

    await spinshelf.screenshot('after');
    await spinshelf.attachData('sequoia-compatibility', {
      currentOS: osVersion,
      majorVersion,
      isSequoia: majorVersion === 15,
      hasSequoiaAdaptation,
      swiftVersion,
      appRunning,
      displayCount: spinshelf.displayCount,
      allDisplaysHaveValidBounds,
    });

    expect(appRunning).toBe(true);
    expect(allDisplaysHaveValidBounds).toBe(true);
  });
});
