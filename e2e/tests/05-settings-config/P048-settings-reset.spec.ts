import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setDisplayOrder, readDefault, resetAllDefaults } from '../../helpers/settings-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P048: ディスプレイ順序リセット (@リセットテスター)', () => {
  test('ディスプレイ順序リセットがデフォルト(X座標順)に戻ること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    await spinshelf.screenshot('before');

    // カスタム順序を設定
    const displayIds = spinshelf.displays.map(d => d.id);
    const reversedIds = [...displayIds].reverse();
    setDisplayOrder(reversedIds);
    await sleep(500);

    const customOrder = readDefault('displayOrder');

    // 設定をリセット
    resetAllDefaults();
    await sleep(500);

    // リセット後はdisplayOrder設定が削除されていること
    const afterReset = readDefault('displayOrder');

    // デフォルト順序はX座標順
    const defaultOrder = [...spinshelf.displays]
      .sort((a, b) => a.x - b.x)
      .map(d => d.id);

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      customOrder,
      afterReset,
      defaultOrder,
      resetSuccessful: afterReset === null,
    });

    // リセット後は設定が削除されていること（デフォルトに戻る）
    expect(afterReset).toBeNull();
  });
});
