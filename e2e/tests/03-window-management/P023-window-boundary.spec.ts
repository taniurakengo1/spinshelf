import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P023: ウィンドウ境界 (@境界テスター)', () => {
  test('ウィンドウがディスプレイ境界からはみ出さないこと', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '境界テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    // Step 1: ソースディスプレイの右端ギリギリにウィンドウを配置
    const windowWidth = 600;
    const windowHeight = 400;
    const edgeX = sourceDisplay.x + sourceDisplay.width - windowWidth - 10;
    const edgeY = sourceDisplay.y + sourceDisplay.height - windowHeight - 10;
    openFinderWindow(edgeX, edgeY, windowWidth, windowHeight);
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-boundary-test');
    await spinshelf.attachData('before-boundary', {
      position: beforePos,
      distanceFromRight: sourceDisplay.x + sourceDisplay.width - (beforePos!.x + beforePos!.width),
      distanceFromBottom: sourceDisplay.y + sourceDisplay.height - (beforePos!.y + beforePos!.height),
    });

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウがターゲットディスプレイの境界内にあることを確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-boundary-test');

    expect(afterPos).not.toBeNull();

    const rightEdge = afterPos!.x + afterPos!.width;
    const bottomEdge = afterPos!.y + afterPos!.height;
    const targetRight = targetDisplay.x + targetDisplay.width;
    const targetBottom = targetDisplay.y + targetDisplay.height;

    const withinLeftBound = afterPos!.x >= targetDisplay.x;
    const withinTopBound = afterPos!.y >= targetDisplay.y;
    const withinRightBound = rightEdge <= targetRight;
    const withinBottomBound = bottomEdge <= targetBottom;

    await spinshelf.attachData('boundary-result', {
      position: afterPos,
      targetBounds: {
        left: targetDisplay.x,
        top: targetDisplay.y,
        right: targetRight,
        bottom: targetBottom,
      },
      withinBounds: {
        left: withinLeftBound,
        top: withinTopBound,
        right: withinRightBound,
        bottom: withinBottomBound,
      },
      allWithin: withinLeftBound && withinTopBound && withinRightBound && withinBottomBound,
    });

    expect(withinLeftBound).toBe(true);
    expect(withinTopBound).toBe(true);
    expect(withinRightBound).toBe(true);
    expect(withinBottomBound).toBe(true);
  });
});
