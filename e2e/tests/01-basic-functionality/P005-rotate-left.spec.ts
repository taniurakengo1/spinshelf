import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateLeft } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P005: 左回転 (@回帰テスター)', () => {
  test('デフォルトショートカット(Ctrl+Shift+←)で左回転が動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '左回転テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const rightmostDisplay = displays[displays.length - 1];
    const expectedTargetDisplay = displays[displays.length - 2];

    // Step 1: 右端ディスプレイにFinderウィンドウを配置
    openFinderWindow(
      rightmostDisplay.x + 50,
      rightmostDisplay.y + 50,
      600,
      400
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-rotate-left');
    await spinshelf.attachData('before-position', beforePos);

    // Step 2: 左回転ショートカットを実行
    rotateLeft();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウが左方向に移動したことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-rotate-left');
    await spinshelf.attachData('after-position', afterPos);

    expect(afterPos).not.toBeNull();
    expect(beforePos).not.toBeNull();

    const movedLeft =
      afterPos!.x >= expectedTargetDisplay.x &&
      afterPos!.x < expectedTargetDisplay.x + expectedTargetDisplay.width;

    await spinshelf.attachData('rotation-result', {
      movedLeft,
      beforeX: beforePos!.x,
      afterX: afterPos!.x,
      expectedDisplayX: expectedTargetDisplay.x,
    });

    expect(movedLeft).toBe(true);
  });
});
