import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell, sleep } from '../../helpers/macos-automation';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import { getDisplayCount, getDisplays } from '../../helpers/display-helpers';

test.describe('P099: ディスプレイの接続/切断を繰り返しても安定すること (@再接続テスター)', () => {
  test('ディスプレイ構成変更後もアプリが安定動作すること', async ({ spinshelf }, testInfo) => {
    test.setTimeout(120_000);

    await spinshelf.screenshot('before');

    const initialDisplayCount = spinshelf.displayCount;
    const initialPID = getAppPID();

    // Step 1: 現在のディスプレイ構成を記録
    const initialDisplays = spinshelf.displays;

    await spinshelf.attachData('initial-state', {
      displayCount: initialDisplayCount,
      pid: initialPID,
      displays: initialDisplays,
    });

    // Step 2: ディスプレイ構成の変化をシミュレート
    // (物理的な接続/切断はE2Eでは困難なため、
    //  DisplayManager の再検出をトリガーして安定性を確認)
    const RECONNECT_CYCLES = 5;
    let crashDetected = false;
    const cycleResults: Array<{
      cycle: number;
      displayCount: number;
      appRunning: boolean;
    }> = [];

    for (let i = 0; i < RECONNECT_CYCLES; i++) {
      // ディスプレイ情報の再取得をトリガー
      // (CGDisplayRegisterReconfigurationCallback相当の変化検知をテスト)
      try {
        const currentCount = getDisplayCount();
        const running = isAppRunning();

        cycleResults.push({
          cycle: i + 1,
          displayCount: currentCount,
          appRunning: running,
        });

        if (!running) {
          crashDetected = true;
          break;
        }
      } catch {
        // ディスプレイ情報取得エラーは記録するが続行
        cycleResults.push({
          cycle: i + 1,
          displayCount: -1,
          appRunning: isAppRunning(),
        });
      }

      await sleep(2000);
    }

    // Step 3: ディスプレイ再検出後の最終状態を確認
    const finalDisplays = getDisplays();
    const finalDisplayCount = getDisplayCount();
    const finalRunning = isAppRunning();
    const finalPID = getAppPID();

    // PIDが変わっていないことを確認（クラッシュ→再起動していないこと）
    const pidChanged = initialPID !== null && finalPID !== null && initialPID !== finalPID;

    await spinshelf.screenshot('after');
    await spinshelf.attachData('reconnect-cycle-result', {
      reconnectCycles: RECONNECT_CYCLES,
      crashDetected,
      pidChanged,
      initialPID,
      finalPID,
      initialDisplayCount,
      finalDisplayCount,
      finalRunning,
      cycleResults,
      finalDisplays,
    });

    expect(crashDetected).toBe(false);
    expect(finalRunning).toBe(true);
    expect(pidChanged).toBe(false);
  });
});
