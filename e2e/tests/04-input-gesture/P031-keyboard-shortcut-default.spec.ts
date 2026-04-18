import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateLeft, rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P031: デフォルトキーボードショートカット (@入力テスター)', () => {
  test('デフォルトのCtrl+Shift+矢印キーショートカットが動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    const positionBefore = getWindowPosition('Finder');
    expect(positionBefore).not.toBeNull();

    // Ctrl+Shift+Right で右回転
    rotateRight();
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    expect(positionAfter).not.toBeNull();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      moved: positionBefore!.x !== positionAfter!.x,
    });

    // ウィンドウが別のディスプレイに移動していること
    expect(positionBefore!.x).not.toBe(positionAfter!.x);
  });
});
