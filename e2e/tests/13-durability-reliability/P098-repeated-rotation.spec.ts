import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, rotateLeft } from '../../helpers/keyboard-helpers';
import { sleep } from '../../helpers/macos-automation';
import { isAppRunning, getAppMemoryUsage } from '../../helpers/app-lifecycle';
import { openFinderWindow, closeAllTestWindows } from '../../helpers/window-helpers';

test.describe('P098: 100回の回転サイクルでエラーが発生しないこと (@繰り返しテスター)', () => {
  test('100回の回転操作後もアプリが安定して動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '回転テストには複数ディスプレイが必要');
    test.setTimeout(300_000); // 5分タイムアウト

    await spinshelf.screenshot('before');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: テスト用ウィンドウを配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 600, 400);
    await sleep(1000);

    const TOTAL_CYCLES = 100;
    const initialMemory = getAppMemoryUsage();
    let errorCount = 0;
    let crashDetected = false;

    // Step 2: 100回の回転サイクルを実行（右50回、左50回）
    for (let i = 0; i < TOTAL_CYCLES; i++) {
      try {
        if (i % 2 === 0) {
          rotateRight();
        } else {
          rotateLeft();
        }
        await sleep(200); // 各回転間の待機

        // 10回ごとにプロセス生存確認
        if (i % 10 === 0) {
          if (!isAppRunning()) {
            crashDetected = true;
            break;
          }
        }
      } catch {
        errorCount++;
      }
    }

    await sleep(2000); // 最終回転後の安定待ち

    // Step 3: 最終状態の確認
    const finalRunning = isAppRunning();
    const finalMemory = getAppMemoryUsage();
    const memoryGrowthRatio = initialMemory > 0 ? finalMemory / initialMemory : 1;

    await spinshelf.screenshot('after');
    await spinshelf.attachData('repeated-rotation-result', {
      totalCycles: TOTAL_CYCLES,
      errorCount,
      crashDetected,
      finalRunning,
      initialMemoryBytes: initialMemory,
      finalMemoryBytes: finalMemory,
      memoryGrowthRatio: Math.round(memoryGrowthRatio * 100) / 100,
    });

    expect(crashDetected).toBe(false);
    expect(finalRunning).toBe(true);
    expect(errorCount).toBe(0);
    // メモリが5倍以上に膨れていないこと
    expect(memoryGrowthRatio).toBeLessThan(5);
  });
});
