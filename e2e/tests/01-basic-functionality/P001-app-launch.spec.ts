import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { runAppleScript } from '../../helpers/macos-automation';

test.describe('P001: アプリ起動確認 (@QAリーダー)', () => {
  test('アプリが正常に起動し、メニューバーアイコンが表示されること', async ({ spinshelf }, testInfo) => {
    // Step 1: アプリプロセスが起動していることを確認
    await spinshelf.screenshot('before-launch-check');
    const running = isAppRunning();
    const pid = getAppPID();

    await spinshelf.attachData('process-info', {
      isRunning: running,
      pid,
      displayCount: spinshelf.displayCount,
    });

    expect(running).toBe(true);
    expect(pid).not.toBeNull();

    // Step 2: メニューバーにSpinShelfのステータスアイテムが存在することを確認
    let menuBarItemExists = false;
    try {
      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            return exists menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      menuBarItemExists = result === 'true';
    } catch {
      menuBarItemExists = false;
    }

    await spinshelf.screenshot('after-launch-check');
    await spinshelf.attachData('menubar-check', {
      menuBarItemExists,
    });

    expect(menuBarItemExists).toBe(true);
  });
});
