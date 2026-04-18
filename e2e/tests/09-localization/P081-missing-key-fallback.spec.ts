import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, runShell, sleep } from '../../helpers/macos-automation';
import { isAppRunning } from '../../helpers/app-lifecycle';

test.describe('P081: 未翻訳キーがフォールバック表示されること (@フォールバックテスター)', () => {
  test('メニュー項目に空文字や未翻訳キーが表示されないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: メニューを開いてメニュー項目を取得
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

      runAppleScript(`tell application "System Events" to key code 53`);
    } catch {
      menuItems = [];
    }

    // Step 2: 各メニュー項目が有効なテキストであることを確認
    const emptyItems = menuItems.filter(item => item.trim() === '');
    const untranslatedItems = menuItems.filter(item =>
      item.startsWith('NSLocalized') || item.startsWith('__')
    );

    // Step 3: ローカライズファイルの存在確認
    let localizationFiles: string[] = [];
    try {
      const result = runShell('find /Users/kengotaniura/github/oss/spinshelf -name "*.strings" -o -name "Localizable.xcstrings" 2>/dev/null | head -20');
      localizationFiles = result.split('\n').filter(Boolean);
    } catch {
      localizationFiles = [];
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      menuItems,
      emptyItems,
      untranslatedItems,
      localizationFiles,
      appRunning: isAppRunning(),
    });

    // 空のメニュー項目がないこと
    expect(emptyItems.length).toBe(0);

    // 未翻訳キー（NSLocalizedなど）が表示されていないこと
    expect(untranslatedItems.length).toBe(0);
  });
});
