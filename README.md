# Grist Global Filter Widget

Static Grist custom widget that acts as a shared filter controller for one selected source table. It reads the selected table, evaluates configured faceted filters, and publishes matching row IDs with `grist.setSelectedRows(...)` so other Grist widgets can follow it through `SELECT BY`.

The runtime UI is intentionally compact: a horizontal filter bar designed to occupy a small Grist widget footprint so the rest of the page remains available for analysis widgets.

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
5. Open **Configure** inside the widget.
6. Add only the source-table fields that should be exposed.
7. Choose the filter type for each field:
   - Text contains.
   - Single select.
   - Multi select.
   - Boolean.
   - Number range.
   - Date range.
8. Choose empty-filter behavior:
   - Publish all rows.
   - Publish no rows.
9. Save configuration.
10. Configure target Grist widgets with `SELECT BY` the global filter widget.

## Layout behavior

- Runtime controls render as one horizontal bar with row count, inline filters, active chips, clear action, and configuration button.
- The filter strip scrolls horizontally when configured filters exceed the available width.
- The configuration panel opens only when the user clicks the gear button.
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

## Configuration schema

Widget options are stored under the `globalFilterOptions` Grist widget option key:

```json
{
  "version": 1,
  "emptyBehavior": "all",
  "filters": [
    {
      "field": "category",
      "label": "Category",
      "type": "multiSelect",
      "defaultValue": []
    },
    {
      "field": "quantity",
      "label": "Quantity",
      "type": "numberRange",
      "defaultValue": { "min": "", "max": "" }
    }
  ]
}
```

Only configured fields are exposed in the user-facing filter controls. Unconfigured source-table columns are not displayed.

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
