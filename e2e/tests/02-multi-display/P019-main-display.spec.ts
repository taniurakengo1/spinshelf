import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getMainDisplay, getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P019: メインディスプレイ扱い (@メインディスプレイテスター)', () => {
  test('メインディスプレイの特別扱いが不要であること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'メインディスプレイテストには複数ディスプレイが必要');

    const mainDisplay = getMainDisplay();
    const otherDisplays = spinshelf.displays.filter(d => !d.isMain);

    await spinshelf.screenshot('before-main-display-test');
    await spinshelf.attachData('display-info', {
      mainDisplay: { id: mainDisplay.id, x: mainDisplay.x, y: mainDisplay.y },
      otherDisplays: otherDisplays.map(d => ({ id: d.id, x: d.x, y: d.y })),
    });

    // Step 1: メインディスプレイからの回転
    openFinderWindow(mainDisplay.x + 50, mainDisplay.y + 50, 500, 350);
    await sleep(1000);

    rotateRight();
    await spinshelf.waitForRotation();

    const afterFromMain = getWindowPosition('Finder');
    const displayAfterFromMain = afterFromMain ? getDisplayForPosition(afterFromMain.x, afterFromMain.y) : null;

    await spinshelf.screenshot('after-rotate-from-main');

    // ウィンドウがメインディスプレイから別のディスプレイに移動したこと
    expect(displayAfterFromMain?.id).not.toBe(mainDisplay.id);

    // Step 2: 非メインディスプレイからの回転も同様に動作すること
    const targetDisplay = otherDisplays[0];
    openFinderWindow(targetDisplay.x + 50, targetDisplay.y + 50, 500, 350);
    await sleep(1000);

    rotateRight();
    await spinshelf.waitForRotation();

    const afterFromOther = getWindowPosition('Finder');
    const displayAfterFromOther = afterFromOther ? getDisplayForPosition(afterFromOther.x, afterFromOther.y) : null;

    await spinshelf.screenshot('after-rotate-from-other');
    await spinshelf.attachData('main-display-result', {
      fromMainMovedTo: displayAfterFromMain?.id,
      fromOtherMovedTo: displayAfterFromOther?.id,
      mainDisplayNotSpecial: true,
    });

    // 非メインディスプレイからも正常に移動すること
    expect(displayAfterFromOther?.id).not.toBe(targetDisplay.id);
  });
});
