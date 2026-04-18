import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P017: 3画面巡回 (@マルチモニターテスター)', () => {
  test('3画面構成でA→B→C→Aの巡回が正しいこと', async ({ spinshelf }, testInfo) => {
    test.skip(spinshelf.displayCount < 3, '3画面巡回テストには3台のディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const [displayA, displayB, displayC] = displays;

    // Step 1: ディスプレイAにウィンドウを配置
    openFinderWindow(displayA.x + 50, displayA.y + 50, 500, 350);
    await sleep(1000);

    const posA = getWindowPosition('Finder');
    await spinshelf.screenshot('position-A');
    await spinshelf.attachData('step1-display-A', posA);

    // Step 2: 右回転 → ディスプレイBに移動
    rotateRight();
    await spinshelf.waitForRotation();

    const posB = getWindowPosition('Finder');
    const displayAtB = posB ? getDisplayForPosition(posB.x, posB.y) : null;
    await spinshelf.screenshot('position-B');
    await spinshelf.attachData('step2-display-B', {
      position: posB,
      displayId: displayAtB?.id,
      expectedId: displayB.id,
    });
    expect(displayAtB?.id).toBe(displayB.id);

    // Step 3: 右回転 → ディスプレイCに移動
    rotateRight();
    await spinshelf.waitForRotation();

    const posC = getWindowPosition('Finder');
    const displayAtC = posC ? getDisplayForPosition(posC.x, posC.y) : null;
    await spinshelf.screenshot('position-C');
    await spinshelf.attachData('step3-display-C', {
      position: posC,
      displayId: displayAtC?.id,
      expectedId: displayC.id,
    });
    expect(displayAtC?.id).toBe(displayC.id);

    // Step 4: 右回転 → ディスプレイA（循環）に移動
    rotateRight();
    await spinshelf.waitForRotation();

    const posCycled = getWindowPosition('Finder');
    const displayCycled = posCycled ? getDisplayForPosition(posCycled.x, posCycled.y) : null;
    await spinshelf.screenshot('position-A-cycled');
    await spinshelf.attachData('step4-cycle-to-A', {
      position: posCycled,
      displayId: displayCycled?.id,
      expectedId: displayA.id,
      cycleComplete: displayCycled?.id === displayA.id,
    });
    expect(displayCycled?.id).toBe(displayA.id);
  });
});
