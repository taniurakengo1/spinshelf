import { runShell, runAppleScript, sleep } from './macos-automation';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const BUNDLE_ID = 'com.hattou.SpinShelf';

export async function buildApp(): Promise<void> {
  runShell(`cd "${PROJECT_ROOT}" && swift build`, 120_000);
}

export async function launchApp(): Promise<number> {
  const binPath = runShell(`cd "${PROJECT_ROOT}" && swift build --show-bin-path`);
  runShell(`"${binPath}/SpinShelf" &`);
  await sleep(2000);
  const pid = runShell(`pgrep -f SpinShelf || true`);
  return parseInt(pid, 10);
}

export async function terminateApp(): Promise<void> {
  try {
    runShell('pkill -f SpinShelf || true');
    await sleep(500);
  } catch {
    // App may not be running
  }
}

export function isAppRunning(): boolean {
  try {
    const result = runShell('pgrep -f SpinShelf || true');
    return result.length > 0;
  } catch {
    return false;
  }
}

export function getAppPID(): number | null {
  try {
    const result = runShell('pgrep -f SpinShelf || true');
    return result ? parseInt(result, 10) : null;
  } catch {
    return null;
  }
}

export function getAppMemoryUsage(): number {
  try {
    const pid = getAppPID();
    if (!pid) return 0;
    const result = runShell(`ps -o rss= -p ${pid}`);
    return parseInt(result, 10) * 1024; // Convert KB to bytes
  } catch {
    return 0;
  }
}

export function getAppCPUUsage(): number {
  try {
    const pid = getAppPID();
    if (!pid) return 0;
    const result = runShell(`ps -o %cpu= -p ${pid}`);
    return parseFloat(result);
  } catch {
    return 0;
  }
}
