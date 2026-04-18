import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { openFinderWindow, openTextEditWindow, openSafariWindow, getWindowPosition } from '../../helpers/window-helpers';
import { getDisplayForPosition } from '../../helpers/display-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P026: 複数アプリ横断移動 (@アプリ横断テスター)', () => {
  test('複数アプリのウィンドウが同時に移動すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, '複数アプリテストには複数ディスプレイが必要');

    const primaryDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];

    // Step 1: 3つの異なるアプリのウィンドウを同じディスプレイに配置
    openFinderWindow(primaryDisplay.x + 30, primaryDisplay.y + 30, 400, 300);
    await sleep(500);
    openTextEditWindow(primaryDisplay.x + 80, primaryDisplay.y + 80, 400, 300);
    await sleep(500);
    openSafariWindow('about:blank', primaryDisplay.x + 130, primaryDisplay.y + 130, 400, 300);
    await sleep(1500);

    const beforeFinder = getWindowPosition('Finder');
    const beforeTextEdit = getWindowPosition('TextEdit');
    const beforeSafari = getWindowPosition('Safari');

    await spinshelf.screenshot('before-multi-app-move');
    await spinshelf.attachData('before-positions', {
      finder: beforeFinder,
      textEdit: beforeTextEdit,
      safari: beforeSafari,
    });

    // Step 2: 右回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    // Step 3: 全アプリのウィンドウが移動したことを確認
    const afterFinder = getWindowPosition('Finder');
    const afterTextEdit = getWindowPosition('TextEdit');
    const afterSafari = getWindowPosition('Safari');

    await spinshelf.screenshot('after-multi-app-move');

    const finderMoved = afterFinder && beforeFinder && afterFinder.x !== beforeFinder.x;
    const textEditMoved = afterTextEdit && beforeTextEdit && afterTextEdit.x !== beforeTextEdit.x;
    const safariMoved = afterSafari && beforeSafari && afterSafari.x !== beforeSafari.x;

    await spinshelf.attachData('multi-app-result', {
      finder: { moved: finderMoved, before: beforeFinder, after: afterFinder },
      textEdit: { moved: textEditMoved, before: beforeTextEdit, after: afterTextEdit },
      safari: { moved: safariMoved, before: beforeSafari, after: afterSafari },
      allMoved: finderMoved && textEditMoved && safariMoved,
    });

    expect(finderMoved).toBe(true);
    expect(textEditMoved).toBe(true);
    expect(safariMoved).toBe(true);
  });
});
