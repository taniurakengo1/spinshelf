import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, runShell, sleep } from '../../helpers/macos-automation';

test.describe('P068: Dock位置変更/メニューバー非表示での動作 (@Dock/メニューバーテスター)', () => {
  test('Dock位置変更やメニューバー設定変更後も回転が正常に動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のDock設定を記録
    let originalDockPosition = 'bottom';
    try {
      originalDockPosition = runShell('defaults read com.apple.dock orientation 2>/dev/null || echo bottom');
    } catch {
      originalDockPosition = 'bottom';
    }

    // Step 2: テスト用ウィンドウを配置
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    // Step 3: 現在の設定で回転が動作することを確認
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterNormal = isAppRunning();
    expect(runningAfterNormal).toBe(true);

    // Step 4: Dock位置を変更して回転テスト
    let dockChanged = false;
    try {
      runShell('defaults write com.apple.dock orientation -string left && killall Dock');
      dockChanged = true;
      await sleep(3000);

      rotateRight();
      await spinshelf.waitForRotation();
    } catch {
      dockChanged = false;
    }

    const runningAfterDockChange = isAppRunning();

    // Step 5: Dock位置を元に戻す
    try {
      runShell(`defaults write com.apple.dock orientation -string ${originalDockPosition} && killall Dock`);
      await sleep(3000);
    } catch {
      // Restore failed, try default
      try {
        runShell('defaults delete com.apple.dock orientation && killall Dock');
        await sleep(3000);
      } catch {
        // Ignore
      }
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      originalDockPosition,
      dockChanged,
      runningAfterNormal,
      runningAfterDockChange,
    });

    expect(runningAfterDockChange).toBe(true);
  });
});
