import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, rotateLeft } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P010: 双方向回転 (@探索テスター)', () => {
  test('右回転→左回転で元の位置に戻ること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '双方向回転テストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: ウィンドウを配置して初期位置を記録
    openFinderWindow(primaryDisplay.x + 80, primaryDisplay.y + 80, 500, 400);
    await sleep(1000);

    const originalPos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-bidirectional');
    await spinshelf.attachData('original-position', originalPos);

    // Step 2: 右回転
    rotateRight();
    await spinshelf.waitForRotation();

    const afterRightPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-rotate-right');
    await spinshelf.attachData('after-right-position', afterRightPos);

    // ウィンドウが移動したことを確認
    expect(afterRightPos!.x).not.toBe(originalPos!.x);

    // Step 3: 左回転で元に戻す
    rotateLeft();
    await spinshelf.waitForRotation();

    const afterLeftPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-rotate-left-back');

    await spinshelf.attachData('round-trip-result', {
      original: originalPos,
      afterRight: afterRightPos,
      afterLeftBack: afterLeftPos,
      returnedToOriginalDisplay:
        Math.abs(afterLeftPos!.x - originalPos!.x) < primaryDisplay.width,
    });

    // 元のディスプレイに戻っていることを確認（ピクセル単位の一致は期待しない）
    const originalDisplay = spinshelf.displays.find(
      d => originalPos!.x >= d.x && originalPos!.x < d.x + d.width
    );
    const currentDisplay = spinshelf.displays.find(
      d => afterLeftPos!.x >= d.x && afterLeftPos!.x < d.x + d.width
    );

    expect(currentDisplay?.id).toBe(originalDisplay?.id);
  });
});
