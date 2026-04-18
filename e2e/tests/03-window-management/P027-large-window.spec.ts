import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P027: 大きいウィンドウのクリップ (@サイズテスター)', () => {
  test('ディスプレイより大きいウィンドウが適切にクリップされること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '大きいウィンドウテストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    // Step 1: ソースディスプレイよりも大きいウィンドウを配置（はみ出す可能性）
    const oversizedWidth = sourceDisplay.width + 200;
    const oversizedHeight = sourceDisplay.height + 100;
    openFinderWindow(
      sourceDisplay.x,
      sourceDisplay.y,
      oversizedWidth,
      oversizedHeight
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-large-window');
    await spinshelf.attachData('before-large', {
      window: beforePos,
      sourceDisplay: { width: sourceDisplay.width, height: sourceDisplay.height },
      oversized: {
        width: oversizedWidth > sourceDisplay.width,
        height: oversizedHeight > sourceDisplay.height,
      },
    });

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウがターゲットディスプレイに収まるようにクリップされたことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-large-window');

    expect(afterPos).not.toBeNull();

    const clippedWidth = afterPos!.width <= targetDisplay.width;
    const clippedHeight = afterPos!.height <= targetDisplay.height;

    await spinshelf.attachData('clip-result', {
      window: afterPos,
      targetDisplay: { width: targetDisplay.width, height: targetDisplay.height },
      clipped: { width: clippedWidth, height: clippedHeight },
      fitsInTarget:
        afterPos!.x >= targetDisplay.x &&
        afterPos!.y >= targetDisplay.y &&
        afterPos!.x + afterPos!.width <= targetDisplay.x + targetDisplay.width &&
        afterPos!.y + afterPos!.height <= targetDisplay.y + targetDisplay.height,
    });

    // ウィンドウがターゲットディスプレイの幅・高さを超えないこと
    expect(afterPos!.width).toBeLessThanOrEqual(targetDisplay.width);
    expect(afterPos!.height).toBeLessThanOrEqual(targetDisplay.height);
  });
});
