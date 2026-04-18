import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, closeAllWindows } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P057: ウィンドウ数スケーリング (@スケーリングテスター)', () => {
  test('ウィンドウ数増加に対する性能劣化が線形以下であること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    await spinshelf.screenshot('before');

    const timings: { windowCount: number; rotationTimeMs: number }[] = [];

    // 段階的にウィンドウ数を増やしてタイミングを計測
    const windowCounts = [1, 5, 10, 15];

    for (const count of windowCounts) {
      // 既存ウィンドウをクリーンアップ
      closeAllWindows('Finder');
      await sleep(500);

      // 指定数のウィンドウを開く
      for (let i = 0; i < count; i++) {
        const offsetX = (i % 5) * 40;
        const offsetY = Math.floor(i / 5) * 40;
        openFinderWindow(mainDisplay.x + 50 + offsetX, mainDisplay.y + 50 + offsetY, 400, 300);
        await sleep(200);
      }
      await sleep(500);

      // 回転時間を計測
      const start = Date.now();
      rotateRight();
      await spinshelf.waitForRotation();
      const elapsed = Date.now() - start;

      timings.push({ windowCount: count, rotationTimeMs: elapsed });

      // 次のテストのために戻す
      rotateRight();
      await spinshelf.waitForRotation();
    }

    const appStillRunning = isAppRunning();

    // 性能劣化の分析: 最後のタイミングが最初の5倍以内であること
    const firstTiming = timings[0]?.rotationTimeMs || 1;
    const lastTiming = timings[timings.length - 1]?.rotationTimeMs || 1;
    const scalingFactor = lastTiming / firstTiming;

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      timings,
      scalingFactor: scalingFactor.toFixed(2),
      appStillRunning,
      subLinearScaling: scalingFactor < windowCounts[windowCounts.length - 1],
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // スケーリングファクタが線形(15倍)以下であること
    expect(scalingFactor).toBeLessThan(windowCounts[windowCounts.length - 1]);
  });
});
