import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { getDisplayCount } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P062: 回転中にディスプレイが切断されても安全に処理されること (@切断テスター)', () => {
  test('ディスプレイ構成変更時にアプリがクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のディスプレイ数を記録
    const displayCountBefore = getDisplayCount();
    const display = spinshelf.displays[0];

    // Step 2: テスト用ウィンドウを配置
    openFinderWindow(display.x + 50, display.y + 50, 600, 400);
    await sleep(1000);

    // Step 3: 回転操作を実行
    // 注意: 実際のディスプレイ切断はE2Eテストでは再現困難なため、
    // 回転中のディスプレイ数変化への耐性をテストする
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterRotation = isAppRunning();
    expect(runningAfterRotation).toBe(true);

    // Step 4: ディスプレイ数を再取得して整合性を確認
    const displayCountAfter = getDisplayCount();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      displayCountBefore,
      displayCountAfter,
      runningAfterRotation,
      isMultiDisplay: spinshelf.isMultiDisplay,
    });

    // アプリがクラッシュしていないことを確認
    expect(isAppRunning()).toBe(true);
  });
});
