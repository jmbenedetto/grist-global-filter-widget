# Grist Global Filter Widget

Static Grist custom widget that acts as a shared filter controller for one selected source table. It reads the selected table, evaluates configured faceted filters, and publishes matching row IDs with `grist.setSelectedRows(...)` so other Grist widgets can follow it through `SELECT BY`.

The runtime UI is intentionally compact: an Option B-style vertical filter strip designed for a narrow Grist widget footprint so the rest of the page remains available for analysis widgets. It has no title, row counter, or in-widget configuration panel; available filter attributes come from fields marked as visible in Grist's standard widget sidebar.

## Hosted URL

After GitHub Pages is enabled for the repository root on the default branch, the widget entry point is:

- `https://jmbenedetto.github.io/grist-global-filter-widget/`

## Files

- `index.html` - Grist custom widget entry point.
- `app.js` - UI, Grist plugin API integration, widget option persistence, and selected-row publishing.
- `filter-core.js` - Pure filtering logic used by the widget and tests.
- `styles.css` - Widget styling.
- `filter-core.test.js` - Node unit tests for filtering semantics.
- `scripts/create_dummy_grist_doc.py` - Creates a new fake-data Grist validation document only; it does not mutate existing documents.

## Grist setup

1. Add a Custom Widget to a Grist page.
2. Set the Custom URL to the hosted widget URL.
3. Set access to `Read table`.
4. Select the source table that should drive shared filtering.
5. Use Grist's standard widget sidebar visible-column checkboxes to mark the source-table fields that should be available as filters.
6. Configure target Grist widgets with `SELECT BY` the global filter widget.

## Layout behavior

- Runtime controls render as one narrow vertical strip with tight filter tags and an empty click zone.
- There is no visible title, row counter, gear button, or dedicated in-widget configuration page.
- Clicking the empty strip opens the list of available fields from Grist's standard visible-column sidebar configuration.
- Clicking a field opens its value editor; the tag is created only after a value is selected or entered.
- Clicking an existing tag reopens the editor and allows changing values or removing that filter attribute.
- When there are many tags, the filter box extends downward instead of truncating controls.
- Help/documentation text is kept in this README instead of occupying dashboard screen real estate.

## Filtering behavior

- Active filters across different fields combine with `AND`.
- Multi-select values inside one field combine with `OR`.
- Text contains matching is case-insensitive and trims leading/trailing whitespace.
- Number range filters include rows inside the active min/max bounds.
- Date range filters parse ISO-like date values and include rows inside the active min/max bounds.
- Empty-filter behavior is configurable.

## Shared/global vs local filters

This custom widget is a shared filter controller: linked widgets respond to the row IDs that it publishes. Native Grist filters remain local to the individual widget where they are applied. The widget does not read, mirror, or synchronize native Grist filter state.

## Field configuration

Only fields marked visible in Grist's standard widget sidebar are exposed in the user-facing filter controls. Fields removed from the visible-column configuration are not displayed. The widget infers compact editors from the shown field values: categorical checklists for low-cardinality text fields, boolean choices, text contains inputs, numeric ranges, and date ranges.

## Validation plan

Use a new dummy Grist document with fake data only. The dummy source table should include:

- Categorical field.
- Text field.
- Boolean field.
- Numeric field.
- Date-like field.

Validation page layout:

- Global filter widget.
- At least two linked target widgets configured with `SELECT BY` the global filter widget.
- At least one comparable unlinked control widget on the same page.

Test cases:

- Categorical single-select and multi-select filtering.
- Text contains filtering with case-insensitive behavior.
- Boolean filtering.
- Numeric range filtering.
- Date range filtering.
- Multiple simultaneous filter attributes.
- Linked widgets update together.
- Unlinked control widget does not change due to global filtering.
- Active filter chips and row counts update after each filter change.

## Local checks

```bash
npm test
```

## Deployment

This repository is intentionally separate from `TCD-widget`. Push to GitHub, then enable GitHub Pages from the default branch root. The static files can be served directly from the repository root.
