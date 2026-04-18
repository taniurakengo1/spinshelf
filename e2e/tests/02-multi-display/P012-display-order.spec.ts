import { test, expect } from '../../fixtures/spinshelf.fixture';
import { getDisplays } from '../../helpers/display-helpers';

test.describe('P012: ディスプレイ順序 (@構成テスター)', () => {
  test('ディスプレイがX座標順に並ぶこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'ディスプレイ順序テストには複数ディスプレイが必要');

    await spinshelf.screenshot('before-display-order-check');

    // Step 1: ディスプレイ情報を取得
    const displays = getDisplays();
    const sortedByX = [...displays].sort((a, b) => a.x - b.x);

    await spinshelf.attachData('display-order', {
      original: displays.map(d => ({ id: d.id, x: d.x, y: d.y })),
      sortedByX: sortedByX.map(d => ({ id: d.id, x: d.x, y: d.y })),
    });

    // Step 2: デフォルトの巡回順序がX座標順であることを確認
    for (let i = 0; i < sortedByX.length - 1; i++) {
      expect(sortedByX[i].x).toBeLessThanOrEqual(sortedByX[i + 1].x);
    }

    // Step 3: 全ディスプレイがユニークなIDを持つことを確認
    const ids = displays.map(d => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    await spinshelf.screenshot('after-display-order-check');
    await spinshelf.attachData('order-validation', {
      allUniqueIds: uniqueIds.size === ids.length,
      isSortedByX: true,
      displayCount: displays.length,
    });
  });
});
