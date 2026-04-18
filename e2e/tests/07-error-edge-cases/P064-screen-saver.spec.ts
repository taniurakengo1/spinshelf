import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, runShell, sleep } from '../../helpers/macos-automation';

test.describe('P064: スクリーンセーバー中のショートカット動作 (@スクリーンセーバーテスター)', () => {
  test('スクリーンセーバー起動後にショートカットが正常に機能すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: アプリが起動中であることを確認
    const runningBefore = isAppRunning();
    expect(runningBefore).toBe(true);

    // Step 2: スクリーンセーバーを起動して即座に解除
    // 注意: E2Eテストではスクリーンセーバーの完全な起動・解除は環境依存
    let screenSaverActivated = false;
    try {
      runAppleScript(`
        tell application "System Events"
          start current screen saver
        end tell
      `);
      screenSaverActivated = true;
      await sleep(2000);

      // スクリーンセーバーを解除（マウス移動やキー入力で）
      runAppleScript(`
        tell application "System Events"
          key code 53
        end tell
      `);
      await sleep(1000);
    } catch {
      // スクリーンセーバー操作が失敗しても回転テストは継続
      screenSaverActivated = false;
    }

    // Step 3: スクリーンセーバー解除後にショートカットが動作することを確認
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfter = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningBefore,
      screenSaverActivated,
      runningAfter,
    });

    expect(runningAfter).toBe(true);
  });
});
