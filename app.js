import {
  DEFAULT_OPTIONS,
  FILTER_TYPES,
  activeFilters,
  buildInitialState,
  filterRecords,
  hasActiveValue,
  normalizeOptions,
  summarizeValue,
  uniqueFieldValues,
} from './filter-core.js';

const state = {
  records: [],
  columns: [],
  options: DEFAULT_OPTIONS,
  filters: {},
  publishTimer: null,
};

const el = {
  status: document.querySelector('#status-pill'),
  configPanel: document.querySelector('#config-panel'),
  configFields: document.querySelector('#config-fields'),
  emptyBehavior: document.querySelector('#empty-behavior'),
  filterList: document.querySelector('#filter-list'),
  activeChips: document.querySelector('#active-chips'),
  rowCount: document.querySelector('#row-count'),
  clearAll: document.querySelector('#clear-all'),
  addFilter: document.querySelector('#add-filter'),
  saveConfig: document.querySelector('#save-config'),
  openConfig: document.querySelector('#open-config'),
  closeConfig: document.querySelector('#close-config'),
  configTemplate: document.querySelector('#config-row-template'),
};

window.addEventListener('error', (event) => setStatus(`Error: ${event.message}`, 'error'));

// Read-table access lets the widget inspect the selected source table. allowSelectBy
// advertises that this custom widget can be used as a SELECT BY source by other widgets.
grist.ready({ requiredAccess: 'read table', allowSelectBy: true });

await loadOptions();
bindChrome();
setStatus('Waiting for table…');

grist.onRecords(async (records) => {
  state.records = await resolveRecords(records);
  state.columns = inferColumns(state.records);
  render();
  schedulePublish();
});

async function loadOptions() {
  const saved = await grist.getOption('globalFilterOptions').catch(() => null);
  state.options = normalizeOptions(saved || DEFAULT_OPTIONS);
  state.filters = buildInitialState(state.options);
}

async function saveOptions() {
  const options = normalizeOptions(readConfigForm());
  await grist.setOption('globalFilterOptions', options);
  state.options = options;
  state.filters = buildInitialState(options);
  render();
  schedulePublish();
}

function bindChrome() {
  el.openConfig.addEventListener('click', () => {
    renderConfigForm();
    el.configPanel.hidden = false;
  });
  el.closeConfig.addEventListener('click', () => { el.configPanel.hidden = true; });
  el.addFilter.addEventListener('click', () => addConfigRow());
  el.saveConfig.addEventListener('click', async () => {
    await saveOptions();
    el.configPanel.hidden = true;
  });
  el.emptyBehavior.addEventListener('change', () => schedulePublish());
  el.clearAll.addEventListener('click', () => {
    state.filters = Object.fromEntries(state.options.filters.map((filter) => [filter.field, null]));
    render();
    schedulePublish();
  });
}

function render() {
  renderFilterControls();
  renderActiveChips();
  publishPreview();
}

function renderFilterControls() {
  el.filterList.innerHTML = '';
  if (state.options.filters.length === 0) {
    el.filterList.innerHTML = '<div class="empty-state">Configure fields to start filtering this table.</div>';
    setStatus('Not configured', 'warn');
    return;
  }

  for (const filter of state.options.filters) {
    const wrapper = document.createElement('article');
    wrapper.className = 'filter-card';
    wrapper.dataset.field = filter.field;
    wrapper.innerHTML = `<div class="filter-card-header"><h3>${escapeHtml(filter.label)}</h3><button class="link-button" type="button">Clear</button></div>`;
    const body = document.createElement('div');
    body.className = 'filter-control';
    body.appendChild(buildControl(filter));
    wrapper.appendChild(body);
    wrapper.querySelector('button').addEventListener('click', () => {
      state.filters[filter.field] = null;
      render();
      schedulePublish();
    });
    el.filterList.appendChild(wrapper);
  }
}

