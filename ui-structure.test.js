import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

test('option B shell is only an empty add-filter bar plus compact tags', () => {
  assert.match(indexHtml, /id="filter-bar"[^>]*class="filter-bar/);
  assert.match(indexHtml, /id="add-filter-placeholder"/);
  assert.match(indexHtml, /id="field-menu"/);
  assert.match(indexHtml, /id="filter-editor"/);
  assert.doesNotMatch(indexHtml, /Global filter/);
  assert.doesNotMatch(indexHtml, /id="row-count"/);
  assert.doesNotMatch(indexHtml, /id="open-config"/);
  assert.doesNotMatch(indexHtml, /id="config-panel"/);
});

test('option B uses tight pills and can grow downward when many tags exist', () => {
  assert.match(indexHtml, /id="active-chips"[^>]*class="chip-list compact/);
  assert.match(stylesCss, /\.filter-bar\s*\{/);
  assert.match(stylesCss, /align-content:\s*start/);
  assert.match(stylesCss, /flex-wrap:\s*wrap/);
  assert.match(stylesCss, /font-size:\s*0\.72rem/);
  assert.match(stylesCss, /padding:\s*0\.16rem 0\.38rem/);
});
