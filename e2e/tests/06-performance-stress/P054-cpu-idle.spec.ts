import { test, expect } from '../../fixtures/spinshelf.fixture';
import { getAppCPUUsage, isAppRunning } from '../../helpers/app-lifecycle';
import { sleep } from '../../helpers/macos-automation';

test.describe('P054: アイドル時CPU使用率 (@CPUテスター)', () => {
  test('アイドル時のCPU使用率が低いこと(1%以下)', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // アイドル状態を安定させるために待機
    await sleep(3000);

    // CPU使用率を複数回サンプリング
    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const cpu = getAppCPUUsage();
      samples.push(cpu);
      await sleep(1000);
    }

    const averageCPU = samples.reduce((a, b) => a + b, 0) / samples.length;
    const maxCPU = Math.max(...samples);
    const appStillRunning = isAppRunning();

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      samples,
      averageCPU: averageCPU.toFixed(2),
      maxCPU: maxCPU.toFixed(2),
      appStillRunning,
      cpuUnder1Percent: averageCPU < 1.0,
    });

    // アプリがクラッシュしていないこと
    expect(appStillRunning).toBe(true);
    // 平均CPU使用率が1%以下であること
    expect(averageCPU).toBeLessThan(1.0);
  });
});
