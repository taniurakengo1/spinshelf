import { execSync, exec } from 'child_process';

export function runAppleScript(script: string): string {
  return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
    encoding: 'utf-8',
    timeout: 30_000,
  }).trim();
}

export function runAppleScriptFile(path: string): string {
  return execSync(`osascript "${path}"`, {
    encoding: 'utf-8',
    timeout: 30_000,
  }).trim();
}

export function runShell(command: string, timeoutMs = 30_000): string {
  return execSync(command, {
    encoding: 'utf-8',
    timeout: timeoutMs,
  }).trim();
}

export function runShellAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'utf-8', timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
