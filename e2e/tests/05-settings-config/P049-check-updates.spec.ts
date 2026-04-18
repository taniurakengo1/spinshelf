import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';
import { isAppRunning } from '../../helpers/app-lifecycle';

test.describe('P049: アップデート確認 (@アップデートテスター)', () => {
  test('アップデート確認機能が動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // メニューバーから「Check for Updates」を選択
    let checkTriggered = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
            delay 0.5
            click menu item "Check for Updates…" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(2000);
      checkTriggered = true;
    } catch {
      checkTriggered = false;
    }

    const appStillRunning = isAppRunning();

    // アップデートダイアログが表示された場合はESCで閉じる
    try {
      runAppleScript(`
        tell application "System Events"
          key code 53
        end tell
      `);
    } catch {}
    await sleep(500);

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      checkTriggered,
      appStillRunning,
    });

    // アップデート確認がトリガーされたこと
    expect(checkTriggered).toBe(true);
    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
  });
});
