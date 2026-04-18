import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P003: メニューバーアイコン (@UI/UXテスター)', () => {
  test('メニューバーアイコンクリックでメニューが表示されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before-menubar-click');

    // Step 1: メニューバーアイコンをクリック
    let menuItems: string[] = [];
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(1000);

      // Step 2: メニューが表示されていることを確認
      await spinshelf.screenshot('menu-opened');

      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            set menuItemNames to ""
            repeat with mi in menu items of menu 1 of menu bar item 1 of menu bar 2
              set menuItemNames to menuItemNames & name of mi & ","
            end repeat
            return menuItemNames
          end tell
        end tell
      `);
      menuItems = result.split(',').filter(Boolean);
    } catch (e) {
      // メニューアクセスに失敗した場合
    }

    // Step 3: メニューを閉じる
    try {
      runAppleScript(`
        tell application "System Events"
          key code 53
        end tell
      `);
    } catch {}

    await sleep(500);
    await spinshelf.screenshot('after-menu-closed');
    await spinshelf.attachData('menu-items', {
      items: menuItems,
      itemCount: menuItems.length,
    });

    expect(menuItems.length).toBeGreaterThan(0);
  });
});
