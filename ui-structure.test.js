import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexHtml = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const appJs = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

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

test('widget uses standard Grist visible-column configuration instead of custom mapping dropdowns', () => {
  assert.match(appJs, /grist\.ready\(\{\s*requiredAccess:\s*'read table',\s*allowSelectBy:\s*true,\s*\}\)/s);
  assert.doesNotMatch(appJs, /columns:\s*\[/);
  assert.match(appJs, /includeColumns:\s*'shown'/);
});

test('value editor keeps checkbox size independent from text visibility', () => {
  assert.match(stylesCss, /\.value-item input\s*\{[^}]*width:\s*0\.9rem/s);
  assert.doesNotMatch(stylesCss, /\.editor-fields input\s*\{/);
});

test('widget follows Grist theme variables instead of hard-coded light mode', () => {
  assert.match(stylesCss, /color-scheme:\s*light dark/);
  assert.match(stylesCss, /--grist-theme-widget-bg/);
  assert.match(stylesCss, /--grist-theme-text/);
  assert.match(stylesCss, /--grist-theme-input-bg/);
  assert.match(stylesCss, /--grist-theme-control-primary-bg/);
  assert.doesNotMatch(stylesCss, /color-scheme:\s*light;/);
});

test('widget layout reacts to available width', () => {
  assert.match(stylesCss, /container-type:\s*inline-size/);
  assert.match(stylesCss, /@container\s*\(min-width:\s*300px\)/);
  assert.match(stylesCss, /@container\s*\(min-width:\s*520px\)/);
  assert.match(appJs, /ResizeObserver/);
  assert.match(appJs, /dataset\.layout\s*=\s*layout/);
  assert.match(stylesCss, /data-layout="medium"/);
  assert.match(stylesCss, /data-layout="wide"/);
});

test('layout keeps filter controls inside iframe bounds', () => {
  assert.match(stylesCss, /\.app-shell\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(stylesCss, /\.app-shell\s*\{[^}]*padding:\s*0\.22rem 0\.8rem 0\.22rem 0\.22rem/s);
  assert.match(stylesCss, /\.filter-bar\s*\{[^}]*width:\s*auto/s);
  assert.match(stylesCss, /\.filter-bar\s*\{[^}]*max-width:\s*100%/s);
  assert.match(stylesCss, /\.filter-bar\s*\{[^}]*overflow:\s*hidden/s);
  assert.doesNotMatch(stylesCss, /position:\s*absolute/);
  assert.match(stylesCss, /\.range-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(stylesCss, /\.range-fields input\s*\{[^}]*min-width:\s*0/s);
});

test('ultra-narrow Grist iframe caps the rail while still fitting true narrow iframes', () => {
  assert.match(stylesCss, /--grist-narrow-rail-cap:\s*180px/);
  assert.match(stylesCss, /@media\s*\(max-width:\s*320px\)/);
  assert.match(stylesCss, /\.app-shell\s*\{[^}]*width:\s*min\(100%,\s*var\(--grist-narrow-rail-cap\)\)/s);
  assert.match(stylesCss, /\.app-shell\s*\{[^}]*max-width:\s*min\(100%,\s*var\(--grist-narrow-rail-cap\)\)/s);
  assert.doesNotMatch(stylesCss, /\.app-shell\s*\{[^}]*width:\s*100%;\s*\n\s*max-width:\s*100%;/s);
  assert.match(stylesCss, /\.editor-actions\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(stylesCss, /\.editor-action\s*\{[^}]*width:\s*100%/s);
});

test('long filter chip text wraps and grows the pill height instead of clipping', () => {
  assert.match(stylesCss, /\.filter-chip\s*\{[^}]*height:\s*auto/s);
  assert.match(stylesCss, /\.filter-chip\s*\{[^}]*white-space:\s*normal/s);
  assert.match(stylesCss, /\.filter-chip-label\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(stylesCss, /\.filter-chip-label\s*\{[^}]*overflow:\s*visible/s);
  assert.match(stylesCss, /\.filter-chip-remove\s*\{[^}]*flex:\s*0 0 auto/s);
});

test('add-filter placeholder wraps and grows instead of clipping in ultra-narrow widgets', () => {
  assert.match(stylesCss, /\.add-filter-placeholder\s*\{[^}]*height:\s*auto/s);
  assert.match(stylesCss, /\.add-filter-placeholder\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(stylesCss, /\.add-filter-placeholder\s*\{[^}]*overflow:\s*visible/s);
  assert.match(stylesCss, /\.add-filter-placeholder\s*\{[^}]*white-space:\s*normal/s);
  assert.match(stylesCss, /\.filter-chip,\s*\n\s*\.add-filter-placeholder\s*\{[^}]*border-radius:\s*14px/s);
});
