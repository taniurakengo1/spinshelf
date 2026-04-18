import { TestInfo } from '@playwright/test';
import { runShell } from './macos-automation';
import path from 'path';
import fs from 'fs';

const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');

export async function takeScreenshot(
  testInfo: TestInfo,
  label: string
): Promise<string> {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const sanitized = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${testInfo.testId}_${sanitized}_${Date.now()}.png`;
  const filepath = path.join(EVIDENCE_DIR, filename);

  runShell(`screencapture -x "${filepath}"`);

  await testInfo.attach(label, {
    path: filepath,
    contentType: 'image/png',
  });

  return filepath;
}

export async function takeDisplayScreenshot(
  testInfo: TestInfo,
  displayIndex: number,
  label: string
): Promise<string> {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const sanitized = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${testInfo.testId}_display${displayIndex}_${sanitized}_${Date.now()}.png`;
  const filepath = path.join(EVIDENCE_DIR, filename);

  runShell(`screencapture -x -D ${displayIndex + 1} "${filepath}"`);

  await testInfo.attach(`${label} (Display ${displayIndex})`, {
    path: filepath,
    contentType: 'image/png',
  });

  return filepath;
}

export async function attachJSON(
  testInfo: TestInfo,
  label: string,
  data: unknown
): Promise<void> {
  await testInfo.attach(label, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}
