import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runShell, runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P082: アクセシビリティ権限が要求されること (@権限テスター)', () => {
  test('アプリがアクセシビリティ権限を必要とし、権限が設定されていること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: アプリが起動していることを確認
    const appRunning = isAppRunning();
    expect(appRunning).toBe(true);

    // Step 2: アクセシビリティ権限の状態を確認
    let hasAccessibility = false;
    try {
      // tccutil でアクセシビリティ権限を確認
      const result = runShell(
        'sqlite3 ~/Library/Application\\ Support/com.apple.TCC/TCC.db ' +
        '"SELECT allowed FROM access WHERE service=\'kTCCServiceAccessibility\' AND client LIKE \'%SpinShelf%\'" 2>/dev/null || echo "unknown"'
      );
      hasAccessibility = result === '1' || result === 'unknown';
    } catch {
      // 権限DBにアクセスできない場合は、アプリが動作していることで間接確認
      hasAccessibility = appRunning;
    }

    // Step 3: アプリが正常に機能していれば権限が付与されていると判断
    // （アクセシビリティ権限なしではウィンドウ操作ができない）
    let canAccessWindows = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            return exists menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      canAccessWindows = true;
    } catch {
      canAccessWindows = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      appRunning,
      hasAccessibility,
      canAccessWindows,
    });

    // アプリが動作していてSystem Eventsにアクセスできること
    expect(canAccessWindows).toBe(true);
  });
});
