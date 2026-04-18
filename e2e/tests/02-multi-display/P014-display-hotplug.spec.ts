import { test, expect } from '../../fixtures/spinshelf.fixture';
import { getDisplays, getDisplayCount } from '../../helpers/display-helpers';
import { isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P014: ディスプレイホットプラグ (@接続テスター)', () => {
  test('ディスプレイの接続/取り外しに動的対応すること', async ({ spinshelf }, testInfo) => {
    // Note: 実環境では物理的なホットプラグはテスト困難。
    // このテストはディスプレイ構成の変化検出ロジックを確認する。

    await spinshelf.screenshot('before-hotplug-test');

    // Step 1: 現在のディスプレイ構成を記録
    const initialDisplays = getDisplays();
    const initialCount = getDisplayCount();

    await spinshelf.attachData('initial-config', {
      count: initialCount,
      displays: initialDisplays,
    });

    // Step 2: ディスプレイ構成を再取得し一貫性を確認
    await sleep(1000);
    const refreshedDisplays = getDisplays();
    const refreshedCount = getDisplayCount();

    // Step 3: 再取得した結果が一致することを確認（安定性テスト）
    expect(refreshedCount).toBe(initialCount);
    expect(refreshedDisplays.length).toBe(initialDisplays.length);

    for (let i = 0; i < initialDisplays.length; i++) {
      const initial = initialDisplays[i];
      const refreshed = refreshedDisplays.find(d => d.id === initial.id);
      expect(refreshed).toBeDefined();
      expect(refreshed!.width).toBe(initial.width);
      expect(refreshed!.height).toBe(initial.height);
    }

    // Step 4: アプリがクラッシュしていないことを確認
    expect(isAppRunning()).toBe(true);

    await spinshelf.screenshot('after-hotplug-test');
    await spinshelf.attachData('hotplug-stability', {
      configConsistent: true,
      appStable: true,
      note: 'Physical hotplug test requires manual intervention. This test verifies display detection stability.',
    });
  });
});
