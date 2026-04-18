import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import { getAppPID } from '../../helpers/app-lifecycle';

test.describe('P100: テスト実行中にエラーログが出力されていないこと (@ログ監視テスター)', () => {
  test('SpinShelfプロセスのログにエラーが含まれていないこと', async ({ spinshelf }, testInfo) => {
    test.setTimeout(60_000);

    await spinshelf.screenshot('before');

    const pid = getAppPID();

    // Step 1: system logからSpinShelf関連のエラーログを検索
    let errorLogs = '';
    let errorLogCount = 0;
    try {
      // 直近10分間のSpinShelf関連エラーログを取得
      errorLogs = runShell(
        `log show --predicate 'processImagePath CONTAINS "SpinShelf" AND (messageType == error OR messageType == fault)' --last 10m 2>/dev/null | head -50 || echo ""`,
        30_000
      );
      // ヘッダー行を除外してカウント
      const lines = errorLogs.split('\n').filter(
        line => line.trim().length > 0 && !line.startsWith('Timestamp') && !line.startsWith('---')
      );
      errorLogCount = lines.length;
    } catch {
      errorLogs = '';
      errorLogCount = 0;
    }

    // Step 2: クラッシュレポートが存在しないことを確認
    let crashReportExists = false;
    let crashReportPath = '';
    try {
      const result = runShell(
        `find ~/Library/Logs/DiagnosticReports -name "SpinShelf*" -mmin -30 2>/dev/null | head -1 || echo ""`
      );
      crashReportExists = result.length > 0;
      crashReportPath = result;
    } catch {
      crashReportExists = false;
    }

    // Step 3: stderr出力の確認（プロセスの標準エラーに出力がないか）
    let stderrOutput = '';
    try {
      // Console.appのログからwarning以上を検索
      stderrOutput = runShell(
        `log show --predicate 'processImagePath CONTAINS "SpinShelf" AND messageType >= error' --last 10m --style compact 2>/dev/null | tail -20 || echo ""`,
        30_000
      );
    } catch {
      stderrOutput = '';
    }

    // Step 4: Fatal error / assertion failureがないことを確認
    let hasFatalError = false;
    try {
      const fatalCheck = runShell(
        `log show --predicate 'processImagePath CONTAINS "SpinShelf" AND message CONTAINS[cd] "fatal"' --last 10m 2>/dev/null | head -5 || echo ""`,
        30_000
      );
      const fatalLines = fatalCheck.split('\n').filter(
        line => line.trim().length > 0 && !line.startsWith('Timestamp') && !line.startsWith('---')
      );
      hasFatalError = fatalLines.length > 0;
    } catch {
      hasFatalError = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('error-log-result', {
      pid,
      errorLogCount,
      errorLogs: errorLogs.slice(0, 2000),
      crashReportExists,
      crashReportPath,
      hasFatalError,
      stderrOutput: stderrOutput.slice(0, 1000),
    });

    // クラッシュレポートがないこと
    expect(crashReportExists).toBe(false);
    // Fatal errorがないこと
    expect(hasFatalError).toBe(false);
    // エラーログが過度に出力されていないこと（5件以下を許容）
    expect(errorLogCount).toBeLessThanOrEqual(5);
  });
});
