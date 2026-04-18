import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P006: カルーセル循環 (@境界値テスター)', () => {
  test('最後のディスプレイから最初のディスプレイに循環すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '循環テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const lastDisplay = displays[displays.length - 1];
    const firstDisplay = displays[0];

    // Step 1: 最後のディスプレイにウィンドウを配置
    openFinderWindow(
      lastDisplay.x + 50,
      lastDisplay.y + 50,
      600,
      400
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-carousel-cycle');
    await spinshelf.attachData('before-position', {
      position: beforePos,
      onLastDisplay: lastDisplay.id,
    });

    // Step 2: 右回転を実行（最後→最初への循環を期待）
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウが最初のディスプレイに移動したことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-carousel-cycle');

    expect(afterPos).not.toBeNull();

    const cycledToFirst =
      afterPos!.x >= firstDisplay.x &&
      afterPos!.x < firstDisplay.x + firstDisplay.width;

    await spinshelf.attachData('cycle-result', {
      position: afterPos,
      cycledToFirst,
      firstDisplayX: firstDisplay.x,
      lastDisplayX: lastDisplay.x,
    });

    expect(cycledToFirst).toBe(true);
  });
});
