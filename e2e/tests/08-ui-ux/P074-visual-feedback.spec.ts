import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P074: 回転時の視覚的フィードバック（フェード）が適切であること (@フィードバックテスター)', () => {
  test('回転時に視覚的フィードバックが表示されアプリが正常に動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: テスト用ウィンドウを配置
    const display = spinshelf.displays[0];
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    // Step 2: 回転を実行し、回転中のスクリーンショットを取得
    rotateRight();

    // 回転アニメーション中のスクリーンショット
    await sleep(200);
    await spinshelf.screenshot('during-rotation');

    await sleep(1300);
    await spinshelf.screenshot('after-rotation');

    const runningAfterRotation = isAppRunning();
    expect(runningAfterRotation).toBe(true);

    // Step 3: 複数回回転して視覚的フィードバックの一貫性を確認
    for (let i = 0; i < 3; i++) {
      rotateRight();
      await sleep(200);
      await spinshelf.screenshot(`rotation-${i + 1}`);
      await sleep(1300);
    }

    const runningAfterMultiple = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningAfterRotation,
      runningAfterMultiple,
      rotationCount: 4,
    });

    expect(runningAfterMultiple).toBe(true);
  });
});
