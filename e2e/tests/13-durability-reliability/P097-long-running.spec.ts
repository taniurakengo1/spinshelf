import { test, expect } from '../../fixtures/spinshelf.fixture';
import { sleep } from '../../helpers/macos-automation';
import { isAppRunning, getAppMemoryUsage, getAppCPUUsage } from '../../helpers/app-lifecycle';

test.describe('P097: 1時間連続起動でもメモリ・CPU安定であること (@長時間テスター)', () => {
  test('5分間のモニタリングでメモリ・CPUが安定していること', async ({ spinshelf }, testInfo) => {
    // 5分間のモニタリング（短縮版）
    test.setTimeout(360_000); // 6分タイムアウト

    await spinshelf.screenshot('before');

    const MONITORING_INTERVAL_MS = 30_000; // 30秒ごとに計測
    const MONITORING_DURATION_MS = 300_000; // 5分間
    const SAMPLE_COUNT = Math.floor(MONITORING_DURATION_MS / MONITORING_INTERVAL_MS);

    const samples: Array<{
      timestamp: number;
      memoryBytes: number;
      cpuPercent: number;
      isRunning: boolean;
    }> = [];

    // 初回計測
    const initialMemory = getAppMemoryUsage();
    const initialCpu = getAppCPUUsage();
    samples.push({
      timestamp: Date.now(),
      memoryBytes: initialMemory,
      cpuPercent: initialCpu,
      isRunning: isAppRunning(),
    });

    // 定期計測
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      await sleep(MONITORING_INTERVAL_MS);

      const memory = getAppMemoryUsage();
      const cpu = getAppCPUUsage();
      const running = isAppRunning();

      samples.push({
        timestamp: Date.now(),
        memoryBytes: memory,
        cpuPercent: cpu,
        isRunning: running,
      });

      // プロセスが途中で終了していないこと
      expect(running).toBe(true);
    }

    // メモリリークチェック: 最後のサンプルが初回の3倍を超えていないこと
    const lastMemory = samples[samples.length - 1].memoryBytes;
    const memoryGrowthRatio = initialMemory > 0 ? lastMemory / initialMemory : 1;

    // CPUチェック: 平均CPU使用率が50%を超えていないこと（アイドル時）
    const avgCpu = samples.reduce((sum, s) => sum + s.cpuPercent, 0) / samples.length;

    // 全サンプルでプロセスが動作していたこと
    const allRunning = samples.every(s => s.isRunning);

    await spinshelf.screenshot('after');
    await spinshelf.attachData('long-running-result', {
      sampleCount: samples.length,
      monitoringDurationMs: MONITORING_DURATION_MS,
      initialMemoryBytes: initialMemory,
      finalMemoryBytes: lastMemory,
      memoryGrowthRatio: Math.round(memoryGrowthRatio * 100) / 100,
      avgCpuPercent: Math.round(avgCpu * 100) / 100,
      maxCpuPercent: Math.max(...samples.map(s => s.cpuPercent)),
      allSamplesRunning: allRunning,
      samples,
    });

    expect(allRunning).toBe(true);
    expect(memoryGrowthRatio).toBeLessThan(3);
    expect(avgCpu).toBeLessThan(50);
  });
});