function buildControl(filter) {
  const value = state.filters[filter.field];
  if (filter.type === 'singleSelect' || filter.type === 'multiSelect') {
    const select = document.createElement('select');
    select.multiple = filter.type === 'multiSelect';
    if (!select.multiple) select.appendChild(new Option('Any', ''));
    for (const option of uniqueFieldValues(state.records, filter.field)) {
      select.appendChild(new Option(option, option));
    }
    if (select.multiple && Array.isArray(value)) {
      [...select.options].forEach((option) => { option.selected = value.includes(option.value); });
    } else if (value) {
      select.value = value;
    }
    select.addEventListener('change', () => {
      state.filters[filter.field] = select.multiple ? [...select.selectedOptions].map((option) => option.value) : (select.value || null);
      renderActiveChips();
      schedulePublish();
    });
    return select;
  }

  if (filter.type === 'boolean') {
    const select = document.createElement('select');
    select.append(new Option('Any', ''), new Option('Yes', 'true'), new Option('No', 'false'));
    select.value = typeof value === 'boolean' ? String(value) : '';
    select.addEventListener('change', () => {
      state.filters[filter.field] = select.value === '' ? null : select.value === 'true';
      renderActiveChips();
      schedulePublish();
    });
    return select;
  }

  if (filter.type === 'numberRange' || filter.type === 'dateRange') {
    const range = value || { min: '', max: '' };
    const group = document.createElement('div');
    group.className = 'range-control';
    const inputType = filter.type === 'dateRange' ? 'date' : 'number';
    group.innerHTML = `<input type="${inputType}" placeholder="Min" value="${escapeHtml(range.min || '')}"><input type="${inputType}" placeholder="Max" value="${escapeHtml(range.max || '')}">`;
    const [min, max] = group.querySelectorAll('input');
    const update = () => {
      state.filters[filter.field] = { min: min.value, max: max.value };
      renderActiveChips();
      schedulePublish();
    };
    min.addEventListener('input', update);
    max.addEventListener('input', update);
    return group;
  }

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Contains text (case-insensitive)';
  input.value = value || '';
  input.addEventListener('input', () => {
    state.filters[filter.field] = input.value;
    renderActiveChips();
    schedulePublish();
  });
  return input;
}

function renderActiveChips() {
  const active = activeFilters(state.options, state.filters);
  el.clearAll.disabled = active.length === 0;
  el.activeChips.innerHTML = '';
  el.activeChips.classList.toggle('empty', active.length === 0);
  if (active.length === 0) {
    el.activeChips.textContent = 'No active filters';
    return;
  }

  for (const filter of active) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = `${filter.label}: ${summarizeValue(state.filters[filter.field], filter.type)} ×`;
    chip.addEventListener('click', () => {
      state.filters[filter.field] = null;
      render();
      schedulePublish();
    });
    el.activeChips.appendChild(chip);
  }
}

function publishPreview() {
  const matches = filterRecords(state.records, state.options, state.filters);
  el.rowCount.textContent = `${matches.length} / ${state.records.length} rows`;
  setStatus(state.options.filters.length ? 'Ready' : 'Not configured', state.options.filters.length ? 'ok' : 'warn');
}

function schedulePublish() {
  clearTimeout(state.publishTimer);
  state.publishTimer = setTimeout(publishSelection, 150);
}

async function publishSelection() {
  const matches = filterRecords(state.records, state.options, state.filters);
  const rowIds = matches.map((record) => record.id).filter((id) => id !== undefined && id !== null);
  el.rowCount.textContent = `${matches.length} / ${state.records.length} rows`;
  await grist.setSelectedRows(rowIds).catch((error) => setStatus(`Publish failed: ${error.message}`, 'error'));
}

function renderConfigForm() {
  el.configFields.innerHTML = '';
  el.emptyBehavior.value = state.options.emptyBehavior;
  state.options.filters.forEach((filter) => addConfigRow(filter));
}

