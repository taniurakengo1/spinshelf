import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setDisplayOrder, deleteDefault } from '../../helpers/settings-helpers';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P020: ディスプレイ除外 (@除外テスター)', () => {
  test('カスタム順序で特定ディスプレイを除外できること', async ({ spinshelf }, testInfo) => {
    test.skip(spinshelf.displayCount < 3, 'ディスプレイ除外テストには3台以上のディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const excludedDisplay = displays[1]; // 中央のディスプレイを除外
    const includedIds = displays
      .filter(d => d.id !== excludedDisplay.id)
      .map(d => d.id);

    // Step 1: カスタム順序を設定（中央ディスプレイを除外）
    setDisplayOrder(includedIds);
    await sleep(1000);

    await spinshelf.screenshot('before-exclude-test');
    await spinshelf.attachData('exclude-config', {
      allDisplayIds: displays.map(d => d.id),
      includedIds,
      excludedId: excludedDisplay.id,
    });

    // Step 2: 最初のディスプレイにウィンドウを配置
    const firstIncluded = displays.find(d => d.id === includedIds[0])!;
    openFinderWindow(firstIncluded.x + 50, firstIncluded.y + 50, 500, 350);
    await sleep(1000);

    // Step 3: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 4: 除外したディスプレイには移動しないことを確認
    const afterPos = getWindowPosition('Finder');
    const afterDisplay = afterPos ? getDisplayForPosition(afterPos.x, afterPos.y) : null;

    await spinshelf.screenshot('after-exclude-test');
    await spinshelf.attachData('exclude-result', {
      afterPosition: afterPos,
      movedToDisplayId: afterDisplay?.id,
      skippedExcluded: afterDisplay?.id !== excludedDisplay.id,
    });

    expect(afterDisplay?.id).not.toBe(excludedDisplay.id);

    // Cleanup
    deleteDefault('displayOrder');
  });
});
