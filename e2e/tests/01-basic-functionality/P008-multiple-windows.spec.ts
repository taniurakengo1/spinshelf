import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, getWindowPosition, getAllWindowPositions } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P008: 複数ウィンドウ同時移動 (@結合テスター)', () => {
  test('複数ウィンドウが同時に移動すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '複数ウィンドウ移動テストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: 同じディスプレイに複数ウィンドウを配置
    openFinderWindow(primaryDisplay.x + 30, primaryDisplay.y + 30, 400, 300);
    await sleep(500);
    openTextEditWindow(primaryDisplay.x + 100, primaryDisplay.y + 100, 400, 300);
    await sleep(1000);

    const beforeFinder = getWindowPosition('Finder');
    const beforeTextEdit = getWindowPosition('TextEdit');
    await spinshelf.screenshot('before-multiple-window-move');
    await spinshelf.attachData('before-positions', {
      finder: beforeFinder,
      textEdit: beforeTextEdit,
    });

    // Step 2: 右回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: 両方のウィンドウが移動したことを確認
    const afterFinder = getWindowPosition('Finder');
    const afterTextEdit = getWindowPosition('TextEdit');
    await spinshelf.screenshot('after-multiple-window-move');

    const finderDisplay = afterFinder ? getDisplayForPosition(afterFinder.x, afterFinder.y) : null;
    const textEditDisplay = afterTextEdit ? getDisplayForPosition(afterTextEdit.x, afterTextEdit.y) : null;

    await spinshelf.attachData('after-positions', {
      finder: afterFinder,
      textEdit: afterTextEdit,
      finderDisplayId: finderDisplay?.id,
      textEditDisplayId: textEditDisplay?.id,
    });

    // 両方のウィンドウがプライマリディスプレイから移動していること
    expect(afterFinder).not.toBeNull();
    expect(afterTextEdit).not.toBeNull();

    const finderMoved = afterFinder!.x !== beforeFinder!.x;
    const textEditMoved = afterTextEdit!.x !== beforeTextEdit!.x;

    expect(finderMoved).toBe(true);
    expect(textEditMoved).toBe(true);
  });
});
