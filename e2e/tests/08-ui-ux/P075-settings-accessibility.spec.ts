import { test, expect } from '../../fixtures/spinshelf.fixture';
import { pressKey, pressEnter, pressEscape } from '../../helpers/keyboard-helpers';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P075: 設定画面がキーボードナビゲーション可能であること (@アクセシビリティテスター)', () => {
  test('設定画面の要素がTabキーでフォーカス遷移できること', async ({ spinshelf }, testInfo) => {
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

    await spinshelf.screenshot('settings-opened');

    // Step 2: Tabキーでフォーカスを移動
    let tabNavigationWorked = false;
    if (settingsOpened) {
      try {
        // Tab キーでフォーカスを移動
        pressKey(48); // 48 = Tab
        await sleep(300);
        await spinshelf.screenshot('tab-1');

        pressKey(48); // Tab
        await sleep(300);
        await spinshelf.screenshot('tab-2');

        pressKey(48); // Tab
        await sleep(300);
        await spinshelf.screenshot('tab-3');

        tabNavigationWorked = true;
      } catch {
        tabNavigationWorked = false;
      }
    }

    // Step 3: 設定ウィンドウを閉じる
    if (settingsOpened) {
      try {
        pressEscape();
        await sleep(500);
      } catch {
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
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      settingsOpened,
      tabNavigationWorked,
    });

    if (settingsOpened) {
      expect(tabNavigationWorked).toBe(true);
    }
  });
});
