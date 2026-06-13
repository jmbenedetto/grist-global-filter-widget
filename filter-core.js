export const DEFAULT_OPTIONS = Object.freeze({
  version: 1,
  emptyBehavior: 'all',
  filters: [],
});

export const FILTER_TYPES = Object.freeze([
  'text',
  'singleSelect',
  'multiSelect',
  'boolean',
  'numberRange',
  'dateRange',
]);

export function normalizeOptions(rawOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...(rawOptions || {}) };
  const emptyBehavior = options.emptyBehavior === 'none' ? 'none' : 'all';
  const filters = Array.isArray(options.filters) ? options.filters : [];

  return {
    version: 1,
    emptyBehavior,
    filters: filters
      .map((filter) => ({
        field: String(filter.field || '').trim(),
        label: String(filter.label || filter.field || '').trim(),
        type: FILTER_TYPES.includes(filter.type) ? filter.type : 'text',
        defaultValue: normalizeDefaultValue(filter.type, filter.defaultValue ?? filter.default ?? ''),
      }))
      .filter((filter) => filter.field),
  };
}

export function normalizeDefaultValue(type, value) {
  if (value == null || value === '') return null;
  if (type === 'multiSelect') {
    return Array.isArray(value) ? value.map(String) : String(value).split(',').map((part) => part.trim()).filter(Boolean);
  }
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    const text = String(value).toLowerCase().trim();
    if (['true', 'yes', '1', 'y'].includes(text)) return true;
    if (['false', 'no', '0', 'n'].includes(text)) return false;
    return null;
  }
  if (type === 'numberRange' || type === 'dateRange') {
    if (typeof value === 'object' && value !== null) {
      return { min: value.min ?? '', max: value.max ?? '' };
    }
    return null;
  }
  return String(value);
}

export function buildInitialState(options) {
  return Object.fromEntries(options.filters.map((filter) => [filter.field, structuredCloneSafe(filter.defaultValue)]));
}

export function structuredCloneSafe(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

export function hasActiveValue(value, type) {
  if (value == null) return false;
  if (type === 'multiSelect') return Array.isArray(value) && value.length > 0;
  if (type === 'numberRange' || type === 'dateRange') return Boolean(value.min || value.max);
  if (type === 'boolean') return typeof value === 'boolean';
  return String(value).trim() !== '';
}

export function activeFilters(options, state) {
  return options.filters.filter((filter) => hasActiveValue(state[filter.field], filter.type));
}

export function filterRecords(records, options, state) {
  const configuredFilters = activeFilters(options, state);
  if (configuredFilters.length === 0) {
    return options.emptyBehavior === 'none' ? [] : records.slice();
  }

  return records.filter((record) => configuredFilters.every((filter) => recordMatchesFilter(record, filter, state[filter.field])));
}

export function recordMatchesFilter(record, filter, activeValue) {
  const rawValue = getRecordValue(record, filter.field);

  switch (filter.type) {
    case 'singleSelect':
      return normalizeComparable(rawValue) === normalizeComparable(activeValue);
    case 'multiSelect': {
      const selected = Array.isArray(activeValue) ? activeValue : [];
      const value = normalizeComparable(rawValue);
      return selected.some((item) => normalizeComparable(item) === value);
    }
    case 'boolean':
      return normalizeBoolean(rawValue) === activeValue;
    case 'numberRange':
      return inNumberRange(rawValue, activeValue);
    case 'dateRange':
      return inDateRange(rawValue, activeValue);
    case 'text':
    default:
      return normalizeText(rawValue).includes(normalizeText(activeValue));
  }
}

export function uniqueFieldValues(records, field) {
  const values = new Set();
  records.forEach((record) => {
    const value = getRecordValue(record, field);
    if (value !== undefined && value !== null && value !== '') values.add(String(value));
  });
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

export function getRecordValue(record, field) {
  if (!record || !field) return undefined;
  if (Object.prototype.hasOwnProperty.call(record, field)) return record[field];
  const wanted = normalizeFieldName(field);
  const matchingKey = Object.keys(record).find((key) => normalizeFieldName(key) === wanted);
  return matchingKey ? record[matchingKey] : undefined;
}

function normalizeFieldName(field) {
  return String(field || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function summarizeValue(value, type) {
  if (!hasActiveValue(value, type)) return '';
  if (type === 'multiSelect') return value.join(' OR ');
  if (type === 'numberRange' || type === 'dateRange') {
    const min = value.min || '−∞';
    const max = value.max || '+∞';
    return `${min}…${max}`;
  }
  if (type === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function normalizeComparable(value) {
  return normalizeText(value);
}

function normalizeText(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', '1', 'y', 'sim'].includes(text)) return true;
  if (['false', 'no', '0', 'n', 'não', 'nao'].includes(text)) return false;
  return null;
}

function inNumberRange(rawValue, range = {}) {
  const number = Number(rawValue);
  if (!Number.isFinite(number)) return false;
  if (range.min !== '' && range.min != null && number < Number(range.min)) return false;
  if (range.max !== '' && range.max != null && number > Number(range.max)) return false;
  return true;
}

function inDateRange(rawValue, range = {}) {
  const time = Date.parse(rawValue);
  if (Number.isNaN(time)) return false;
  if (range.min) {
    const min = Date.parse(range.min);
    if (!Number.isNaN(min) && time < min) return false;
  }
  if (range.max) {
    const max = Date.parse(range.max);
    if (!Number.isNaN(max) && time > max) return false;
  }
  return true;
}
