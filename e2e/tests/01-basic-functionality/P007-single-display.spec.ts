import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, rotateLeft } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P007: 単一ディスプレイ環境 (@環境テスター)', () => {
  test('単一ディスプレイ環境でエラーなく動作すること（回転はスキップ）', async ({ spinshelf }, testInfo) => {
    test.skip(spinshelf.isMultiDisplay, 'このテストは単一ディスプレイ環境で実行');

    const display = spinshelf.displays[0];

    // Step 1: ウィンドウを配置
    openFinderWindow(display.x + 100, display.y + 100, 500, 350);
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-rotate-single-display');
    await spinshelf.attachData('before-state', {
      position: beforePos,
      displayCount: spinshelf.displayCount,
    });

    // Step 2: 右回転を試行（エラーにならないことを確認）
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: アプリがクラッシュしていないことを確認
    const appStillRunning = isAppRunning();
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-rotate-single-display');

    await spinshelf.attachData('after-state', {
      appStillRunning,
      position: afterPos,
      positionUnchanged: afterPos?.x === beforePos?.x && afterPos?.y === beforePos?.y,
    });

    expect(appStillRunning).toBe(true);

    // Step 4: 左回転も同様にエラーにならないことを確認
    rotateLeft();
    await spinshelf.waitForRotation();

    const afterLeftPos = getWindowPosition('Finder');
    expect(isAppRunning()).toBe(true);

    // ウィンドウ位置が変わらないことを確認（単一ディスプレイなので移動先がない）
    expect(afterLeftPos?.x).toBe(beforePos?.x);
    expect(afterLeftPos?.y).toBe(beforePos?.y);
  });
});
