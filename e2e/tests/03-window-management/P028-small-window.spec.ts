import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P028: 小さいウィンドウ移動 (@最小ウィンドウテスター)', () => {
  test('非常に小さいウィンドウも正しく移動すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '小さいウィンドウテストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    // Step 1: 非常に小さいウィンドウを配置
    const tinyWidth = 150;
    const tinyHeight = 100;
    openFinderWindow(
      sourceDisplay.x + Math.floor(sourceDisplay.width / 2),
      sourceDisplay.y + Math.floor(sourceDisplay.height / 2),
      tinyWidth,
      tinyHeight
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-small-window');
    await spinshelf.attachData('before-small', {
      position: beforePos,
      windowSize: { width: tinyWidth, height: tinyHeight },
    });

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウが正しく移動したことを確認
    const afterPos = getWindowPosition('Finder');
    const afterDisplay = afterPos ? getDisplayForPosition(afterPos.x, afterPos.y) : null;
    await spinshelf.screenshot('after-small-window');

    expect(afterPos).not.toBeNull();
    expect(afterDisplay).not.toBeUndefined();

    // ウィンドウが移動先ディスプレイ内にあること
    const isOnTargetDisplay =
      afterPos!.x >= targetDisplay.x &&
      afterPos!.x < targetDisplay.x + targetDisplay.width;

    // ウィンドウサイズが極端に変わっていないこと（小さいウィンドウを拡大する必要はない）
    const sizePreserved =
      Math.abs(afterPos!.width - tinyWidth) < 50 &&
      Math.abs(afterPos!.height - tinyHeight) < 50;

    await spinshelf.attachData('small-window-result', {
      position: afterPos,
      displayId: afterDisplay?.id,
      isOnTargetDisplay,
      sizePreserved,
      actualSize: { width: afterPos!.width, height: afterPos!.height },
    });

    expect(isOnTargetDisplay).toBe(true);
  });
});
