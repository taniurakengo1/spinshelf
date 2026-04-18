import { runShell, runAppleScript } from './macos-automation';

export interface DisplayInfo {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isMain: boolean;
}

export function getDisplayCount(): number {
  const result = runShell(
    `system_profiler SPDisplaysDataType | grep -c "Resolution:" || echo "1"`
  );
  return parseInt(result, 10);
}

export function getDisplays(): DisplayInfo[] {
  try {
    const script = `
      tell application "Finder"
        set screenInfo to ""
        set idx to 0
        repeat with s in (current application's NSScreen's screens() as list)
          set f to s's frame()
          set o to item 1 of f
          set sz to item 2 of f
          set screenInfo to screenInfo & idx & "," & (item 1 of o) & "," & (item 2 of o) & "," & (item 1 of sz) & "," & (item 2 of sz) & ";"
          set idx to idx + 1
        end repeat
        return screenInfo
      end tell
    `;
    // Fallback: use system_profiler
    const result = runShell(
      `python3 -c "
import Quartz
displays = []
(err, ids, cnt) = Quartz.CGGetActiveDisplayList(16, None, None)
for d in ids:
    b = Quartz.CGDisplayBounds(d)
    main = 1 if Quartz.CGDisplayIsMain(d) else 0
    print(f'{d},{int(b.origin.x)},{int(b.origin.y)},{int(b.size.width)},{int(b.size.height)},{main}')
"`
    );
    return result.split('\n').filter(Boolean).map(line => {
      const [id, x, y, width, height, isMain] = line.split(',').map(Number);
      return { id, x, y, width, height, isMain: isMain === 1 };
    });
  } catch {
    return [{ id: 1, x: 0, y: 0, width: 1920, height: 1080, isMain: true }];
  }
}

export function getMainDisplay(): DisplayInfo {
  const displays = getDisplays();
  return displays.find(d => d.isMain) || displays[0];
}

export function isMultiDisplay(): boolean {
  return getDisplayCount() >= 2;
}

export function getDisplayForPosition(x: number, y: number): DisplayInfo | undefined {
  const displays = getDisplays();
  return displays.find(d =>
    x >= d.x && x < d.x + d.width &&
    y >= d.y && y < d.y + d.height
  );
}
