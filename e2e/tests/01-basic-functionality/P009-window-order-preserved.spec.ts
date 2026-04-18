import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, getAllWindowPositions } from '../../helpers/window-helpers';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P009: z-order保持 (@詳細テスター)', () => {
  test('回転後もz-order（前面/背面順）が保持されること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'z-orderテストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: 2つのウィンドウを特定の順序で配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 500, 350);
    await sleep(500);
    openTextEditWindow(primaryDisplay.x + 100, primaryDisplay.y + 100, 500, 350);
    await sleep(500);

    // TextEditを前面にする
    runAppleScript('tell application "TextEdit" to activate');
    await sleep(500);

    // 前面ウィンドウを確認
    let frontAppBefore: string;
    try {
      frontAppBefore = runAppleScript(`
        tell application "System Events"
          return name of first application process whose frontmost is true
        end tell
      `);
    } catch {
      frontAppBefore = 'unknown';
    }

    await spinshelf.screenshot('before-zorder-test');
    await spinshelf.attachData('before-zorder', {
      frontApp: frontAppBefore,
    });

    // Step 2: 右回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: z-orderが保持されていることを確認
    let frontAppAfter: string;
    try {
      frontAppAfter = runAppleScript(`
        tell application "System Events"
          return name of first application process whose frontmost is true
        end tell
      `);
    } catch {
      frontAppAfter = 'unknown';
    }

    await spinshelf.screenshot('after-zorder-test');
    await spinshelf.attachData('after-zorder', {
      frontApp: frontAppAfter,
      orderPreserved: frontAppBefore === frontAppAfter,
    });

    // 前面アプリが同じであること（z-orderが保持されている）
    expect(frontAppAfter).toBe(frontAppBefore);
  });
});
