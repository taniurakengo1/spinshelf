import { test, expect } from '../../fixtures/spinshelf.fixture';
import { pressKey } from '../../helpers/keyboard-helpers';
import { setShortcut, resetAllDefaults } from '../../helpers/settings-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P032: カスタムショートカット (@ショートカットテスター)', () => {
  test.afterEach(async () => {
    resetAllDefaults();
    await sleep(500);
  });

  test('カスタムショートカットが正しく設定・動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    // Ctrl+Option+Right (keyCode=124, modifiers: control+option)
    setShortcut('right', 124, 0x40000 | 0x80000);
    await sleep(1000);

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // カスタムショートカット: Ctrl+Option+Right
    pressKey(124, ['control', 'option']);
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      customShortcutWorked: positionBefore!.x !== positionAfter!.x,
    });

    expect(positionBefore!.x).not.toBe(positionAfter!.x);
  });
});
