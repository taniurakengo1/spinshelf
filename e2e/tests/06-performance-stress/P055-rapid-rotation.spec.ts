import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rapidRotate } from '../../helpers/keyboard-helpers';
import { openFinderWindow } from '../../helpers/window-helpers';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P055: 連続回転ストレス (@ストレステスター)', () => {
  test('50回連続回転でクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');
    const pidBefore = getAppPID();

    // 50回の高速回転
    const startTime = Date.now();
    rapidRotate('right', 50, 200);
    await spinshelf.waitForRotation();
    const totalTimeMs = Date.now() - startTime;

    const pidAfter = getAppPID();
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      rotationCount: 50,
      totalTimeMs,
      pidBefore,
      pidAfter,
      appStillRunning,
      sameProcess: pidBefore === pidAfter,
      noCrash: appStillRunning && pidBefore === pidAfter,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // 同じプロセスであること（再起動していない）
    expect(pidAfter).toBe(pidBefore);
  });
});
