import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

test('vertical option B shell has no title counter gear or config panel', () => {
  assert.match(indexHtml, /id="filter-bar"[^>]*class="filter-bar vertical/);
  assert.match(indexHtml, /id="add-filter-placeholder"/);
  assert.match(indexHtml, /id="field-menu"/);
  assert.match(indexHtml, /id="filter-editor"/);
  assert.doesNotMatch(indexHtml, /Global filter/);
  assert.doesNotMatch(indexHtml, /id="row-count"/);
  assert.doesNotMatch(indexHtml, /id="open-config"/);
  assert.doesNotMatch(indexHtml, /id="config-panel"/);
});

test('vertical option B stacks tight tags and expands downward inside narrow widget', () => {
  assert.match(indexHtml, /id="active-chips"[^>]*class="chip-list compact vertical/);
  assert.match(stylesCss, /\.filter-bar\.vertical\s*\{/);
  assert.match(stylesCss, /flex-direction:\s*column/);
  assert.match(stylesCss, /align-items:\s*stretch/);
  assert.match(stylesCss, /\.chip-list\.vertical\s*\{/);
  assert.match(stylesCss, /display:\s*grid/);
  assert.match(stylesCss, /\.filter-chip\s*\{/);
  assert.match(stylesCss, /font-size:\s*0\.72rem/);
  assert.match(stylesCss, /padding:\s*0\.16rem 0\.38rem/);
  assert.match(stylesCss, /\.popover\s*\{/);
  assert.match(stylesCss, /position:\s*static/);
});
