import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

for (const file of [
  'SKILL.md',
  'references/review-output.md',
  'references/evidence-requirements.md',
]) {
  test(`审查基线包含 ${file}`, async () => {
    const text = await readFile(new URL(`./${file}`, import.meta.url), 'utf8');
    assert.ok(text.includes('P0'));
  });
}
