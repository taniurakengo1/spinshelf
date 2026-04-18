import { runAppleScript, sleep } from './macos-automation';

export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function openFinderWindow(x: number, y: number, width: number, height: number): void {
  runAppleScript(`
    tell application "Finder"
      activate
      set newWindow to make new Finder window
      set bounds of newWindow to {${x}, ${y}, ${x + width}, ${y + height}}
    end tell
  `);
}

export function openTextEditWindow(x: number, y: number, width: number, height: number): void {
  runAppleScript(`
    tell application "TextEdit"
      activate
      make new document
    end tell
    delay 0.5
    tell application "TextEdit"
      set bounds of front window to {${x}, ${y}, ${x + width}, ${y + height}}
    end tell
  `);
}

export function openSafariWindow(url: string, x: number, y: number, width: number, height: number): void {
  runAppleScript(`
    tell application "Safari"
      activate
      make new document with properties {URL:"${url}"}
    end tell
    delay 1
    tell application "Safari"
      set bounds of front window to {${x}, ${y}, ${x + width}, ${y + height}}
    end tell
  `);
}

export function getWindowPosition(appName: string): WindowPosition | null {
  try {
    const result = runAppleScript(`
      tell application "${appName}"
        if (count of windows) > 0 then
          set b to bounds of front window
          return (item 1 of b) & "," & (item 2 of b) & "," & (item 3 of b) & "," & (item 4 of b)
        end if
      end tell
    `);
    const [x1, y1, x2, y2] = result.split(',').map(Number);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  } catch {
    return null;
  }
}

export function getAllWindowPositions(appName: string): WindowPosition[] {
  try {
    const result = runAppleScript(`
      tell application "${appName}"
        set windowList to ""
        repeat with w in windows
          set b to bounds of w
          set windowList to windowList & (item 1 of b) & "," & (item 2 of b) & "," & (item 3 of b) & "," & (item 4 of b) & ";"
        end repeat
        return windowList
      end tell
    `);
    return result.split(';').filter(Boolean).map(entry => {
      const [x1, y1, x2, y2] = entry.split(',').map(Number);
      return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    });
  } catch {
    return [];
  }
}

export function closeAllWindows(appName: string): void {
  try {
    runAppleScript(`
      tell application "${appName}"
        close every window
      end tell
    `);
  } catch {
    // App may not be running
  }
}

export function closeAllTestWindows(): void {
  for (const app of ['Finder', 'TextEdit', 'Safari']) {
    closeAllWindows(app);
  }
  // Quit TextEdit and Safari to clean up
  try { runAppleScript('tell application "TextEdit" to quit'); } catch {}
  try { runAppleScript('tell application "Safari" to quit'); } catch {}
}

export function countWindows(appName: string): number {
  try {
    const result = runAppleScript(`
      tell application "${appName}"
        return count of windows
      end tell
    `);
    return parseInt(result, 10);
  } catch {
    return 0;
  }
}

export function minimizeWindow(appName: string): void {
  runAppleScript(`
    tell application "${appName}"
      set miniaturized of front window to true
    end tell
  `);
}

export function setWindowFullscreen(appName: string): void {
  runAppleScript(`
    tell application "System Events"
      tell process "${appName}"
        set value of attribute "AXFullScreen" of front window to true
      end tell
    end tell
  `);
}
