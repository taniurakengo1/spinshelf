import { test, expect } from '../../fixtures/spinshelf.fixture';
import { terminateApp, launchApp, isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { sleep, runShell } from '../../helpers/macos-automation';

test.describe('P061: アプリがクラッシュ後に再起動できること (@クラッシュテスター)', () => {
  test('アプリを強制終了した後に再起動できること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のアプリが起動していることを確認
    const runningBefore = isAppRunning();
    const pidBefore = getAppPID();
    expect(runningBefore).toBe(true);

    // Step 2: アプリを強制終了（クラッシュをシミュレート）
    try {
      runShell('pkill -9 -f SpinShelf || true');
    } catch {
      // Ignore errors
    }
    await sleep(2000);

    const runningAfterKill = isAppRunning();
    expect(runningAfterKill).toBe(false);

    // Step 3: アプリを再起動
    await launchApp();
    await sleep(3000);

    const runningAfterRestart = isAppRunning();
    const pidAfterRestart = getAppPID();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      pidBefore,
      runningAfterKill,
      runningAfterRestart,
      pidAfterRestart,
      pidChanged: pidBefore !== pidAfterRestart,
    });

    expect(runningAfterRestart).toBe(true);
    expect(pidAfterRestart).not.toBeNull();
    expect(pidAfterRestart).not.toBe(pidBefore);
  });
});
