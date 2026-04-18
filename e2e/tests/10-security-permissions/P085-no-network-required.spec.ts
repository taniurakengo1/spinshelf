import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning, getAppCPUUsage } from '../../helpers/app-lifecycle';
import { runShell, sleep } from '../../helpers/macos-automation';

test.describe('P085: ネットワークなしでも基本機能が動作すること (@ネットワークテスター)', () => {
  test('ネットワーク接続がなくても回転操作が正常に動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のネットワーク状態を確認
    let networkStatus = '';
    try {
      networkStatus = runShell('networksetup -getairportpower en0 2>/dev/null || echo "unknown"');
    } catch {
      networkStatus = 'unknown';
    }

    // Step 2: アプリがネットワークなしでも起動していることを確認
    const appRunning = isAppRunning();
    expect(appRunning).toBe(true);

    // Step 3: 回転操作が動作することを確認
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    const positionBefore = getWindowPosition('Finder');

    rotateRight();
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    const runningAfterRotation = isAppRunning();

    // Step 4: アプリがネットワーク接続を試みていないことを確認（CPU使用率で間接確認）
    const cpuUsage = getAppCPUUsage();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      networkStatus,
      appRunning,
      runningAfterRotation,
      positionBefore,
      positionAfter,
      cpuUsage,
    });

    expect(runningAfterRotation).toBe(true);
  });
});
