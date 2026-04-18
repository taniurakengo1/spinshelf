import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, closeAllWindows } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P060: 回転中にウィンドウを閉じてもクラッシュしないこと (@レースコンディションテスター)', () => {
  test('回転操作と同時にウィンドウを閉じてもアプリがクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: テスト用ウィンドウを開く
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    // Step 2: 回転を開始し、すぐにウィンドウを閉じる
    rotateRight();
    // 回転処理中にウィンドウを閉じる（レースコンディション再現）
    closeAllWindows('Finder');

    await spinshelf.waitForRotation();

    const runningAfterRace = isAppRunning();
    expect(runningAfterRace).toBe(true);

    // Step 3: 複数ウィンドウで同様のテスト
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    openFinderWindow(display.x + 100, display.y + 100, 600, 400);
    await sleep(1000);

    rotateRight();
    await sleep(100);
    closeAllWindows('Finder');

    await spinshelf.waitForRotation();

    const runningAfterMultiRace = isAppRunning();
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningAfterRace,
      runningAfterMultiRace,
    });

    expect(runningAfterMultiRace).toBe(true);
  });
});
