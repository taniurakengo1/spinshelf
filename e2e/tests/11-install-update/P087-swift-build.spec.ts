import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

test.describe('P087: swift buildが成功し実行可能バイナリが生成されること (@ビルドテスター)', () => {
  test('swift buildが成功し実行可能バイナリが生成されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: swift build を実行
    let buildOutput = '';
    let buildSuccess = false;
    try {
      buildOutput = runShell(`cd "${PROJECT_ROOT}" && swift build 2>&1`, 120_000);
      buildSuccess = true;
    } catch (e: unknown) {
      buildOutput = (e as Error).message;
      buildSuccess = false;
    }

    await spinshelf.attachData('build-output', {
      buildSuccess,
      output: buildOutput,
    });

    expect(buildSuccess).toBe(true);

    // Step 2: 実行可能バイナリが存在することを確認
    const binPath = runShell(`cd "${PROJECT_ROOT}" && swift build --show-bin-path`);
    const binaryPath = path.join(binPath, 'SpinShelf');

    let binaryExists = false;
    try {
      runShell(`test -f "${binaryPath}" && echo "exists"`);
      binaryExists = true;
    } catch {
      binaryExists = false;
    }

    // Step 3: バイナリが実行可能であることを確認
    let isExecutable = false;
    try {
      runShell(`test -x "${binaryPath}" && echo "executable"`);
      isExecutable = true;
    } catch {
      isExecutable = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('binary-info', {
      binaryPath,
      binaryExists,
      isExecutable,
    });

    expect(binaryExists).toBe(true);
    expect(isExecutable).toBe(true);
  });
});
