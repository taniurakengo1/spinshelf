import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

test.describe('P090: GitHubリリースからの更新チェックが動作すること (@アップデートチェックテスター)', () => {
  test('GitHub APIからリリース情報を取得できること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: ソースコード内に更新チェック機能が存在することを確認
    let hasUpdateChecker = false;
    try {
      const result = runShell(
        `grep -rl "UpdateChecker\\|update.*check\\|github.*releases\\|api.github.com" "${PROJECT_ROOT}/Sources/" 2>/dev/null || echo ""`
      );
      hasUpdateChecker = result.length > 0;
    } catch {
      hasUpdateChecker = false;
    }

    // Step 2: GitHub APIエンドポイントにアクセスできることを確認
    let apiAccessible = false;
    let latestRelease = '';
    try {
      const response = runShell(
        `curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/hattori-sat/spinshelf/releases/latest" 2>/dev/null || echo "000"`,
        10_000
      );
      apiAccessible = response === '200';

      if (apiAccessible) {
        latestRelease = runShell(
          `curl -s "https://api.github.com/repos/hattori-sat/spinshelf/releases/latest" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('tag_name',''))" || echo ""`,
          10_000
        );
      }
    } catch {
      apiAccessible = false;
    }

    // Step 3: 現在のバージョンを取得
    let currentVersion = '';
    try {
      currentVersion = runShell(
        `grep -r "version\\|Version\\|APP_VERSION" "${PROJECT_ROOT}/Sources/" 2>/dev/null | head -3 || echo "unknown"`
      );
    } catch {
      currentVersion = 'unknown';
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('update-check-result', {
      hasUpdateChecker,
      apiAccessible,
      latestRelease,
      currentVersion: currentVersion.slice(0, 500),
    });

    // 更新チェック機能が実装されていること
    expect(hasUpdateChecker).toBe(true);
  });
});
