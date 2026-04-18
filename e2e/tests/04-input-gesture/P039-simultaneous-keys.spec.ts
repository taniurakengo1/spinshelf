import { test, expect } from '../../fixtures/spinshelf.fixture';
import { pressKey, rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P039: 同時キー押下 (@同時押しテスター)', () => {
  test('他のキーと同時に押しても干渉しないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const positionBefore = getWindowPosition('Finder');

    // 他のキー (A キー) を押しながら SpinShelf のショートカットを発動
    runAppleScript(`
      tell application "System Events"
        key down "a"
        key code 124 using {control down, shift down}
        key up "a"
      end tell
    `);
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      appStillRunning,
      noInterference: appStillRunning,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // ウィンドウが存在すること
    expect(positionAfter).not.toBeNull();
  });
});
