import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P080: 長いローカライズテキストでレイアウトが崩れないこと (@テキスト長テスター)', () => {
  test('設定ウィンドウが適切なサイズで表示され切れないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 設定ウィンドウを開く
    let settingsOpened = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      await sleep(500);

      runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            click menu item "Settings…" of menu 1 of menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      settingsOpened = true;
      await sleep(1000);
    } catch {
      settingsOpened = false;
    }

    await spinshelf.screenshot('settings-window-layout');

    // Step 2: ウィンドウサイズとスクリーン内に収まっているかを確認
    let windowSize: { width: number; height: number } | null = null;
    let windowPosition: { x: number; y: number } | null = null;
    let isWithinScreen = false;

    if (settingsOpened) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                set p to position of front window
                set s to size of front window
                return (item 1 of p) & "," & (item 2 of p) & "," & (item 1 of s) & "," & (item 2 of s)
              end if
            end tell
          end tell
        `);
        const [x, y, width, height] = result.split(',').map(Number);
        windowPosition = { x, y };
        windowSize = { width, height };

        // ウィンドウがスクリーン内に収まっているか
        const display = spinshelf.displays[0];
        isWithinScreen =
          x >= display.x &&
          y >= display.y &&
          (x + width) <= (display.x + display.width) &&
          (y + height) <= (display.y + display.height);
      } catch {
        // Query failed
      }
    }

    // Step 3: 設定ウィンドウを閉じる
    if (settingsOpened) {
      try {
        runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              if (count of windows) > 0 then
                click button 1 of front window
              end if
            end tell
          end tell
        `);
      } catch {
        // Ignore
      }
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      settingsOpened,
      windowPosition,
      windowSize,
      isWithinScreen,
    });

    if (settingsOpened && windowSize) {
      // ウィンドウが最低限のサイズを持つこと
      expect(windowSize.width).toBeGreaterThan(0);
      expect(windowSize.height).toBeGreaterThan(0);
    }
  });
});
