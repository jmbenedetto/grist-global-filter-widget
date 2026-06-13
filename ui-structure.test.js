import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

test('widget shell uses a compact horizontal filter bar instead of stacked panels', () => {
  assert.match(indexHtml, /class="filter-bar"/);
  assert.doesNotMatch(indexHtml, /class="app-header"/);
  assert.doesNotMatch(indexHtml, /class="help-text"/);
  assert.match(stylesCss, /\.filter-bar\s*\{/);
  assert.match(stylesCss, /grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/);
});

test('active chips and filter controls live in the same row for small footprint', () => {
  assert.match(indexHtml, /id="filter-list"[^>]*class="filter-strip"/);
  assert.match(indexHtml, /id="active-chips"[^>]*class="chip-list compact/);
  assert.match(stylesCss, /\.filter-strip\s*\{/);
  assert.match(stylesCss, /overflow-x:\s*auto/);
  assert.match(stylesCss, /max-height:\s*64px/);
});
