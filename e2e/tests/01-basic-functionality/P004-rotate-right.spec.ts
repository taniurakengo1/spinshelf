import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition, closeAllTestWindows } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P004: 右回転 (@機能テスター)', () => {
  test('デフォルトショートカット(Ctrl+Shift+→)で右回転が動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '右回転テストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    const secondDisplay = spinshelf.displays.find(d => !d.isMain) || spinshelf.displays[1];

    // Step 1: プライマリディスプレイにFinderウィンドウを配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 600, 400);
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-rotate-right');
    await spinshelf.attachData('before-position', beforePos);

    // Step 2: 右回転ショートカットを実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウが移動したことを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-rotate-right');
    await spinshelf.attachData('after-position', afterPos);

    expect(afterPos).not.toBeNull();
    expect(beforePos).not.toBeNull();

    // ウィンドウが別のディスプレイに移動したことを確認
    const movedToOtherDisplay =
      afterPos!.x >= secondDisplay.x &&
      afterPos!.x < secondDisplay.x + secondDisplay.width;

    await spinshelf.attachData('rotation-result', {
      movedToOtherDisplay,
      beforeX: beforePos!.x,
      afterX: afterPos!.x,
      targetDisplayX: secondDisplay.x,
    });

    expect(movedToOtherDisplay).toBe(true);
  });
});
