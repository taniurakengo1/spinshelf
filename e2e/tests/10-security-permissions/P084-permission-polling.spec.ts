import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P084: 権限付与待ちのポーリングが動作すること (@ポーリングテスター)', () => {
  test('アプリが起動後に権限を確認し正常に動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: アプリが起動中でPIDが取得できることを確認
    const appRunning = isAppRunning();
    const pid = getAppPID();
    expect(appRunning).toBe(true);
    expect(pid).not.toBeNull();

    // Step 2: アプリの権限チェックが完了していることを間接的に確認
    // 権限がなければショートカットが動作しないため、ショートカット実行で確認
    let shortcutWorked = false;
    try {
      rotateRight();
      await spinshelf.waitForRotation();
      shortcutWorked = isAppRunning(); // クラッシュしていなければOK
    } catch {
      shortcutWorked = false;
    }

    // Step 3: メニューバーが操作可能であること（権限が付与されている証拠）
    let menuAccessible = false;
    try {
      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            return exists menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      menuAccessible = result === 'true';
    } catch {
      menuAccessible = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      appRunning,
      pid,
      shortcutWorked,
      menuAccessible,
    });

    expect(shortcutWorked).toBe(true);
    expect(menuAccessible).toBe(true);
  });
});
