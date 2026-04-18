import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P051: 回転速度 (@パフォーマンステスター)', () => {
  test('回転操作が1秒以内に完了すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // 回転の実行時間を計測
    const startTime = Date.now();
    rotateRight();

    // ウィンドウが移動するまでポーリング（最大2秒）
    let positionAfter = positionBefore;
    let elapsed = 0;
    while (elapsed < 2000) {
      await sleep(50);
      elapsed = Date.now() - startTime;
      positionAfter = getWindowPosition('Finder');
      if (positionAfter && positionBefore && positionAfter.x !== positionBefore.x) {
        break;
      }
    }
    const rotationTimeMs = Date.now() - startTime;

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      rotationTimeMs,
      positionBefore,
      positionAfter,
      completedWithin1s: rotationTimeMs < 1000,
    });

    // 1秒以内に完了すること
    expect(rotationTimeMs).toBeLessThan(1000);
  });
});
