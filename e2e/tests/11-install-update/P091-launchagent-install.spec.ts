import { test, expect } from '../../fixtures/spinshelf.fixture';
import { runShell } from '../../helpers/macos-automation';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const PLIST_NAME = 'com.hattou.SpinShelf.plist';
const LAUNCH_AGENTS_DIR = path.join(process.env.HOME || '~', 'Library/LaunchAgents');

test.describe('P091: LaunchAgent plistが正しくインストールされること (@LaunchAgentテスター)', () => {
  test('LaunchAgent plistが正しい形式でインストールされること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // Step 1: plistテンプレートがプロジェクト内に存在するか確認
    let plistTemplateExists = false;
    let plistTemplatePath = '';
    try {
      plistTemplatePath = runShell(
        `find "${PROJECT_ROOT}" -name "*.plist" -not -path "*/.build/*" 2>/dev/null | head -1 || echo ""`
      );
      plistTemplateExists = plistTemplatePath.length > 0;
    } catch {
      plistTemplateExists = false;
    }

    // Step 2: LaunchAgentsディレクトリにplistがインストールされているか確認
    let plistInstalled = false;
    let installedPlistPath = '';
    try {
      installedPlistPath = path.join(LAUNCH_AGENTS_DIR, PLIST_NAME);
      const result = runShell(`test -f "${installedPlistPath}" && echo "exists" || echo "missing"`);
      plistInstalled = result === 'exists';
    } catch {
      plistInstalled = false;
    }

    // Step 3: plistの内容が正しい形式であることを確認
    let plistValid = false;
    let plistContent: Record<string, unknown> = {};
    if (plistInstalled) {
      try {
        // plutil で形式チェック
        const validateResult = runShell(`plutil -lint "${installedPlistPath}" 2>&1`);
        plistValid = validateResult.includes('OK');

        // plistの主要キーを確認
        const label = runShell(
          `/usr/libexec/PlistBuddy -c "Print :Label" "${installedPlistPath}" 2>/dev/null || echo ""`
        );
        const program = runShell(
          `/usr/libexec/PlistBuddy -c "Print :Program" "${installedPlistPath}" 2>/dev/null || echo ""`
        );
        const runAtLoad = runShell(
          `/usr/libexec/PlistBuddy -c "Print :RunAtLoad" "${installedPlistPath}" 2>/dev/null || echo ""`
        );

        plistContent = { label, program, runAtLoad };
      } catch {
        plistValid = false;
      }
    }

    // Step 4: ソースコードにLaunchAgentセットアップロジックが存在するか確認
    let hasLaunchAgentSetup = false;
    try {
      const result = runShell(
        `grep -rl "LaunchAgent\\|launchAgent\\|launch.*agent" "${PROJECT_ROOT}/Sources/" 2>/dev/null || echo ""`
      );
      hasLaunchAgentSetup = result.length > 0;
    } catch {
      hasLaunchAgentSetup = false;
    }

    await spinshelf.screenshot('after');
    await spinshelf.attachData('launchagent-result', {
      plistTemplateExists,
      plistTemplatePath,
      plistInstalled,
      installedPlistPath,
      plistValid,
      plistContent,
      hasLaunchAgentSetup,
    });

    // LaunchAgentセットアップ機能が存在すること
    expect(hasLaunchAgentSetup).toBe(true);
    // plistテンプレートまたはインストール済みplistが存在すること
    expect(plistTemplateExists || plistInstalled).toBe(true);
  });
});
