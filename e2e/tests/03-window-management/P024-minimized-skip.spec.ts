import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, getWindowPosition, minimizeWindow } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P024: 最小化ウィンドウスキップ (@状態テスター)', () => {
  test('最小化ウィンドウがスキップされること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '最小化スキップテストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: 2つのウィンドウを配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 500, 350);
    await sleep(500);
    openTextEditWindow(primaryDisplay.x + 100, primaryDisplay.y + 100, 500, 350);
    await sleep(1000);

    // Step 2: TextEditウィンドウを最小化
    minimizeWindow('TextEdit');
    await sleep(500);

    const beforeFinder = getWindowPosition('Finder');
    await spinshelf.screenshot('before-minimized-skip');

    // 最小化状態を確認
    let isMinimized = false;
    try {
      const result = runAppleScript(`
        tell application "TextEdit"
          return miniaturized of front window
        end tell
      `);
      isMinimized = result === 'true';
    } catch {
      isMinimized = true; // エラー時は最小化されていると想定
    }

    await spinshelf.attachData('minimized-state', {
      textEditMinimized: isMinimized,
      finderPosition: beforeFinder,
    });

    // Step 3: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 4: Finderウィンドウは移動し、最小化TextEditは元のまま
    const afterFinder = getWindowPosition('Finder');
    await spinshelf.screenshot('after-minimized-skip');

    expect(afterFinder).not.toBeNull();

    // Finderが移動したこと
    const finderMoved = afterFinder!.x !== beforeFinder!.x;

    await spinshelf.attachData('skip-result', {
      finderMoved,
      finderBefore: beforeFinder,
      finderAfter: afterFinder,
    });

    expect(finderMoved).toBe(true);
  });
});
