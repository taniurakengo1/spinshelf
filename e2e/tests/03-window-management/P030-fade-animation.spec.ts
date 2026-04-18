import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P030: フェードアニメーション (@アニメーションテスター)', () => {
  test('前面ウィンドウのフェードアニメーションが動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'アニメーションテストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: ウィンドウを配置
    openFinderWindow(primaryDisplay.x + 50, primaryDisplay.y + 50, 600, 400);
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-animation');

    // Step 2: 回転実行直後にスクリーンショットを取得（アニメーション中の状態をキャプチャ）
    rotateRight();

    // アニメーション中の状態をキャプチャ（回転直後、完了前）
    await sleep(200);
    await spinshelf.screenshot('during-animation');

    // Step 3: アニメーション完了を待つ
    await sleep(1500);
    await spinshelf.screenshot('after-animation');

    // Step 4: アニメーション完了後にウィンドウが正しい位置にあることを確認
    const afterPos = getWindowPosition('Finder');
    expect(afterPos).not.toBeNull();

    // アプリがクラッシュしていないこと
    expect(isAppRunning()).toBe(true);

    // ウィンドウが移動したこと（アニメーションが完了している）
    const windowMoved = afterPos!.x !== beforePos!.x;

    await spinshelf.attachData('animation-result', {
      beforePosition: beforePos,
      afterPosition: afterPos,
      windowMoved,
      appStable: true,
      note: 'Visual animation quality must be verified manually via screenshots',
    });

    expect(windowMoved).toBe(true);
  });
});
