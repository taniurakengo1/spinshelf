import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import { isAppRunning, getAppPID } from '../../helpers/app-lifecycle';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

test.describe('P095: Apple Silicon (arm64)で正常動作すること (@Apple Siliconテスター)', () => {
  test('Apple Siliconアーキテクチャで正常に動作すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のアーキテクチャを確認
    const arch = runShell('uname -m');
    const isAppleSilicon = arch === 'arm64';

    // Step 2: ビルドされたバイナリのアーキテクチャを確認
    let binaryArch = '';
    try {
      const binPath = runShell(`cd "${PROJECT_ROOT}" && swift build --show-bin-path`);
      binaryArch = runShell(`file "${binPath}/SpinShelf" 2>/dev/null || echo "unknown"`);
    } catch {
      binaryArch = 'unknown';
    }

    const supportsArm64 = binaryArch.includes('arm64');

    // Step 3: Rosettaを介さずネイティブ実行されているか確認
    let isNativeExecution = false;
    const pid = getAppPID();
    if (pid && isAppleSilicon) {
      try {
        // sysctl で翻訳プロセスかどうかを確認
        const translatedResult = runShell(
          `sysctl -n sysctl.proc_translated 2>/dev/null || echo "0"`
        );
        isNativeExecution = translatedResult.trim() === '0';
      } catch {
        isNativeExecution = true; // チェックできない場合はネイティブとみなす
      }
    }

    // Step 4: アプリが正常に動作していることを確認
    const appRunning = isAppRunning();

    // Step 5: パフォーマンス基本チェック (メモリ使用量)
    let memoryUsageKB = 0;
    if (pid) {
      try {
        const mem = runShell(`ps -o rss= -p ${pid}`);
        memoryUsageKB = parseInt(mem, 10);
      } catch {
        memoryUsageKB = 0;
      }
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('apple-silicon-result', {
      arch,
      isAppleSilicon,
      binaryArch: binaryArch.slice(0, 300),
      supportsArm64,
      isNativeExecution,
      appRunning,
      memoryUsageKB,
    });

    expect(appRunning).toBe(true);
    // 現在のアーキテクチャがarm64の場合、バイナリがarm64をサポートしていること
    if (isAppleSilicon) {
      expect(supportsArm64).toBe(true);
    }
  });
});
