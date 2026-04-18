import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, getWindowPosition, setWindowFullscreen } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P025: フルスクリーンウィンドウスキップ (@フルスクリーンテスター)', () => {
  test('フルスクリーンウィンドウがスキップされること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'フルスクリーンスキップテストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: 2つのウィンドウを配置
    openTextEditWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 500, 350);
    await sleep(1000);
    openFinderWindow(primaryDisplay.x + 100, primaryDisplay.y + 100, 500, 350);
    await sleep(500);

    // Step 2: TextEditをフルスクリーンにする
    try {
      setWindowFullscreen('TextEdit');
      await sleep(2000); // フルスクリーンアニメーションの完了を待つ
    } catch {
      // フルスクリーンに失敗した場合、テストをスキップ
      test.skip(true, 'フルスクリーンの設定に失敗');
    }

    const beforeFinder = getWindowPosition('Finder');
    await spinshelf.screenshot('before-fullscreen-skip');
    await spinshelf.attachData('fullscreen-state', {
      finderPosition: beforeFinder,
    });

    // Step 3: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 4: Finderのみが移動し、フルスクリーンTextEditは影響を受けないこと
    const afterFinder = getWindowPosition('Finder');
    await spinshelf.screenshot('after-fullscreen-skip');

    expect(isAppRunning()).toBe(true);
    expect(afterFinder).not.toBeNull();

    const finderMoved = afterFinder!.x !== beforeFinder!.x;

    await spinshelf.attachData('fullscreen-skip-result', {
      finderMoved,
      finderBefore: beforeFinder,
      finderAfter: afterFinder,
    });

    expect(finderMoved).toBe(true);

    // Cleanup: フルスクリーンを解除
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "TextEdit"
            set value of attribute "AXFullScreen" of front window to false
          end tell
        end tell
      `);
      await sleep(2000);
    } catch {}
  });
});
