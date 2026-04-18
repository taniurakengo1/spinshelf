import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setLaunchAtLogin, getLaunchAtLogin, resetAllDefaults } from '../../helpers/settings-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P046: ログイン時起動設定 (@起動設定テスター)', () => {
  test.afterEach(async () => {
    resetAllDefaults();
    await sleep(500);
  });

  test('ログイン時起動の設定が保存されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // ログイン時起動を有効化
    setLaunchAtLogin(true);
    await sleep(500);
    const enabledResult = getLaunchAtLogin();

    // ログイン時起動を無効化
    setLaunchAtLogin(false);
    await sleep(500);
    const disabledResult = getLaunchAtLogin();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      enabledResult,
      disabledResult,
      toggleWorks: enabledResult === true && disabledResult === false,
    });

    expect(enabledResult).toBe(true);
    expect(disabledResult).toBe(false);
  });
});
