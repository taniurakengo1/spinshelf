import { test, expect } from '../../fixtures/spinshelf.fixture';
import { scrollWithModifiers } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P037: 縦スクロール無視 (@方向テスター)', () => {
  test('縦スクロールでは発火しないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // 縦スクロール（deltaX = 0 相当）をシミュレート
    // scrollWithModifiers に deltaX=0 を渡す
    scrollWithModifiers(0, ['control', 'shift']);
    await sleep(1000);

    const positionAfter = getWindowPosition('Finder');
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      verticalScrollIgnored: positionBefore!.x === positionAfter!.x,
    });

    // 縦スクロールではウィンドウが動いていないこと
    expect(positionAfter!.x).toBe(positionBefore!.x);
    expect(positionAfter!.y).toBe(positionBefore!.y);
  });
});
