import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P036: スクロールクールダウン (@タイミングテスター)', () => {
  test('スクロールクールダウン(0.5秒)が機能すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // 1回目の回転
    rotateRight();
    await spinshelf.waitForRotation();
    const positionAfterFirst = getWindowPosition('Finder');

    // クールダウン内に2回目の入力（0.1秒後）
    await sleep(100);
    rotateRight();
    await sleep(500);
    const positionAfterSecondQuick = getWindowPosition('Finder');

    // クールダウン後に3回目の入力（0.5秒以上後）
    await sleep(600);
    rotateRight();
    await spinshelf.waitForRotation();
    const positionAfterThird = getWindowPosition('Finder');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfterFirst,
      positionAfterSecondQuick,
      positionAfterThird,
      cooldownBlocked: positionAfterFirst!.x === positionAfterSecondQuick!.x,
      thirdRotated: positionAfterSecondQuick!.x !== positionAfterThird!.x,
    });

    // クールダウン内の2回目は無視され、位置が変わらないこと
    expect(positionAfterFirst!.x).toBe(positionAfterSecondQuick!.x);
  });
});
