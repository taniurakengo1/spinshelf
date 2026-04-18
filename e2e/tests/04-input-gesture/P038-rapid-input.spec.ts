import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rapidRotate } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P038: 高速連続入力 (@連打テスター)', () => {
  test('高速連続入力で再入防止が機能すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    // 50ms間隔で10回の高速連続入力
    rapidRotate('right', 10, 50);
    await spinshelf.waitForRotation();

    const appStillRunning = isAppRunning();
    const positionAfter = getWindowPosition('Finder');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      rapidInputCount: 10,
      intervalMs: 50,
      appStillRunning,
      windowExists: positionAfter !== null,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // ウィンドウが存在すること
    expect(positionAfter).not.toBeNull();
  });
});
