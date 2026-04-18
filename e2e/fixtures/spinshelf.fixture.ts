import { test as base, TestInfo } from '@playwright/test';
import { buildApp, launchApp, terminateApp, isAppRunning } from '../helpers/app-lifecycle';
import { closeAllTestWindows } from '../helpers/window-helpers';
import { getDisplays, getDisplayCount, DisplayInfo } from '../helpers/display-helpers';
import { takeScreenshot, attachJSON } from '../helpers/screenshot';
import { resetAllDefaults } from '../helpers/settings-helpers';
import { sleep } from '../helpers/macos-automation';

type SpinShelfFixtures = {
  spinshelf: {
    pid: number;
    displays: DisplayInfo[];
    displayCount: number;
    isMultiDisplay: boolean;
    screenshot: (label: string) => Promise<string>;
    attachData: (label: string, data: unknown) => Promise<void>;
    waitForRotation: () => Promise<void>;
  };
};

export const test = base.extend<SpinShelfFixtures>({
  spinshelf: async ({}, use, testInfo) => {
    // Setup: ensure app is built and running
    if (!isAppRunning()) {
      await buildApp();
      await launchApp();
      await sleep(2000);
    }

    const displays = getDisplays();
    const displayCount = getDisplayCount();

    const fixture = {
      pid: 0,
      displays,
      displayCount,
      isMultiDisplay: displayCount >= 2,
      screenshot: (label: string) => takeScreenshot(testInfo, label),
      attachData: (label: string, data: unknown) => attachJSON(testInfo, label, data),
      waitForRotation: () => sleep(1500),
    };

    // Take pre-test screenshot
    await takeScreenshot(testInfo, 'pre-test');

    await use(fixture);

    // Teardown: take post-test screenshot, clean up test windows
    await takeScreenshot(testInfo, 'post-test');
    closeAllTestWindows();
    await sleep(500);
  },
});

export { expect } from '@playwright/test';
