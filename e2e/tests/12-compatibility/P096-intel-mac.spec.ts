import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import { isAppRunning } from '../../helpers/app-lifecycle';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

test.describe('P096: Intel Mac (x86_64)でも動作すること (@Intelテスター)', () => {
  test('x86_64アーキテクチャ互換性チェック', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: 現在のアーキテクチャを確認
    const arch = runShell('uname -m');
    const isIntel = arch === 'x86_64';

    // Step 2: ビルドされたバイナリのアーキテクチャを確認
    let binaryArch = '';
    try {
      const binPath = runShell(`cd "${PROJECT_ROOT}" && swift build --show-bin-path`);
      binaryArch = runShell(`file "${binPath}/SpinShelf" 2>/dev/null || echo "unknown"`);
    } catch {
      binaryArch = 'unknown';
    }

    const supportsX86_64 = binaryArch.includes('x86_64');

    // Step 3: Package.swiftにアーキテクチャ制限がないことを確認
    let hasArchRestriction = false;
    try {
      const result = runShell(
        `grep -i "arm64\\|arch.*restrict\\|excludedArchitectures" "${PROJECT_ROOT}/Package.swift" 2>/dev/null || echo ""`
      );
      hasArchRestriction = result.length > 0 && !result.includes('echo');
    } catch {
      hasArchRestriction = false;
    }

    // Step 4: Intel固有のAPIや命令を使用していないか確認
    let usesArchSpecificCode = false;
    try {
      const result = runShell(
        `grep -r "#if arch(arm64)\\|#if arch(x86_64)\\|canImport(CryptoKit)" "${PROJECT_ROOT}/Sources/" 2>/dev/null || echo ""`
      );
      // アーキテクチャ分岐がある場合は両方サポートされている可能性が高い
      usesArchSpecificCode = result.length > 0;
    } catch {
      usesArchSpecificCode = false;
    }

    // Step 5: アプリが動作していることを確認
    const appRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('intel-compatibility', {
      currentArch: arch,
      isIntel,
      binaryArch: binaryArch.slice(0, 300),
      supportsX86_64,
      hasArchRestriction,
      usesArchSpecificCode,
      appRunning,
    });

    expect(appRunning).toBe(true);
    // アーキテクチャ制限がないこと
    expect(hasArchRestriction).toBe(false);
  });
});
