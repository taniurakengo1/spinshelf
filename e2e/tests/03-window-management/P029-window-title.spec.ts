import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow } from '../../helpers/window-helpers';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P029: ウィンドウタイトル保持 (@メタデータテスター)', () => {
  test('移動後もウィンドウタイトルが保持されること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'タイトル保持テストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: Finderウィンドウを配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 500, 350);
    await sleep(1000);

    // Step 2: 移動前のウィンドウタイトルを取得
    let titleBefore: string;
    try {
      titleBefore = runAppleScript(`
        tell application "Finder"
          return name of front Finder window
        end tell
      `);
    } catch {
      titleBefore = 'unknown';
    }

    await spinshelf.screenshot('before-title-test');
    await spinshelf.attachData('before-title', { title: titleBefore });

    // Step 3: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 4: 移動後のウィンドウタイトルを取得
    let titleAfter: string;
    try {
      titleAfter = runAppleScript(`
        tell application "Finder"
          return name of front Finder window
        end tell
      `);
    } catch {
      titleAfter = 'unknown';
    }

    await spinshelf.screenshot('after-title-test');
    await spinshelf.attachData('title-comparison', {
      before: titleBefore,
      after: titleAfter,
      preserved: titleBefore === titleAfter,
    });

    // ウィンドウタイトルが変わっていないこと
    expect(titleAfter).toBe(titleBefore);
  });
});
