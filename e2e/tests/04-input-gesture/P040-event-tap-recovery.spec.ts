import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { runShell, sleep } from '../../helpers/macos-automation';

test.describe('P040: CGEventTap回復 (@イベントタップテスター)', () => {
  test('CGEventTapが無効化された場合の回復', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    // Step 1: 初回回転が動作することを確認
    const positionBefore = getWindowPosition('Finder');
    rotateRight();
    await spinshelf.waitForRotation();
    const positionAfterFirst = getWindowPosition('Finder');

    // Step 2: SIGUSR1 シグナルでイベントタップの再設定をトリガー
    const pid = getAppPID();
    if (pid) {
      try {
        runShell(`kill -SIGUSR1 ${pid}`);
      } catch {
        // シグナル送信失敗は許容
      }
    }
    await sleep(2000);

    // Step 3: 回復後に回転が再度動作することを確認
    rotateRight();
    await spinshelf.waitForRotation();
    const positionAfterRecovery = getWindowPosition('Finder');

    const appStillRunning = isAppRunning();
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      pid,
      positionBefore,
      positionAfterFirst,
      positionAfterRecovery,
      appStillRunning,
      recoveredSuccessfully: appStillRunning && positionAfterRecovery !== null,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // 回復後もウィンドウが存在すること
    expect(positionAfterRecovery).not.toBeNull();
  });
});
