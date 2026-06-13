# Global Filter Widget Validation Report

## Scope

- Widget repository: `grist-global-filter-widget`.
- Hosted widget URL: `https://jmbenedetto.github.io/grist-global-filter-widget/`.
- Grist validation document: `6pe62Baf2XsrxwdAqyVbDD`, created by `scripts/create_dummy_grist_doc.py --confirm` with fake data only.
- Validation page: `Global Filter Widget Validation`, `/p/3`.
- Data policy: fake data only.
- Existing Grist document policy: no existing Grist document was touched.

## Final result

- Status: **PASS**.
- Steel session id: `a3e28e71-70f8-4efc-93e8-36bd854de9c4`.
- Machine-readable validation result: `validation/steel-validation-results.json`.
- Result summary: `overall_pass=true`, `13` executed test cases.
- Unit tests: `npm test` passed `10/10`.

## Evidence inventory

| Evidence | Path/status |
|---|---|
| Dummy Grist document metadata | `validation/dummy-grist-document.json` |
| Grist table metadata | `validation/grist-tables.json` |
| Fake source records | `validation/fake-source-records.json` |
| Validation page configuration | `validation/page-configuration.json` |
| Test cases | `validation/test-cases.md` |
| Machine-readable Steel validation results | `validation/steel-validation-results.json` |
| Steel Browser MP4 recording | `validation/recordings/steel-global-filter-validation-final.mp4` |
| Recording metadata | `validation/recordings/metadata.json` |
| Recording ffprobe | `validation/recordings/steel-global-filter-validation-final.ffprobe.json` |
| TC screenshots | `validation/screenshots/steel-tc-01-retry.png` through `validation/screenshots/steel-tc-13-retry.png` |

## Recording notes

- Steel CLI version tested: `0.4.4`.
- Steel CLI does **not** expose `steel browser record`.
- Recording was exported from Steel's automatic session recording endpoint `/v1/sessions/{session_id}/hls` using the `steel-api-key` header, then converted to MP4 with `ffmpeg`.
- Final MP4 duration: `147.5s`.
- Final MP4 size: `17,748,118` bytes.

## Test case results

| Test case | Expected result | Actual result | Evidence |
|---|---|---|---|
| TC-01 | Empty filter publishes all rows. | PASS: `6 / 6 rows`, no active chips. | `validation/screenshots/steel-tc-01-retry.png` |
| TC-02 | Category multi-select = `Diagnostic`. | PASS: `2 / 6 rows`, chip `Category: Diagnostic`. | `validation/screenshots/steel-tc-02-retry.png` |
| TC-03 | Category multi-select = `Contraceptive` OR `Diagnostic`. | PASS: `4 / 6 rows`, chip `Category: Contraceptive OR Diagnostic`. | `validation/screenshots/steel-tc-03-retry.png` |
| TC-04 | Region single-select = `South`. | PASS: `2 / 6 rows`, chip `Region: South`. | `validation/screenshots/steel-tc-04-retry.png` |
| TC-05 | Active boolean = `Yes`. | PASS: `4 / 6 rows`, chip `Active: Yes`. | `validation/screenshots/steel-tc-05-retry.png` |
| TC-06 | Priority text contains uppercase `PRIORITY`. | PASS: `3 / 6 rows`, case-insensitive matching. | `validation/screenshots/steel-tc-06-retry.png` |
| TC-07 | Stock cover days range `10..30`. | PASS: `3 / 6 rows`, matching fake rows FAKE-001, FAKE-003, FAKE-006. | `validation/screenshots/steel-tc-07-retry.png` |
| TC-08 | Next review date range `2026-06-01..2026-06-30`. | PASS: `3 / 6 rows`. | `validation/screenshots/steel-tc-08-retry.png` |
| TC-09 | Category `Diagnostic` AND Active `Yes` AND Stock Cover Days `1..20`. | PASS: `2 / 6 rows`, multiple chips shown. | `validation/screenshots/steel-tc-09-retry.png` |
| TC-10 | Clear one active field from TC-09. | PASS: cleared `Stock Cover Days`; row count recomputed to `2 / 6 rows`, consistent with remaining `Diagnostic AND Active` filters. | `validation/screenshots/steel-tc-10-retry.png` |
| TC-11 | Clear all. | PASS: restored `6 / 6 rows`, no active chips. | `validation/screenshots/steel-tc-11-retry.png` |
| TC-12 | Linked widgets change while unlinked control remains unchanged. | PASS: linked table/card show South rows FAKE-001 and FAKE-003; unlinked control still shows all fake rows. | `validation/screenshots/steel-tc-12-retry.png` |
| TC-13 | Only configured fields are exposed. | PASS: filter fields are `category`, `region`, `active`, `priority_text`, `stock_cover_days`, `next_review_date`; `sku` and `supplier` absent. | `validation/screenshots/steel-tc-13-retry.png` |

## Notes

- The earlier smoke recording was insufficient because it did not show linked widget behavior. The final Steel run fixes that gap.
- TC-07 expectation was corrected from `4` to `3` rows because the fake dataset has exactly three records in the `10..30` range.
- TC-10 wording was corrected because the fake dataset does not make the count increase after clearing the stock range from TC-09; it does prove chip removal and recomputation.
