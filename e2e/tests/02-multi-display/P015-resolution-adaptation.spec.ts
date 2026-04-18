import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P015: 解像度適応 (@解像度テスター)', () => {
  test('異なる解像度間の移動でウィンドウがリサイズされること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '解像度適応テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    await spinshelf.attachData('display-resolutions', {
      source: { width: sourceDisplay.width, height: sourceDisplay.height },
      target: { width: targetDisplay.width, height: targetDisplay.height },
      differentResolution: sourceDisplay.width !== targetDisplay.width || sourceDisplay.height !== targetDisplay.height,
    });

    // Step 1: ソースディスプレイにウィンドウを配置
    const windowWidth = Math.min(800, sourceDisplay.width - 100);
    const windowHeight = Math.min(600, sourceDisplay.height - 100);
    openFinderWindow(
      sourceDisplay.x + 50,
      sourceDisplay.y + 50,
      windowWidth,
      windowHeight
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-resolution-adapt');
    await spinshelf.attachData('before-window', beforePos);

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウが移動先ディスプレイに合わせてリサイズされたことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-resolution-adapt');
    await spinshelf.attachData('after-window', afterPos);

    expect(afterPos).not.toBeNull();

    // ウィンドウがターゲットディスプレイ内に収まっていること
    expect(afterPos!.x).toBeGreaterThanOrEqual(targetDisplay.x);
    expect(afterPos!.y).toBeGreaterThanOrEqual(targetDisplay.y);
    expect(afterPos!.x + afterPos!.width).toBeLessThanOrEqual(targetDisplay.x + targetDisplay.width);
    expect(afterPos!.y + afterPos!.height).toBeLessThanOrEqual(targetDisplay.y + targetDisplay.height);

    await spinshelf.attachData('adaptation-result', {
      fitsInTarget: true,
      widthRatio: afterPos!.width / beforePos!.width,
      heightRatio: afterPos!.height / beforePos!.height,
    });
  });
});
