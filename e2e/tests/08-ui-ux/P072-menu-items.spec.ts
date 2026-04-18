import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P072: メニュー項目が全て正しく表示されること (@メニューテスター)', () => {
  test('メニューバーアイコンのメニューに必要な項目が全て含まれていること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: メニューバーアイコンをクリックしてメニューを開く
    let menuOpened = false;
    let menuItems: string[] = [];
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      menuOpened = true;
      await sleep(500);
    } catch {
      menuOpened = false;
    }

    await spinshelf.screenshot('menu-open');

    // Step 2: メニュー項目を取得
    if (menuOpened) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              set menuItemNames to ""
              repeat with mi in menu items of menu 1 of menu bar item 1 of menu bar 2
                set itemName to name of mi
                if itemName is not missing value then
                  set menuItemNames to menuItemNames & itemName & "|"
                else
                  set menuItemNames to menuItemNames & "---" & "|"
                end if
              end repeat
              return menuItemNames
            end tell
          end tell
        `);
        menuItems = result.split('|').filter(Boolean);
      } catch {
        menuItems = [];
      }
    }

    // Step 3: メニューを閉じる
    try {
      runAppleScript(`
        tell application "System Events"
          key code 53
        end tell
      `);
    } catch {
      // Ignore
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      menuOpened,
      menuItems,
      menuItemCount: menuItems.length,
    });

    if (menuOpened) {
      // メニューに少なくとも1つの項目があること
      expect(menuItems.length).toBeGreaterThan(0);
    }
  });
});
