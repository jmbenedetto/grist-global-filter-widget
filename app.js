import {
  DEFAULT_OPTIONS,
  activeFilters,
  deriveFilterDefinitions,
  emptyValueForType,
  filterRecords,
  hasActiveValue,
  normalizeOptions,
  summarizeCompactValue,
  uniqueFieldValues,
} from './filter-core.js';

const state = {
  records: [],
  fields: [],
  options: DEFAULT_OPTIONS,
  filters: {},
  openFieldMenu: false,
  editingField: null,
  publishTimer: null,
};

const el = {
  bar: document.querySelector('#filter-bar'),
  activeChips: document.querySelector('#active-chips'),
  addPlaceholder: document.querySelector('#add-filter-placeholder'),
  fieldMenu: document.querySelector('#field-menu'),
  editor: document.querySelector('#filter-editor'),
};

window.addEventListener('error', (event) => console.error(event.message));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePopovers();
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.popover') && !event.target.closest('#filter-bar')) closePopovers();
});

// The Grist right sidebar is the configuration surface. Users choose which
// columns are shown/mapped there; this widget turns those shown fields into
// available filter attributes. The widget itself has no custom config panel.
grist.ready({
  requiredAccess: 'read table',
  allowSelectBy: true,
});

bindChrome();
render();

grist.onRecords(async (records) => {
  state.records = await resolveRecords(records);
  state.fields = inferColumns(state.records);
  const previousFilters = state.filters;
  state.options = normalizeOptions({
    version: 1,
    emptyBehavior: 'all',
    filters: deriveFilterDefinitions(state.records, state.fields),
  });
  state.filters = Object.fromEntries(state.options.filters.map((filter) => [
    filter.field,
    previousFilters[filter.field] ?? emptyValueForType(filter.type),
  ]));
  render();
  schedulePublish();
});

function bindChrome() {
  el.bar.addEventListener('click', (event) => {
    if (event.target.closest('.filter-chip') || event.target.closest('.filter-chip-remove')) return;
    openFieldMenu();
  });
  el.addPlaceholder.addEventListener('click', (event) => {
    event.stopPropagation();
    openFieldMenu();
  });
}

function render() {
  renderActiveChips();
  renderFieldMenu();
  renderEditor();
  updatePlaceholder();
}

function renderActiveChips() {
  el.activeChips.innerHTML = '';
  for (const filter of activeFilters(state.options, state.filters)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip';
    chip.dataset.field = filter.field;
    chip.innerHTML = `<span class="filter-chip-label">${escapeHtml(filter.label)}: ${escapeHtml(summarizeCompactValue(state.filters[filter.field], filter.type))}</span><span class="filter-chip-remove" aria-hidden="true">×</span>`;
    chip.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest('.filter-chip-remove')) {
        removeFilter(filter.field);
        return;
      }
      openEditor(filter.field);
    });
    el.activeChips.appendChild(chip);
  }
}

function updatePlaceholder() {
  const availableCount = availableFilters().length;
  el.addPlaceholder.hidden = availableCount === 0;
  el.addPlaceholder.textContent = activeFilters(state.options, state.filters).length ? '+ Filter' : 'Click to add filter';
}

function openFieldMenu() {
  state.openFieldMenu = true;
  state.editingField = null;
  render();
}

function closePopovers() {
  state.openFieldMenu = false;
  state.editingField = null;
  render();
}

function renderFieldMenu() {
  el.fieldMenu.hidden = !state.openFieldMenu;
  if (!state.openFieldMenu) return;
  const filters = availableFilters();
  el.fieldMenu.innerHTML = '<div class="popover-title">Add filter</div>';
  if (!filters.length) {
    el.fieldMenu.insertAdjacentHTML('beforeend', '<div class="empty-menu">All shown fields are already filtered.</div>');
    return;
  }
  const list = document.createElement('div');
  list.className = 'menu-list';
  for (const filter of filters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-item';
    button.textContent = filter.label;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openEditor(filter.field);
    });
    list.appendChild(button);
  }
  el.fieldMenu.appendChild(list);
}

function openEditor(field) {
  const filter = getFilter(field);
  if (!filter) return;
  state.openFieldMenu = false;
  state.editingField = field;
  if (state.filters[field] === undefined || state.filters[field] === null) {
    state.filters[field] = emptyValueForType(filter.type);
  }
  render();
}

function renderEditor() {
  el.editor.hidden = !state.editingField;
  if (!state.editingField) return;
  const filter = getFilter(state.editingField);
  if (!filter) {
    el.editor.hidden = true;
    return;
  }

  el.editor.innerHTML = `<div class="popover-title">${escapeHtml(filter.label)}</div>`;
  const fields = document.createElement('div');
  fields.className = 'editor-fields';

  if (filter.type === 'multiSelect' || filter.type === 'singleSelect') {
    fields.appendChild(buildChoiceEditor(filter));
  } else if (filter.type === 'boolean') {
    fields.appendChild(buildBooleanEditor(filter));
  } else if (filter.type === 'numberRange' || filter.type === 'dateRange') {
    fields.appendChild(buildRangeEditor(filter));
  } else {
    fields.appendChild(buildTextEditor(filter));
  }

  el.editor.appendChild(fields);
  el.editor.appendChild(buildEditorActions(filter));
}

