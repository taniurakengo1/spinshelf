import { runShell } from './macos-automation';

const DOMAIN = 'com.hattou.SpinShelf';

export function readDefault(key: string): string | null {
  try {
    return runShell(`defaults read ${DOMAIN} ${key} 2>/dev/null`);
  } catch {
    return null;
  }
}

export function writeDefault(key: string, type: string, value: string): void {
  runShell(`defaults write ${DOMAIN} ${key} -${type} "${value}"`);
}

export function deleteDefault(key: string): void {
  try {
    runShell(`defaults delete ${DOMAIN} ${key} 2>/dev/null`);
  } catch {
    // Key may not exist
  }
}

export function resetAllDefaults(): void {
  try {
    runShell(`defaults delete ${DOMAIN} 2>/dev/null`);
  } catch {
    // Domain may not exist
  }
}

export function setShortcut(
  direction: 'left' | 'right',
  keyCode: number,
  modifiers: number
): void {
  const key = direction === 'left' ? 'rotateLeftShortcut' : 'rotateRightShortcut';
  const json = JSON.stringify({ keyCode, modifiers });
  // SpinShelf stores shortcuts as JSON-encoded Data in UserDefaults
  const base64 = Buffer.from(json).toString('base64');
  runShell(`defaults write ${DOMAIN} ${key} -data "${base64}"`);
}

export function getLaunchAtLogin(): boolean {
  const result = readDefault('launchAtLogin');
  return result === '1' || result === 'true';
}

export function setLaunchAtLogin(enabled: boolean): void {
  writeDefault('launchAtLogin', 'bool', enabled ? 'true' : 'false');
}

export function setDisplayOrder(displayIds: number[]): void {
  const json = JSON.stringify(displayIds);
  const base64 = Buffer.from(json).toString('base64');
  runShell(`defaults write ${DOMAIN} displayOrder -data "${base64}"`);
}
