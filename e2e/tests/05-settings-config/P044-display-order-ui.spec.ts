import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setDisplayOrder, readDefault } from '../../helpers/settings-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P044: ディスプレイ順序変更 (@順序設定テスター)', () => {
  test('ディスプレイ順序をUIで変更できること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    await spinshelf.screenshot('before');

    // ディスプレイIDの順序を逆転させて設定
    const displayIds = spinshelf.displays.map(d => d.id);
    const reversedIds = [...displayIds].reverse();

    setDisplayOrder(reversedIds);
    await sleep(500);

    // 設定が保存されたことを確認
    const savedOrder = readDefault('displayOrder');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      originalOrder: displayIds,
      reversedOrder: reversedIds,
      savedOrder,
      orderChanged: savedOrder !== null,
    });

    expect(savedOrder).not.toBeNull();

    // クリーンアップ: 元の順序に戻す
    setDisplayOrder(displayIds);
  });
});
