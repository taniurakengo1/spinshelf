import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P058: 並行操作 (@並行操作テスター)', () => {
  test('回転中に別のアプリ操作をしても問題ないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    // 回転を開始
    rotateRight();

    // 回転中に別のアプリを操作
    try {
      openTextEditWindow(mainDisplay.x + 200, mainDisplay.y + 200, 500, 350);
    } catch {
      // ウィンドウ作成失敗は許容
    }

    // 回転中にFinderにフォーカスを移す
    try {
      runAppleScript(`
        tell application "Finder"
          activate
        end tell
      `);
    } catch {}

    await spinshelf.waitForRotation();

    // 回転中にさらに別のアプリを開く
    rotateRight();
    try {
      runAppleScript(`
        tell application "Calculator"
          activate
        end tell
      `);
    } catch {}

    await spinshelf.waitForRotation();
    await sleep(1000);

    const finderPosition = getWindowPosition('Finder');
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      finderPosition,
      appStillRunning,
      noCrash: appStillRunning,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);

    // クリーンアップ: Calculatorを閉じる
    try {
      runAppleScript('tell application "Calculator" to quit');
    } catch {}
  });
});
