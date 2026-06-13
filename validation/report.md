# Global Filter Widget Validation Report

## Scope

- Widget repository: `grist-global-filter-widget`.
- Hosted widget URL: `https://jmbenedetto.github.io/grist-global-filter-widget/` verified HTTP 200.
- Grist validation document: `6pe62Baf2XsrxwdAqyVbDD`, created by `scripts/create_dummy_grist_doc.py --confirm` with fake data only.
- Data policy: fake data only.
- Existing Grist document policy: no existing Grist document was touched.

## Evidence inventory

| Evidence | Path/status |
|---|---|
| Dummy Grist document metadata | `validation/dummy-grist-document.json` |
| Grist table metadata | `validation/grist-tables.json` |
| Fake source records | `validation/fake-source-records.json` |
| Validation page configuration | `validation/page-configuration.json` |
| Test cases | `validation/test-cases.md` |
| Screenshots | `validation/screenshots/new-grist-doc-opened.png`, `validation/screenshots/validation-page-smoke.png`, `validation/screenshots/hosted-widget-standalone.png` |
| Video recording | `validation/recordings/global-filter-widget-smoke.webm` |
| Recording metadata | `validation/recordings/metadata.json` |

## Expected validation summary

| Test case | Expected result | Actual result | Screenshot |
|---|---|---|---|
| TC-01 | Empty filter publishes configured row set. | Covered by unit test: empty publishes all. | `filter-core.test.js` |
| TC-02 | Categorical filter works. | Covered by unit test: single-select category. | `filter-core.test.js` |
| TC-03 | Multi-select OR semantics work. | Covered by unit test: multi-select OR. | `filter-core.test.js` |
| TC-04 | Single-select categorical filter works. | Covered by unit test: single-select category. | `filter-core.test.js` |
| TC-05 | Boolean filter works. | Covered by unit test: active boolean with AND. | `filter-core.test.js` |
| TC-06 | Text contains filter is case-insensitive. | Covered by unit test. | `filter-core.test.js` |
| TC-07 | Numeric range filter works. | Covered by unit test. | `filter-core.test.js` |
| TC-08 | Date range filter works. | Covered by unit test. | `filter-core.test.js` |
| TC-09 | Multiple fields combine with AND. | Covered by unit test. | `filter-core.test.js` |
| TC-10 | Individual clear action recomputes selection. | UI implemented in `app.js`; smoke screenshot captured. | `validation/screenshots/hosted-widget-standalone.png` |
| TC-11 | Clear-all restores configured empty-filter behavior. | UI implemented in `app.js`; empty behavior covered by unit tests. | `filter-core.test.js` |
| TC-12 | Linked target widgets respond while unlinked control does not. | Validation page configured with linked sections `8`, `9` and unlinked section `10`; full interaction verification pending manual/recorded Grist UI run. | `validation/page-configuration.json` |
| TC-13 | Unconfigured fields are not exposed. | Configuration-driven rendering only exposes saved `filters`; code and README document this. | `app.js`, `README.md` |

## Notes

Live Grist document creation and validation-page setup were completed only in the new fake-data document. Full Grist interactive test-case execution was partially constrained by browser automation stability inside authenticated Grist; fallback evidence includes API verification, screenshots, local deterministic unit tests, and an agent-browser smoke recording of the hosted widget. Steel Browser was requested by the OpenSpec task list, but Steel CLI was unavailable in this environment; agent-browser recording was used as the safest available fallback.
