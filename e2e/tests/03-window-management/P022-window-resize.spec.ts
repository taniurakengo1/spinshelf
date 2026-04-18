import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P022: ウィンドウリサイズ (@リサイズテスター)', () => {
  test('ターゲットディスプレイに合わせてリサイズされること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'リサイズテストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    // Step 1: ソースディスプレイの70%サイズのウィンドウを配置
    const windowWidth = Math.floor(sourceDisplay.width * 0.7);
    const windowHeight = Math.floor(sourceDisplay.height * 0.7);
    openFinderWindow(
      sourceDisplay.x + 50,
      sourceDisplay.y + 50,
      windowWidth,
      windowHeight
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-resize');
    await spinshelf.attachData('before-size', {
      window: beforePos,
      sourceDisplay: { width: sourceDisplay.width, height: sourceDisplay.height },
      widthRatio: beforePos!.width / sourceDisplay.width,
      heightRatio: beforePos!.height / sourceDisplay.height,
    });

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウがターゲットディスプレイに適切にリサイズされたことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-resize');

    expect(afterPos).not.toBeNull();

    const afterWidthRatio = afterPos!.width / targetDisplay.width;
    const afterHeightRatio = afterPos!.height / targetDisplay.height;

    await spinshelf.attachData('resize-result', {
      window: afterPos,
      targetDisplay: { width: targetDisplay.width, height: targetDisplay.height },
      afterWidthRatio,
      afterHeightRatio,
      proportionPreserved:
        Math.abs(afterWidthRatio - (beforePos!.width / sourceDisplay.width)) < 0.15,
    });

    // ウィンドウがターゲットディスプレイをはみ出さないこと
    expect(afterPos!.width).toBeLessThanOrEqual(targetDisplay.width);
    expect(afterPos!.height).toBeLessThanOrEqual(targetDisplay.height);
  });
});
