import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, countWindows } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P052: 多数ウィンドウ (@負荷テスター)', () => {
  test('20個以上のウィンドウでも正常動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    await spinshelf.screenshot('before');

    // 20個以上のウィンドウを開く
    const windowCount = 22;
    for (let i = 0; i < 11; i++) {
      const offsetX = (i % 5) * 50;
      const offsetY = Math.floor(i / 5) * 50;
      openFinderWindow(mainDisplay.x + 50 + offsetX, mainDisplay.y + 50 + offsetY, 400, 300);
      await sleep(300);
    }
    for (let i = 0; i < 11; i++) {
      const offsetX = (i % 5) * 50;
      const offsetY = Math.floor(i / 5) * 50;
      openTextEditWindow(mainDisplay.x + 100 + offsetX, mainDisplay.y + 100 + offsetY, 400, 300);
      await sleep(500);
    }

    const totalFinderWindows = countWindows('Finder');
    const totalTextEditWindows = countWindows('TextEdit');
    const totalWindows = totalFinderWindows + totalTextEditWindows;

    // 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      targetWindowCount: windowCount,
      actualFinderWindows: totalFinderWindows,
      actualTextEditWindows: totalTextEditWindows,
      totalWindows,
      appStillRunning,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // 十分な数のウィンドウが開いていたこと
    expect(totalWindows).toBeGreaterThanOrEqual(15);
  });
});
