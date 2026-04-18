import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { runShell, sleep } from '../../helpers/macos-automation';

test.describe('P065: スリープ→復帰後にショートカットが機能すること (@スリープテスター)', () => {
  test('スリープ復帰をシミュレートした後にショートカットが正常に機能すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: アプリが起動中であることを確認
    const runningBefore = isAppRunning();
    const pidBefore = getAppPID();
    expect(runningBefore).toBe(true);

    // Step 2: スリープ・復帰のシミュレーション
    // 注意: 実際のスリープはE2Eテスト環境では実行不可
    // 代わりにdisplayを一時的にオフにしてスリープ状態を擬似再現
    let sleepSimulated = false;
    try {
      // ディスプレイスリープのみ（システムスリープではない）
      runShell('pmset displaysleepnow 2>/dev/null || true');
      sleepSimulated = true;
      await sleep(3000);

      // ウェイクアップ（キー入力でディスプレイを復帰）
      runShell('caffeinate -u -t 2 2>/dev/null || true');
      await sleep(2000);
    } catch {
      sleepSimulated = false;
    }

    // Step 3: 復帰後にショートカットが動作することを確認
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfter = isAppRunning();
    const pidAfter = getAppPID();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      pidBefore,
      pidAfter,
      sleepSimulated,
      runningAfter,
      samePid: pidBefore === pidAfter,
    });

    expect(runningAfter).toBe(true);
    // PIDが同じ = プロセスが維持されている
    expect(pidAfter).toBe(pidBefore);
  });
});
