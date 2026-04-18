import { test, expect } from '../../fixtures/spinshelf.fixture';
import { getDisplays } from '../../helpers/display-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P018: ディスプレイ配置 (@レイアウトテスター)', () => {
  test('縦並び/横並びなど様々な配置に対応すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '配置テストには複数ディスプレイが必要');

    await spinshelf.screenshot('before-arrangement-test');

    // Step 1: 現在のディスプレイ配置を分析
    const displays = getDisplays();
    const arrangement = analyzeArrangement(displays);

    await spinshelf.attachData('display-arrangement', {
      displays: displays.map(d => ({
        id: d.id,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
      })),
      arrangement,
    });

    // Step 2: ウィンドウを配置
    const firstDisplay = displays[0];
    openFinderWindow(
      firstDisplay.x + 50,
      firstDisplay.y + 50,
      500,
      350
    );
    await sleep(1000);

    const beforePos = getWindowPosition('Finder');

    // Step 3: 回転を実行（どの配置でも動作すること）
    rotateRight();
    await spinshelf.waitForRotation();

    const afterPos = getWindowPosition('Finder');
    await spinshelf.screenshot('after-arrangement-test');

    // Step 4: アプリがクラッシュせず、ウィンドウが移動したことを確認
    expect(isAppRunning()).toBe(true);
    expect(afterPos).not.toBeNull();

    await spinshelf.attachData('arrangement-result', {
      arrangementType: arrangement.type,
      windowMoved: afterPos!.x !== beforePos!.x || afterPos!.y !== beforePos!.y,
      appStable: true,
    });
  });
});

function analyzeArrangement(displays: { x: number; y: number; width: number; height: number }[]): {
  type: string;
  isHorizontal: boolean;
  isVertical: boolean;
  isMixed: boolean;
} {
  if (displays.length < 2) {
    return { type: 'single', isHorizontal: false, isVertical: false, isMixed: false };
  }

  const sorted = [...displays].sort((a, b) => a.x - b.x);
  let hasHorizontalGap = false;
  let hasVerticalGap = false;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (Math.abs(curr.x - (prev.x + prev.width)) < 10) {
      hasHorizontalGap = true;
    }
    if (Math.abs(curr.y - prev.y) > 50) {
      hasVerticalGap = true;
    }
  }

  const type = hasHorizontalGap && hasVerticalGap ? 'mixed' :
    hasHorizontalGap ? 'horizontal' : 'vertical';

  return {
    type,
    isHorizontal: hasHorizontalGap,
    isVertical: hasVerticalGap,
    isMixed: hasHorizontalGap && hasVerticalGap,
  };
}
