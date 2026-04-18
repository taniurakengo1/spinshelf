import { test, expect } from '../../fixtures/spinshelf.fixture';
import { pressKey } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P034: 間違った修飾キー (@誤操作テスター)', () => {
  test('間違った修飾キーの組み合わせでは発火しないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // Cmd+Shift+Right (Ctrl ではなく Cmd)
    pressKey(124, ['command', 'shift']);
    await sleep(500);

    // Option+Shift+Right
    pressKey(124, ['option', 'shift']);
    await sleep(500);

    // Ctrl+Right (Shift なし)
    pressKey(124, ['control']);
    await sleep(500);

    const positionAfter = getWindowPosition('Finder');
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      noFalseActivation: positionBefore!.x === positionAfter!.x,
    });

    // ウィンドウが動いていないこと
    expect(positionAfter!.x).toBe(positionBefore!.x);
  });
});
