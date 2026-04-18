import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setDisplayOrder, deleteDefault } from '../../helpers/settings-helpers';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P013: カスタム巡回順序 (@カスタマイズテスター)', () => {
  test('設定でカスタム巡回順序が反映されること', async ({ spinshelf }, testInfo) => {
    test.skip(spinshelf.displayCount < 3, 'カスタム順序テストには3台以上のディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);

    // Step 1: カスタム順序を設定（逆順にする）
    const reversedIds = displays.map(d => d.id).reverse();
    setDisplayOrder(reversedIds);
    await sleep(1000);

    await spinshelf.screenshot('before-custom-order');
    await spinshelf.attachData('custom-order-config', {
      defaultOrder: displays.map(d => d.id),
      customOrder: reversedIds,
    });

    // Step 2: 最初のディスプレイ（カスタム順序で）にウィンドウを配置
    const firstInCustomOrder = displays.find(d => d.id === reversedIds[0])!;
    openFinderWindow(
      firstInCustomOrder.x + 50,
      firstInCustomOrder.y + 50,
      500,
      350
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');

    // Step 3: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 4: カスタム順序に従って移動したことを確認
    const afterPos = getWindowPosition('Finder');
    const afterDisplay = afterPos ? getDisplayForPosition(afterPos.x, afterPos.y) : null;

    await spinshelf.screenshot('after-custom-order');
    await spinshelf.attachData('custom-order-result', {
      beforePosition: beforePos,
      afterPosition: afterPos,
      expectedNextDisplayId: reversedIds[1],
      actualDisplayId: afterDisplay?.id,
    });

    expect(afterDisplay?.id).toBe(reversedIds[1]);

    // Cleanup: カスタム順序設定を削除
    deleteDefault('displayOrder');
  });
});
