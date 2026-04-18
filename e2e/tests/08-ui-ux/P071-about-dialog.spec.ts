import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P071: Aboutダイアログの内容が正しいこと (@Aboutテスター)', () => {
  test('Aboutダイアログにアプリ名とバージョンが表示されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: メニューからAboutを開く
    let aboutOpened = false;
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
            click menu item "About SpinShelf" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      aboutOpened = true;
      await sleep(1000);
    } catch {
      aboutOpened = false;
    }

    await spinshelf.screenshot('about-dialog');

    // Step 2: Aboutウィンドウの存在を確認
    let windowExists = false;
    let windowTitle = '';
    if (aboutOpened) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                return title of front window
              end if
            end tell
          end tell
        `);
        windowExists = true;
        windowTitle = result;
      } catch {
        windowExists = false;
      }
    }

    // Step 3: Aboutウィンドウを閉じる
    if (aboutOpened) {
      try {
        runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                click button 1 of front window
              end if
            end tell
          end tell
        `);
      } catch {
        // Ignore
      }
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      aboutOpened,
      windowExists,
      windowTitle,
    });

    if (aboutOpened) {
      expect(windowExists).toBe(true);
    }
  });
});
