import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, pressKey } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P067: 仮想デスクトップ(Spaces)との干渉がないこと (@Spacesテスター)', () => {
  test('Spaces切替後に回転操作が正常に動作し干渉しないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: テスト用ウィンドウを配置
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    // Step 2: 回転操作が正常に動作することを確認（ベースライン）
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterBaseline = isAppRunning();
    expect(runningAfterBaseline).toBe(true);

    // Step 3: Spacesの切替を試みる（Ctrl+Right Arrow）
    let spacesSwitched = false;
    try {
      pressKey(124, ['control']); // Ctrl + Right Arrow = 次のSpace
      spacesSwitched = true;
      await sleep(1500);

      // 元のSpaceに戻る
      pressKey(123, ['control']); // Ctrl + Left Arrow = 前のSpace
      await sleep(1500);
    } catch {
      spacesSwitched = false;
    }

    // Step 4: Spaces切替後に回転操作が正常に動作することを確認
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterSpaces = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningAfterBaseline,
      spacesSwitched,
      runningAfterSpaces,
    });

    expect(runningAfterSpaces).toBe(true);
  });
});
