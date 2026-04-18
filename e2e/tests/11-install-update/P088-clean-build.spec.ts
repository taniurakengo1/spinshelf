import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

test.describe('P088: クリーンビルドが成功すること (@クリーンビルドテスター)', () => {
  test('swift package clean && swift build が成功すること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: swift package clean を実行
    let cleanOutput = '';
    let cleanSuccess = false;
    try {
      cleanOutput = runShell(`cd "${PROJECT_ROOT}" && swift package clean 2>&1`, 60_000);
      cleanSuccess = true;
    } catch (e: unknown) {
      cleanOutput = (e as Error).message;
      cleanSuccess = false;
    }

    await spinshelf.attachData('clean-output', {
      cleanSuccess,
      output: cleanOutput,
    });

    expect(cleanSuccess).toBe(true);

    // Step 2: .build ディレクトリがクリーンされたことを確認
    let buildDirEmpty = false;
    try {
      const checkResult = runShell(
        `cd "${PROJECT_ROOT}" && test -d .build/debug && echo "exists" || echo "cleaned"`
      );
      buildDirEmpty = checkResult === 'cleaned';
    } catch {
      buildDirEmpty = true;
    }

    // Step 3: swift build を実行
    let buildOutput = '';
    let buildSuccess = false;
    const startTime = Date.now();
    try {
      buildOutput = runShell(`cd "${PROJECT_ROOT}" && swift build 2>&1`, 180_000);
      buildSuccess = true;
    } catch (e: unknown) {
      buildOutput = (e as Error).message;
      buildSuccess = false;
    }
    const buildDuration = Date.now() - startTime;

    // Step 4: ビルド成果物の存在を確認
    const binPath = runShell(`cd "${PROJECT_ROOT}" && swift build --show-bin-path`);
    let binaryExists = false;
    try {
      runShell(`test -f "${binPath}/SpinShelf" && echo "exists"`);
      binaryExists = true;
    } catch {
      binaryExists = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('clean-build-result', {
      buildDirEmpty,
      buildSuccess,
      buildDuration,
      binaryExists,
      output: buildOutput.slice(0, 2000),
    });

    expect(buildSuccess).toBe(true);
    expect(binaryExists).toBe(true);
  });
});
