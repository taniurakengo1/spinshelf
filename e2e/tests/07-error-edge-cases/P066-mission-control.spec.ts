import { test, expect } from '../../fixtures/spinshelf.fixture';
import { rotateRight, pressKey } from '../../helpers/keyboard-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { runAppleScript, sleep } from '../../helpers/macos-automation';

test.describe('P066: Mission Control中の動作確認 (@Mission Controlテスター)', () => {
  test('Mission Control表示中にショートカットを押してもクラッシュしないこと', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: アプリが起動中であることを確認
    const runningBefore = isAppRunning();
    expect(runningBefore).toBe(true);

    // Step 2: Mission Controlを起動
    let missionControlOpened = false;
    try {
      // Mission Controlを開く（F3キーまたはCtrl+Up）
      pressKey(160, ['control']); // Control + Up Arrow (Mission Control)
      missionControlOpened = true;
      await sleep(1500);
    } catch {
      missionControlOpened = false;
    }

    // Step 3: Mission Control中に回転ショートカットを実行
    rotateRight();
    await sleep(1000);

    const runningDuringMC = isAppRunning();
    expect(runningDuringMC).toBe(true);

    // Step 4: Mission Controlを閉じる
    try {
      pressKey(53); // Escape
      await sleep(1000);
    } catch {
      // Ignore
    }

    // Step 5: Mission Control終了後に回転が正常に動作するか確認
    rotateRight();
    await spinshelf.waitForRotation();

    const runningAfter = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      runningBefore,
      missionControlOpened,
      runningDuringMC,
      runningAfter,
    });

    expect(runningAfter).toBe(true);
  });
});
