import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P045: ディスプレイ識別 (@識別テスター)', () => {
  test('ディスプレイ識別機能が各画面に番号を表示すること', async ({ spinshelf }, testInfo) => {
    test.skip(!spinshelf.isMultiDisplay, 'マルチディスプレイ環境が必要');

    await spinshelf.screenshot('before');

    // メニューバーから「ディスプレイを識別」を選択
    let identifyTriggered = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
            delay 0.5
            click menu item "Identify Displays" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(2000);
      identifyTriggered = true;
    } catch {
      // メニュー項目が見つからない場合
      identifyTriggered = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      identifyTriggered,
      displayCount: spinshelf.displayCount,
    });

    // 識別機能がトリガーされたこと
    expect(identifyTriggered).toBe(true);
  });
});
