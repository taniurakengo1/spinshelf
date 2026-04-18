import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, rotateLeft } from '../../helpers/keyboard-helpers';
import { closeAllTestWindows, countWindows } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P059: ウィンドウが0個の状態で回転してもクラッシュしないこと (@ゼロ状態テスター)', () => {
  test('ウィンドウが0個の状態で回転操作を行ってもアプリがクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 全てのテストウィンドウを閉じてウィンドウ0の状態にする
    closeAllTestWindows();
    await sleep(1000);

    const finderWindows = countWindows('Finder');
    const textEditWindows = countWindows('TextEdit');
    await spinshelf.attachData('window-count-before', {
      finder: finderWindows,
      textEdit: textEditWindows,
    });

    // Step 2: ウィンドウ0の状態で右回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterRight = isAppRunning();
    expect(runningAfterRight).toBe(true);

    // Step 3: ウィンドウ0の状態で左回転を実行
    rotateLeft();
    await spinshelf.waitForRotation();

    const runningAfterLeft = isAppRunning();
    expect(runningAfterLeft).toBe(true);

    // Step 4: 複数回連続で回転
    for (let i = 0; i < 5; i++) {
      rotateRight();
      await sleep(300);
    }

    const runningAfterMultiple = isAppRunning();
    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningAfterRight,
      runningAfterLeft,
      runningAfterMultiple,
    });

    expect(runningAfterMultiple).toBe(true);
  });
});
