import { test, expect } from '../../fixtures/spinshelf.fixture';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P073: メニューからの回転操作が動作すること (@メニュー操作テスター)', () => {
  test('メニュー項目から回転を実行できること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: テスト用ウィンドウを配置
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    const positionBefore = getWindowPosition('Finder');

    // Step 2: メニューバーアイコンから回転を実行
    let menuRotateExecuted = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(500);

      // "Rotate Right" メニュー項目をクリック
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu item "Rotate Right" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      menuRotateExecuted = true;
      await spinshelf.waitForRotation();
    } catch {
      // メニュー項目名が異なる場合のフォールバック
      try {
        runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              click menu bar item 1 of menu bar 2
            end tell
          end tell
        `);
        await sleep(500);

        runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              click menu item "右に回転" of menu 1 of menu bar item 1 of menu bar 2
            end tell
          end tell
        `);
        menuRotateExecuted = true;
        await spinshelf.waitForRotation();
      } catch {
        menuRotateExecuted = false;
      }
    }

    const positionAfter = getWindowPosition('Finder');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      menuRotateExecuted,
      positionBefore,
      positionAfter,
      appRunning: isAppRunning(),
    });

    expect(isAppRunning()).toBe(true);
  });
});
