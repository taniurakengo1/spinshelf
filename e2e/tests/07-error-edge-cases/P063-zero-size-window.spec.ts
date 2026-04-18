import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight } from '../../helpers/keyboard-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P063: サイズ0のウィンドウが適切にスキップされること (@ゼロサイズテスター)', () => {
  test('極小サイズのウィンドウがあっても回転がクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 極小サイズのウィンドウを作成
    const display = spinshelf.displays[0];
    try {
      runAppleScript(`
        tell application "TextEdit"
          activate
          make new document
        end tell
        delay 0.5
        tell application "TextEdit"
          set bounds of front window to {${display.x}, ${display.y + 25}, ${display.x + 1}, ${display.y + 26}}
        end tell
      `);
    } catch {
      // ウィンドウの最小サイズ制限により設定できない場合がある
    }
    await sleep(1000);

    // Step 2: 回転を実行
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterRotation = isAppRunning();
    expect(runningAfterRotation).toBe(true);

    // Step 3: 通常サイズのウィンドウも存在する状態でテスト
    try {
      runAppleScript(`
        tell application "Finder"
          activate
          set newWindow to make new Finder window
          set bounds of newWindow to {${display.x + 50}, ${display.y + 50}, ${display.x + 650}, ${display.y + 450}}
        end tell
      `);
    } catch {
      // Ignore
    }
    await sleep(500);

    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfterMixed = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningAfterRotation,
      runningAfterMixed,
    });

    expect(runningAfterMixed).toBe(true);
  });
});
