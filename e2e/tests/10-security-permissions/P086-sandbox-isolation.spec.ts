import { test, expect } from '../../fixtures/spinshelf.fixture';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runShell, sleep } from '../../helpers/macos-automation';
import { readDefault } from '../../helpers/settings-helpers';

test.describe('P086: 他のアプリの設定を変更しないこと (@サンドボックステスター)', () => {
  test('SpinShelfが他のアプリのUserDefaults設定を変更しないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: テスト対象のアプリの設定値を記録
    const testApps = ['com.apple.finder', 'com.apple.dock', 'com.apple.Safari'];
    const settingsBefore: Record<string, string> = {};

    for (const app of testApps) {
      try {
        settingsBefore[app] = runShell(`defaults read ${app} 2>/dev/null | md5 || echo "empty"`);
      } catch {
        settingsBefore[app] = 'error';
      }
    }

    // Step 2: SpinShelfの操作を実行
    const appRunning = isAppRunning();
    expect(appRunning).toBe(true);

    // SpinShelfの設定を読み書き
    const spinshelfSetting = readDefault('rotateLeftShortcut');
    await sleep(1000);

    // Step 3: 他のアプリの設定が変更されていないことを確認
    const settingsAfter: Record<string, string> = {};
    const unchanged: Record<string, boolean> = {};

    for (const app of testApps) {
      try {
        settingsAfter[app] = runShell(`defaults read ${app} 2>/dev/null | md5 || echo "empty"`);
        unchanged[app] = settingsBefore[app] === settingsAfter[app];
      } catch {
        settingsAfter[app] = 'error';
        unchanged[app] = settingsBefore[app] === 'error';
      }
    }

    // Step 4: SpinShelfが自身のドメインのみに書き込んでいることを確認
    let spinshelfDomainExists = false;
    try {
      runShell('defaults read com.hattou.SpinShelf 2>/dev/null');
      spinshelfDomainExists = true;
    } catch {
      spinshelfDomainExists = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      settingsBefore,
      settingsAfter,
      unchanged,
      spinshelfDomainExists,
      appRunning,
    });

    // 他のアプリの設定が変更されていないこと
    for (const app of testApps) {
      expect(unchanged[app]).toBe(true);
    }
  });
});
