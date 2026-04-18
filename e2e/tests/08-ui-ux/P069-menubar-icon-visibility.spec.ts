import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, runShell, sleep } from '../../helpers/macos-automation';

test.describe('P069: メニューバーアイコンがダーク/ライトモードで見えること (@視認性テスター)', () => {
  test('ダークモードとライトモードの両方でメニューバーアイコンが表示されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のアピアランスモードを記録
    let currentMode = 'Light';
    try {
      const result = runAppleScript(`
        tell application "System Events"
          tell appearance preferences
            return dark mode
          end tell
        end tell
      `);
      currentMode = result === 'true' ? 'Dark' : 'Light';
    } catch {
      // Default to Light
    }

    // Step 2: メニューバーアイコンの存在確認（現在のモード）
    let iconExistsCurrent = false;
    try {
      const result = runAppleScript(`
        tell application "System Events"
          tell process "SpinShelf"
            return exists menu bar item 1 of menu bar 2
          end tell
        end tell
      `);
      iconExistsCurrent = result === 'true';
    } catch {
      iconExistsCurrent = false;
    }

    expect(iconExistsCurrent).toBe(true);
    await spinshelf.screenshot(`icon-${currentMode.toLowerCase()}-mode`);

    // Step 3: アピアランスモードを切り替え
    let modeSwitched = false;
    try {
      runAppleScript(`
        tell application "System Events"
          tell appearance preferences
            set dark mode to ${currentMode === 'Dark' ? 'false' : 'true'}
          end tell
        end tell
      `);
      modeSwitched = true;
      await sleep(2000);
    } catch {
      modeSwitched = false;
    }

    // Step 4: 切り替え後のアイコン存在確認
    let iconExistsAfterSwitch = false;
    if (modeSwitched) {
      try {
        const result = runAppleScript(`
          tell application "System Events"
            tell process "SpinShelf"
              return exists menu bar item 1 of menu bar 2
            end tell
          end tell
        `);
        iconExistsAfterSwitch = result === 'true';
      } catch {
        iconExistsAfterSwitch = false;
      }
      await spinshelf.screenshot(`icon-${currentMode === 'Dark' ? 'light' : 'dark'}-mode`);
    }

    // Step 5: 元のモードに戻す
    if (modeSwitched) {
      try {
        runAppleScript(`
          tell application "System Events"
            tell appearance preferences
              set dark mode to ${currentMode === 'Dark' ? 'true' : 'false'}
            end tell
          end tell
        `);
        await sleep(1000);
      } catch {
        // Ignore
      }
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      originalMode: currentMode,
      iconExistsCurrent,
      modeSwitched,
      iconExistsAfterSwitch,
    });

    expect(iconExistsCurrent).toBe(true);
    if (modeSwitched) {
      expect(iconExistsAfterSwitch).toBe(true);
    }
  });
});
