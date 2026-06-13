# Global Filter Widget Validation Report

## Scope

- Widget repository: `grist-global-filter-widget`.
- Hosted widget URL: pending GitHub Pages publication.
- Grist validation document: pending creation with `scripts/create_dummy_grist_doc.py --confirm`.
- Data policy: fake data only.
- Existing Grist document policy: no existing Grist document was touched.

## Evidence inventory

| Evidence | Path/status |
|---|---|
| Dummy Grist document metadata | `validation/dummy-grist-document.json` pending confirmed run |
| Test cases | `validation/test-cases.md` |
| Screenshots | `validation/screenshots/` pending browser execution |
| Steel Browser recording | `validation/recordings/` pending browser execution |

## Expected validation summary

| Test case | Expected result | Actual result | Screenshot |
|---|---|---|---|
| TC-01 | Empty filter publishes configured row set. | Pending | Pending |
| TC-02 | Categorical filter works. | Pending | Pending |
| TC-03 | Multi-select OR semantics work. | Pending | Pending |
| TC-04 | Single-select categorical filter works. | Pending | Pending |
| TC-05 | Boolean filter works. | Pending | Pending |
| TC-06 | Text contains filter is case-insensitive. | Pending | Pending |
| TC-07 | Numeric range filter works. | Pending | Pending |
| TC-08 | Date range filter works. | Pending | Pending |
| TC-09 | Multiple fields combine with AND. | Pending | Pending |
| TC-10 | Individual clear action recomputes selection. | Pending | Pending |
| TC-11 | Clear-all restores configured empty-filter behavior. | Pending | Pending |
| TC-12 | Linked target widgets respond while unlinked control does not. | Pending | Pending |
| TC-13 | Unconfigured fields are not exposed. | Pending | Pending |

## Notes

This report is initialized before live browser validation. Fill the `Actual result` and `Screenshot` columns after the new dummy Grist document page is configured and tested.
