import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P021: ウィンドウ位置 (@位置テスター)', () => {
  test('移動後のウィンドウ位置が相対的に正しいこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'ウィンドウ位置テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    // Step 1: ソースディスプレイの中央にウィンドウを配置
    const relativeX = 0.25; // ディスプレイ幅の25%の位置
    const relativeY = 0.3;  // ディスプレイ高さの30%の位置
    const windowX = sourceDisplay.x + Math.floor(sourceDisplay.width * relativeX);
    const windowY = sourceDisplay.y + Math.floor(sourceDisplay.height * relativeY);

    openFinderWindow(windowX, windowY, 500, 350);
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-position-test');
    await spinshelf.attachData('before-position', {
      absolute: beforePos,
      relativeX: (beforePos!.x - sourceDisplay.x) / sourceDisplay.width,
      relativeY: (beforePos!.y - sourceDisplay.y) / sourceDisplay.height,
    });

    // Step 2: 右回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: 移動後の相対位置が保持されていることを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-position-test');

    expect(afterPos).not.toBeNull();

    const afterRelativeX = (afterPos!.x - targetDisplay.x) / targetDisplay.width;
    const afterRelativeY = (afterPos!.y - targetDisplay.y) / targetDisplay.height;

    await spinshelf.attachData('position-comparison', {
      before: { relativeX, relativeY },
      after: { relativeX: afterRelativeX, relativeY: afterRelativeY },
      xDrift: Math.abs(afterRelativeX - relativeX),
      yDrift: Math.abs(afterRelativeY - relativeY),
    });

    // 相対位置が大きくずれていないこと（20%以内の誤差を許容）
    expect(Math.abs(afterRelativeX - relativeX)).toBeLessThan(0.2);
    expect(Math.abs(afterRelativeY - relativeY)).toBeLessThan(0.2);
  });
});