function addConfigRow(filter = {}) {
  const node = el.configTemplate.content.firstElementChild.cloneNode(true);
  const fieldSelect = node.querySelector('[data-role="field"]');
  fieldSelect.appendChild(new Option('Select field…', ''));
  for (const column of state.columns) fieldSelect.appendChild(new Option(column, column));
  fieldSelect.value = filter.field || '';
  node.querySelector('[data-role="label"]').value = filter.label || filter.field || '';
  node.querySelector('[data-role="type"]').value = FILTER_TYPES.includes(filter.type) ? filter.type : 'text';
  node.querySelector('[data-role="default"]').value = serializeDefault(filter.defaultValue);
  node.querySelector('[data-role="remove"]').addEventListener('click', () => node.remove());
  fieldSelect.addEventListener('change', () => {
    const label = node.querySelector('[data-role="label"]');
    if (!label.value) label.value = fieldSelect.value;
  });
  el.configFields.appendChild(node);
}

function readConfigForm() {
  return {
    version: 1,
    emptyBehavior: el.emptyBehavior.value === 'none' ? 'none' : 'all',
    filters: [...el.configFields.querySelectorAll('.config-row')].map((row) => ({
      field: row.querySelector('[data-role="field"]').value,
      label: row.querySelector('[data-role="label"]').value,
      type: row.querySelector('[data-role="type"]').value,
      defaultValue: row.querySelector('[data-role="default"]').value,
    })),
  };
}

async function resolveRecords(records) {
  const initialRows = rowsFromTablePayload(records);
  if (initialRows.some((row) => Object.keys(row).some((key) => key !== 'id'))) {
    return initialRows;
  }

  const selectedRows = await fetchRowsFromSelectedTable();
  if (selectedRows.length) return selectedRows;

  const tableId = new URLSearchParams(window.location.search).get('tableId') || 'Fake_DRP_Filter_Source';
  const docRows = await fetchRowsFromDocApi(tableId);
  return docRows.length ? docRows : initialRows;
}

async function fetchRowsFromSelectedTable() {
  if (!window.grist?.fetchSelectedTable) return [];
  try {
    return rowsFromTablePayload(await window.grist.fetchSelectedTable({ format: 'rows' }));
  } catch (error) {
    console.warn('fetchSelectedTable failed', error);
    return [];
  }
}

async function fetchRowsFromDocApi(tableId) {
  const docApi = window.grist?.docApi || window.grist?.raw?.docApi || null;
  if (!docApi?.fetchTable || !tableId) return [];
  try {
    return rowsFromTablePayload(await docApi.fetchTable(tableId));
  } catch (error) {
    console.warn('docApi.fetchTable failed', error);
    return [];
  }
}

function rowsFromTablePayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeRecord);
  if (Array.isArray(payload.records)) return payload.records.map(normalizeRecord);
  if (payload.tableData && typeof payload.tableData === 'object') return rowsFromColumnarTable(payload.tableData);
  if (typeof payload === 'object') {
    const firstValue = Object.values(payload)[0];
    if (Array.isArray(firstValue)) return rowsFromColumnarTable(payload);
  }
  return [];
}

function normalizeRecord(record) {
  return record?.fields ? { id: record.id, ...record.fields } : (record || {});
}

function rowsFromColumnarTable(tableData) {
  const columns = Object.keys(tableData || {});
  if (!columns.length) return [];
  const rowCount = Math.max(...columns.map((column) => Array.isArray(tableData[column]) ? tableData[column].length : 0));
  return Array.from({ length: rowCount }, (_, index) => {
    const row = {};
    for (const column of columns) row[column] = tableData[column]?.[index];
    return row;
  });
}

function inferColumns(records) {
  const fields = new Set();
  records.forEach((record) => Object.keys(record || {}).forEach((key) => {
    if (key !== 'id') fields.add(key);
  }));
  return [...fields].sort();
}

function setStatus(message, tone = 'ok') {
  el.status.textContent = message;
  el.status.dataset.tone = tone;
}

function serializeDefault(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return [value.min, value.max].filter(Boolean).join('..');
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