function buildChoiceEditor(filter) {
  const list = document.createElement('div');
  list.className = 'value-list';
  const current = filter.type === 'multiSelect'
    ? (Array.isArray(state.filters[filter.field]) ? state.filters[filter.field] : [])
    : [state.filters[filter.field]].filter(Boolean);

  for (const option of uniqueFieldValues(state.records, filter.field)) {
    const label = document.createElement('label');
    label.className = 'value-item';
    const input = document.createElement('input');
    input.type = filter.type === 'multiSelect' ? 'checkbox' : 'radio';
    input.name = `choice-${filter.field}`;
    input.value = option;
    input.checked = current.includes(option);
    input.addEventListener('change', () => {
      if (filter.type === 'multiSelect') {
        const selected = [...list.querySelectorAll('input:checked')].map((node) => node.value);
        state.filters[filter.field] = selected;
      } else {
        state.filters[filter.field] = input.value;
      }
      renderActiveChips();
      updatePlaceholder();
      schedulePublish();
    });
    label.append(input, document.createTextNode(option));
    list.appendChild(label);
  }
  return list;
}

function buildBooleanEditor(filter) {
  const list = document.createElement('div');
  list.className = 'value-list';
  for (const [labelText, value] of [['Yes', true], ['No', false]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'value-item';
    button.textContent = `${state.filters[filter.field] === value ? '✓ ' : ''}${labelText}`;
    button.addEventListener('click', () => {
      state.filters[filter.field] = value;
      render();
      schedulePublish();
    });
    list.appendChild(button);
  }
  return list;
}

function buildRangeEditor(filter) {
  const value = state.filters[filter.field] || { min: '', max: '' };
  const group = document.createElement('div');
  group.className = 'range-fields';
  const inputType = filter.type === 'dateRange' ? 'date' : 'number';
  group.innerHTML = `<input type="${inputType}" data-role="min" placeholder="Min" value="${escapeHtml(value.min || '')}"><input type="${inputType}" data-role="max" placeholder="Max" value="${escapeHtml(value.max || '')}">`;
  group.addEventListener('input', () => {
    state.filters[filter.field] = {
      min: group.querySelector('[data-role="min"]').value,
      max: group.querySelector('[data-role="max"]').value,
    };
    renderActiveChips();
    updatePlaceholder();
    schedulePublish();
  });
  return group;
}

function buildTextEditor(filter) {
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'text-editor-input';
  input.placeholder = 'Contains text';
  input.value = state.filters[filter.field] || '';
  input.addEventListener('input', () => {
    state.filters[filter.field] = input.value;
    renderActiveChips();
    updatePlaceholder();
    schedulePublish();
  });
  setTimeout(() => input.focus(), 0);
  return input;
}

function buildEditorActions(filter) {
  const actions = document.createElement('div');
  actions.className = 'editor-actions';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'editor-action danger';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => removeFilter(filter.field));

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'editor-action secondary';
  close.textContent = 'Close';
  close.addEventListener('click', closePopovers);

  actions.append(remove, close);
  return actions;
}

function removeFilter(field) {
  const filter = getFilter(field);
  if (filter) state.filters[field] = emptyValueForType(filter.type);
  state.editingField = null;
  render();
  schedulePublish();
}

function availableFilters() {
  return state.options.filters.filter((filter) => !hasActiveValue(state.filters[filter.field], filter.type));
}

function getFilter(field) {
  return state.options.filters.find((filter) => filter.field === field);
}

function schedulePublish() {
  clearTimeout(state.publishTimer);
  state.publishTimer = setTimeout(publishSelection, 120);
}

async function publishSelection() {
  const matches = filterRecords(state.records, state.options, state.filters);
  const rowIds = matches.map((record) => record.id).filter((id) => id !== undefined && id !== null);
  await grist.setSelectedRows(rowIds).catch((error) => console.error(`Publish failed: ${error.message}`));
}

async function resolveRecords(records) {
  const initialRows = rowsFromTablePayload(records);
  const selectedRows = await fetchRowsFromSelectedTable();
  if (selectedRows.length) return selectedRows;
  if (initialRows.some((row) => Object.keys(row).some((key) => key !== 'id'))) return initialRows;

  const tableId = new URLSearchParams(window.location.search).get('tableId') || 'Fake_DRP_Filter_Source';
  const docRows = await fetchRowsFromDocApi(tableId);
  return docRows.length ? docRows : initialRows;
}

async function fetchRowsFromSelectedTable() {
  if (!window.grist?.fetchSelectedTable) return [];
  try {
    return rowsFromTablePayload(await window.grist.fetchSelectedTable({ format: 'rows', includeColumns: 'shown' }));
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
