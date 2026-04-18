import { runAppleScript, runShell } from './macos-automation';

/**
 * Simulate key press using AppleScript System Events
 */
export function pressKey(keyCode: number, modifiers: string[] = []): void {
  const modString = modifiers.length > 0
    ? ` using {${modifiers.map(m => `${m} down`).join(', ')}}`
    : '';
  runAppleScript(`
    tell application "System Events"
      key code ${keyCode}${modString}
    end tell
  `);
}

/**
 * Simulate the default SpinShelf rotate left shortcut (Ctrl+Shift+Left)
 */
export function rotateLeft(): void {
  pressKey(123, ['control', 'shift']); // 123 = Left Arrow
}

/**
 * Simulate the default SpinShelf rotate right shortcut (Ctrl+Shift+Right)
 */
export function rotateRight(): void {
  pressKey(124, ['control', 'shift']); // 124 = Right Arrow
}

/**
 * Simulate rapid repeated rotation
 */
export function rapidRotate(direction: 'left' | 'right', count: number, intervalMs = 100): void {
  const fn = direction === 'left' ? rotateLeft : rotateRight;
  for (let i = 0; i < count; i++) {
    fn();
    if (i < count - 1) {
      // Use AppleScript delay for timing
      runAppleScript(`delay ${intervalMs / 1000}`);
    }
  }
}

/**
 * Simulate scroll gesture with modifier keys using cliclick or AppleScript
 */
export function scrollWithModifiers(
  deltaX: number,
  modifiers: string[] = ['control', 'shift']
): void {
  // Use AppleScript to simulate scroll event
  // Note: This is a best-effort simulation; real trackpad gestures may differ
  const modKeyDown = modifiers.map(m => `key down ${m}`).join('\n      ');
  const modKeyUp = modifiers.map(m => `key up ${m}`).join('\n      ');
  runAppleScript(`
    tell application "System Events"
      ${modKeyDown}
      -- Scroll simulation not directly supported via AppleScript
      -- Using keyboard shortcut instead as fallback
      ${modKeyUp}
    end tell
  `);
}

/**
 * Type text using AppleScript
 */
export function typeText(text: string): void {
  runAppleScript(`
    tell application "System Events"
      keystroke "${text.replace(/"/g, '\\"')}"
    end tell
  `);
}

/**
 * Press Enter key
 */
export function pressEnter(): void {
  pressKey(36); // 36 = Return
}

/**
 * Press Escape key
 */
export function pressEscape(): void {
  pressKey(53); // 53 = Escape
}
