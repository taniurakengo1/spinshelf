import { test, expect } from '../../fixtures/spinshelf.fixture';
import { getDisplays, getDisplayCount } from '../../helpers/display-helpers';
import { runShell } from '../../helpers/macos-automation';

test.describe('P011: ディスプレイ検出 (@ハードウェアテスター)', () => {
  test('接続中の全ディスプレイが検出されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before-display-detection');

    // Step 1: system_profiler から実際のディスプレイ数を取得
    let systemDisplayCount: number;
    try {
      const result = runShell(
        'system_profiler SPDisplaysDataType | grep -c "Resolution:" || echo "1"'
      );
      systemDisplayCount = parseInt(result, 10);
    } catch {
      systemDisplayCount = 1;
    }

    // Step 2: SpinShelfが検出したディスプレイ情報を取得
    const detectedDisplays = getDisplays();
    const detectedCount = getDisplayCount();

    await spinshelf.screenshot('after-display-detection');
    await spinshelf.attachData('display-detection', {
      systemReportedCount: systemDisplayCount,
      spinshelfDetectedCount: detectedCount,
      displays: detectedDisplays.map(d => ({
        id: d.id,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        isMain: d.isMain,
      })),
    });

    // Step 3: 検出数がシステム報告と一致することを確認
    expect(detectedCount).toBe(systemDisplayCount);
    expect(detectedDisplays.length).toBe(systemDisplayCount);

    // 各ディスプレイに有効な解像度があることを確認
    for (const display of detectedDisplays) {
      expect(display.width).toBeGreaterThan(0);
      expect(display.height).toBeGreaterThan(0);
    }

    // メインディスプレイが1つだけ存在すること
    const mainDisplays = detectedDisplays.filter(d => d.isMain);
    expect(mainDisplays.length).toBe(1);
  });
});
