import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setShortcut, readDefault, resetAllDefaults } from '../../helpers/settings-helpers';
import { terminateApp, launchApp, buildApp, isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P047: 設定永続化 (@永続化テスター)', () => {
  test.afterEach(async () => {
    resetAllDefaults();
    await sleep(500);
    // アプリが起動していなければ再起動
    if (!isAppRunning()) {
      await buildApp();
      await launchApp();
      await sleep(2000);
    }
  });

  test('アプリ再起動後も設定が保持されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // カスタムショートカットを設定
    setShortcut('left', 0, 0x40000 | 0x80000);
    await sleep(500);

    const beforeRestart = readDefault('rotateLeftShortcut');

    // アプリを再起動
    await terminateApp();
    await sleep(1000);
    await buildApp();
    await launchApp();
    await sleep(2000);

    // 再起動後に設定が保持されていることを確認
    const afterRestart = readDefault('rotateLeftShortcut');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      beforeRestart,
      afterRestart,
      settingsPersisted: beforeRestart === afterRestart,
    });

    expect(afterRestart).toBe(beforeRestart);
  });
});
