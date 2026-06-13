import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRecords, normalizeOptions, uniqueFieldValues } from './filter-core.js';

const records = [
  { id: 1, category: 'A', status: 'New', active: true, notes: 'Priority supplier', qty: 10, due: '2026-06-01' },
  { id: 2, category: 'B', status: 'New', active: false, notes: 'Backlog review', qty: 20, due: '2026-06-10' },
  { id: 3, category: 'A', status: 'Closed', active: true, notes: 'priority replenishment', qty: 30, due: '2026-07-01' },
];

test('empty filter publishes all rows by default', () => {
  const options = normalizeOptions({ filters: [{ field: 'category', type: 'singleSelect' }] });
  assert.deepEqual(filterRecords(records, options, {}).map((row) => row.id), [1, 2, 3]);
});

test('empty filter can publish no rows', () => {
  const options = normalizeOptions({ emptyBehavior: 'none', filters: [{ field: 'category', type: 'singleSelect' }] });
  assert.deepEqual(filterRecords(records, options, {}).map((row) => row.id), []);
});

test('single-select filters one category', () => {
  const options = normalizeOptions({ filters: [{ field: 'category', type: 'singleSelect' }] });
  assert.deepEqual(filterRecords(records, options, { category: 'A' }).map((row) => row.id), [1, 3]);
});

test('multi-select values use OR semantics inside one field', () => {
  const options = normalizeOptions({ filters: [{ field: 'status', type: 'multiSelect' }] });
  assert.deepEqual(filterRecords(records, options, { status: ['New', 'Closed'] }).map((row) => row.id), [1, 2, 3]);
});

test('multiple fields use AND semantics', () => {
  const options = normalizeOptions({
    filters: [
      { field: 'category', type: 'singleSelect' },
      { field: 'status', type: 'multiSelect' },
      { field: 'active', type: 'boolean' },
    ],
  });
  assert.deepEqual(filterRecords(records, options, { category: 'A', status: ['New'], active: true }).map((row) => row.id), [1]);
});

test('text contains is case-insensitive', () => {
  const options = normalizeOptions({ filters: [{ field: 'notes', type: 'text' }] });
  assert.deepEqual(filterRecords(records, options, { notes: 'PRIORITY' }).map((row) => row.id), [1, 3]);
});

test('number range checks min and max bounds', () => {
  const options = normalizeOptions({ filters: [{ field: 'qty', type: 'numberRange' }] });
  assert.deepEqual(filterRecords(records, options, { qty: { min: '15', max: '30' } }).map((row) => row.id), [2, 3]);
});

test('date range checks ISO-like date bounds', () => {
  const options = normalizeOptions({ filters: [{ field: 'due', type: 'dateRange' }] });
  assert.deepEqual(filterRecords(records, options, { due: { min: '2026-06-02', max: '2026-06-30' } }).map((row) => row.id), [2]);
});

test('uniqueFieldValues returns sorted nonblank strings', () => {
  assert.deepEqual(uniqueFieldValues(records, 'category'), ['A', 'B']);
});
