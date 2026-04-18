import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P056: 高解像度ディスプレイ (@高解像度テスター)', () => {
  test('5K/6K解像度ディスプレイでも正常動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    // 高解像度ディスプレイの検出
    const highResDisplays = spinshelf.displays.filter(d => d.width >= 2560);
    const hasHighRes = highResDisplays.length > 0;

    await spinshelf.screenshot('before');

    // 最大解像度のディスプレイにウィンドウを配置
    const targetDisplay = highResDisplays.length > 0
      ? highResDisplays[0]
      : spinshelf.displays[0];

    openFinderWindow(
      targetDisplay.x + 100,
      targetDisplay.y + 100,
      Math.min(targetDisplay.width - 200, 1200),
      Math.min(targetDisplay.height - 200, 800)
    );
    await sleep(1000);

    const positionBefore = getWindowPosition('Finder');

    // 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      hasHighResDisplay: hasHighRes,
      highResDisplays: highResDisplays.map(d => ({ id: d.id, width: d.width, height: d.height })),
      allDisplays: spinshelf.displays.map(d => ({ id: d.id, width: d.width, height: d.height })),
      positionBefore,
      positionAfter,
      appStillRunning,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // ウィンドウが存在すること
    expect(positionAfter).not.toBeNull();
  });
});
