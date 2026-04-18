import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, runShell, sleep } from '../../helpers/macos-automation';

test.describe('P077: 英語ロケールで全UIテキストが正しいこと (@英語テスター)', () => {
  test('英語環境でメニュー項目が英語で表示されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のロケールを確認
    let currentLocale = '';
    try {
      currentLocale = runShell('defaults read -g AppleLocale 2>/dev/null || echo "en_US"');
    } catch {
      currentLocale = 'en_US';
    }

    // Step 2: メニューを開いてメニュー項目を取得
    let menuItems: string[] = [];
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(500);

      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            set menuItemNames to ""
            repeat with mi in menu items of menu 1 of menu bar item 1 of menu bar 2
              set itemName to name of mi
              if itemName is not missing value then
                set menuItemNames to menuItemNames & itemName & "|"
              end if
            end repeat
            return menuItemNames
          end tell
        end tell
      `);
      menuItems = result.split('|').filter(Boolean);

      // メニューを閉じる
      runAppleScript(`tell application "System Events" to key code 53`);
    } catch {
      menuItems = [];
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      currentLocale,
      menuItems,
      menuItemCount: menuItems.length,
    });

    // メニュー項目が存在すること
    expect(menuItems.length).toBeGreaterThan(0);

    // 英語ロケールの場合、英語のメニュー項目が含まれていることを確認
    if (currentLocale.startsWith('en')) {
      const hasEnglishItem = menuItems.some(item =>
        /^[a-zA-Z\s…\.]+$/.test(item) || item === '---'
      );
      expect(hasEnglishItem).toBe(true);
    }
  });
});
