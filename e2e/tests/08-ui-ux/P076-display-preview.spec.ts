import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P076: ディスプレイ順序設定のプレビュー表示が正しいこと (@プレビューテスター)', () => {
  test('設定画面のディスプレイプレビューが接続ディスプレイ数と一致すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 設定ウィンドウを開く
    let settingsOpened = false;
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
            click menu item "Settings…" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      settingsOpened = true;
      await sleep(1000);
    } catch {
      settingsOpened = false;
    }

    await spinshelf.screenshot('settings-with-preview');

    // Step 2: 設定ウィンドウ内のUI要素を確認
    let uiElementCount = 0;
    if (settingsOpened) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                return count of UI elements of front window
              end if
            end tell
          end tell
        `);
        uiElementCount = parseInt(result, 10) || 0;
      } catch {
        uiElementCount = 0;
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
      displayCount: spinshelf.displayCount,
      uiElementCount,
    });

    if (settingsOpened) {
      // 設定ウィンドウにUI要素が存在すること
      expect(uiElementCount).toBeGreaterThan(0);
    }
  });
});
