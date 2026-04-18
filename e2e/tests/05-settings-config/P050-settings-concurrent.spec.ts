import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { setShortcut, resetAllDefaults } from '../../helpers/settings-helpers';
import { openFinderWindow, getWindowPosition } from '../../helpers/window-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P050: 設定変更中のショートカット (@並行テスター)', () => {
  test.afterEach(async () => {
    resetAllDefaults();
    await sleep(500);
  });

  test('設定変更中にショートカットが正しく動作すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    const mainDisplay = spinshelf.displays.find(d => d.isMain) || spinshelf.displays[0];
    openFinderWindow(mainDisplay.x + 100, mainDisplay.y + 100, 600, 400);
    await sleep(1000);

    await spinshelf.screenshot('before');

    // 設定変更を書き込みながら同時にショートカットを発動
    const positionBefore = getWindowPosition('Finder');

    // 設定書き込み
    setShortcut('left', 123, 0x40000 | 0x80000);

    // すぐにデフォルトショートカットで回転
    rotateRight();
    await spinshelf.waitForRotation();

    const positionAfter = getWindowPosition('Finder');
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      positionBefore,
      positionAfter,
      appStillRunning,
      noCrash: appStillRunning,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // ウィンドウが存在すること
    expect(positionAfter).not.toBeNull();
  });
});
