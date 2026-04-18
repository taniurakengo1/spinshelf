import { test, expect } from '../../fixtures/spinshelf.fixture';
import { setShortcut, readDefault, resetAllDefaults } from '../../helpers/settings-helpers';
import { sleep } from '../../helpers/macos-automation';

test.describe('P042: ショートカット変更 (@キー変更テスター)', () => {
  test.afterEach(async () => {
    resetAllDefaults();
    await sleep(500);
  });

  test('ショートカットの変更が保存されること', async ({ spinshelf }, testInfo) => {
    await spinshelf.screenshot('before');

    // 新しいショートカットを設定: Ctrl+Option+Left (keyCode=123)
    setShortcut('left', 123, 0x40000 | 0x80000);
    await sleep(500);

    // 設定が保存されたか確認
    const savedValue = readDefault('rotateLeftShortcut');

    // 右回転も変更: Ctrl+Option+Right (keyCode=124)
    setShortcut('right', 124, 0x40000 | 0x80000);
    await sleep(500);

    const savedValueRight = readDefault('rotateRightShortcut');

    await spinshelf.screenshot('after');
    await spinshelf.attachData('results', {
      leftShortcutSaved: savedValue !== null,
      rightShortcutSaved: savedValueRight !== null,
      savedLeftValue: savedValue,
      savedRightValue: savedValueRight,
    });

    expect(savedValue).not.toBeNull();
    expect(savedValueRight).not.toBeNull();
  });
});
