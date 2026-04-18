import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P041: 設定ウィンドウ表示 (@設定画面テスター)', () => {
  test('設定ウィンドウが開くこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // メニューバーから設定を開く
    let settingsOpened = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
            delay 0.5
            click menu item "Settings…" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(1000);

      // 設定ウィンドウが存在することを確認
      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            return count of windows
          end tell
        end tell
      `);
      settingsOpened = parseInt(result, 10) > 0;
    } catch {
      settingsOpened = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      settingsOpened,
    });

    expect(settingsOpened).toBe(true);

    // クリーンアップ: 設定ウィンドウを閉じる
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
    } catch {}
  });
});
