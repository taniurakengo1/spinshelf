import { test, expect } from '../../fixtures/spinshelf.fixture';
import { pressKey } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P033: 修飾キーのみ押下 (@修飾キーテスター)', () => {
  test('修飾キーだけ押しても反応しないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // Ctrl のみ (keyCode=59)
    pressKey(59, []);
    await sleep(500);

    // Shift のみ (keyCode=56)
    pressKey(56, []);
    await sleep(500);

    // Ctrl+Shift のみ（矢印キーなし）
    pressKey(59, ['shift']);
    await sleep(500);

    const positionAfter = getWindowPosition('Finder');
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      windowDidNotMove: positionBefore!.x === positionAfter!.x && positionBefore!.y === positionAfter!.y,
    });

    // ウィンドウが動いていないこと
    expect(positionAfter!.x).toBe(positionBefore!.x);
    expect(positionAfter!.y).toBe(positionBefore!.y);
  });
});
