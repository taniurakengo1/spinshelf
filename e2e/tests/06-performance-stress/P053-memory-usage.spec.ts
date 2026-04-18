import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, rotateLeft } from '../../helpers/keyboard-helpers';
import { getAppMemoryUsage, isAppRunning } from '../../helpers/app-lifecycle';
import { openFinderWindow } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P053: メモリ使用量 (@メモリテスター)', () => {
  test('長時間使用でメモリリークがないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    // 初期メモリ使用量を記録
    const memoryBefore = getAppMemoryUsage();

    // 20回の回転を実行（往復10回）
    for (let i = 0; i < 10; i++) {
      rotateRight();
      await spinshelf.waitForRotation();
      rotateLeft();
      await spinshelf.waitForRotation();
    }

    // GCが走る時間を待つ
    await sleep(3000);

    // 回転後のメモリ使用量を記録
    const memoryAfter = getAppMemoryUsage();
    const memoryIncreaseMB = (memoryAfter - memoryBefore) / (1024 * 1024);

    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      memoryBeforeBytes: memoryBefore,
      memoryAfterBytes: memoryAfter,
      memoryIncreaseMB: memoryIncreaseMB.toFixed(2),
      rotationCount: 20,
      appStillRunning,
      noSignificantLeak: memoryIncreaseMB < 50,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // メモリ増加が50MB以下であること（リークなし）
    expect(memoryIncreaseMB).toBeLessThan(50);
  });
});
