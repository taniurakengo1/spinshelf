import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P016: アスペクト比対応 (@アスペクト比テスター)', () => {
  test('異なるアスペクト比のディスプレイ間で適切にフィットすること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'アスペクト比テストには複数ディスプレイが必要');

    const displays = [...spinshelf.displays].sort((a, b) => a.x - b.x);
    const sourceDisplay = displays[0];
    const targetDisplay = displays[1];

    const sourceAspect = sourceDisplay.width / sourceDisplay.height;
    const targetAspect = targetDisplay.width / targetDisplay.height;

    await spinshelf.attachData('aspect-ratios', {
      source: { width: sourceDisplay.width, height: sourceDisplay.height, aspect: sourceAspect.toFixed(3) },
      target: { width: targetDisplay.width, height: targetDisplay.height, aspect: targetAspect.toFixed(3) },
      aspectDifference: Math.abs(sourceAspect - targetAspect).toFixed(3),
    });

    // Step 1: ソースディスプレイにウィンドウを配置（ディスプレイの80%サイズ）
    const windowWidth = Math.floor(sourceDisplay.width * 0.8);
    const windowHeight = Math.floor(sourceDisplay.height * 0.8);
    openFinderWindow(
      sourceDisplay.x + Math.floor(sourceDisplay.width * 0.1),
      sourceDisplay.y + Math.floor(sourceDisplay.height * 0.1),
      windowWidth,
      windowHeight
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');
    await spinshelf.screenshot('before-aspect-ratio');

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: ウィンドウがターゲットディスプレイに適切にフィットしているか確認
    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-aspect-ratio');

    expect(afterPos).not.toBeNull();

    // ウィンドウがターゲットディスプレイの境界内であること
    const withinBounds =
      afterPos!.x >= targetDisplay.x &&
      afterPos!.y >= targetDisplay.y &&
      afterPos!.x + afterPos!.width <= targetDisplay.x + targetDisplay.width &&
      afterPos!.y + afterPos!.height <= targetDisplay.y + targetDisplay.height;

    // ウィンドウが極端に小さくなっていないこと
    const minReasonableWidth = Math.min(windowWidth, targetDisplay.width) * 0.5;
    const minReasonableHeight = Math.min(windowHeight, targetDisplay.height) * 0.5;

    await spinshelf.attachData('aspect-result', {
      beforeSize: { width: beforePos!.width, height: beforePos!.height },
      afterSize: { width: afterPos!.width, height: afterPos!.height },
      withinBounds,
      reasonableSize: afterPos!.width >= minReasonableWidth && afterPos!.height >= minReasonableHeight,
    });

    expect(withinBounds).toBe(true);
    expect(afterPos!.width).toBeGreaterThanOrEqual(minReasonableWidth);
    expect(afterPos!.height).toBeGreaterThanOrEqual(minReasonableHeight);
  });
});
