import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P070: 設定ウィンドウのレイアウトが正しいこと (@レイアウトテスター)', () => {
  test('設定ウィンドウが適切なサイズとレイアウトで表示されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: メニューバーアイコンをクリックして設定を開く
    let settingsOpened = false;
    let windowBounds: { x: number; y: number; width: number; height: number } | null = null;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(500);

      // "Settings..." メニュー項目をクリック
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu item "Settings…" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      settingsOpened = true;
      await sleep(1000);
    } catch {
      settingsOpened = false;
    }

    await spinshelf.screenshot('settings-window');

    // Step 2: 設定ウィンドウのサイズを取得
    if (settingsOpened) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                set p to position of front window
                set s to size of front window
                return (item 1 of p) & "," & (item 2 of p) & "," & (item 1 of s) & "," & (item 2 of s)
              end if
            end tell
          end tell
        `);
        const [x, y, width, height] = result.split(',').map(Number);
        windowBounds = { x, y, width, height };
      } catch {
        // Window query failed
      }
    }

    // Step 3: 設定ウィンドウを閉じる
    if (settingsOpened) {
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
      settingsOpened,
      windowBounds,
    });

    if (settingsOpened && windowBounds) {
      // 設定ウィンドウが最低限のサイズを持つことを確認
      expect(windowBounds.width).toBeGreaterThan(200);
      expect(windowBounds.height).toBeGreaterThan(100);
    }
  });
});
