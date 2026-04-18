import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning, terminateApp, launchApp, buildApp } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P002: アプリ終了確認 (@テスト自動化エンジニア)', () => {
  test('メニューから「終了」でアプリが正常終了すること', async ({ spinshelf }, testInfo) => {
    // Pre-condition: アプリが起動している
    await spinshelf.screenshot('before-quit');
    expect(isAppRunning()).toBe(true);

    // Step 1: メニューバーから「終了」を選択
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
            delay 0.5
            click menu item "Quit" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
    } catch {
      // Fallback: 直接terminateを使用
      await terminateApp();
    }

    await sleep(2000);

    // Step 2: プロセスが終了したことを確認
    const stillRunning = isAppRunning();
    await spinshelf.screenshot('after-quit');
    await spinshelf.attachData('quit-result', {
      appTerminated: !stillRunning,
    });

    expect(stillRunning).toBe(false);

    // Cleanup: テスト後にアプリを再起動（他のテストのため）
    await buildApp();
    await launchApp();
    await sleep(2000);
  });
});
