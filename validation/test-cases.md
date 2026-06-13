# Global Filter Widget Validation Test Cases

## Dummy Grist document

- Source table: `Fake_DRP_Filter_Source`.
- Data policy: fake data only.
- Existing Grist document policy: no existing Grist document is touched.

## Widget configuration for validation

Configured fields only:

- `category` as Multi select, label `Category`.
- `region` as Single select, label `Region`.
- `active` as Boolean, label `Active`.
- `priority_text` as Text contains, label `Priority Text`.
- `stock_cover_days` as Number range, label `Stock Cover Days`.
- `next_review_date` as Date range, label `Next Review Date`.

Unconfigured fields expected not visible:

- `sku`.
- `supplier`.

## Test cases

| ID | Filter action | Expected matching fake rows | Evidence to capture |
|---|---|---:|---|
| TC-01 | Empty filter with behavior `Publish all rows`. | 6 | Widget row count shows `6 / 6 rows`; linked widgets show all fake rows. |
| TC-02 | Category multi-select = `Diagnostic`. | 2 | Active chip says `Category: Diagnostic`; linked targets show FAKE-004 and FAKE-006. |
| TC-03 | Category multi-select = `Contraceptive` OR `Diagnostic`. | 4 | Active chip advertises OR values; linked targets show matching four rows. |
| TC-04 | Region single-select = `South`. | 2 | Active chip says `Region: South`; linked targets show FAKE-001 and FAKE-003. |
| TC-05 | Active boolean = `Yes`. | 4 | Active chip says `Active: Yes`; row count is `4 / 6 rows`. |
| TC-06 | Priority Text contains `priority` using uppercase/lowercase variant. | 3 | Case-insensitive text matching shows FAKE-001, FAKE-004, and FAKE-006. |
| TC-07 | Stock Cover Days range `10..30`. | 3 | Number range includes FAKE-001, FAKE-003, FAKE-006, and excludes 5/45/70. |
| TC-08 | Next Review Date range `2026-06-01..2026-06-30`. | 3 | Date range includes June rows FAKE-001, FAKE-003, FAKE-004. |
| TC-09 | Category = `Diagnostic` AND Active = `Yes` AND Stock Cover Days `1..20`. | 2 | Multiple active chips shown; AND semantics keep FAKE-004 and FAKE-006. |
| TC-10 | Clear one active field from TC-09. | Count recomputes consistently | Individual chip clear recomputes selection. In the fake dataset, clearing `Stock Cover Days` from TC-09 leaves `Category=Diagnostic AND Active=Yes`, which still matches FAKE-004 and FAKE-006 (`2 / 6 rows`). |
| TC-11 | Clear all. | 6 or 0 according to configured empty behavior | Clear-all restores configured empty-filter behavior. |
| TC-12 | Compare linked target widgets and unlinked control widget. | Linked targets change, unlinked control remains unchanged | Screenshot shows selective application. |
| TC-13 | Configuration exposure check. | Only configured fields visible | Screenshot shows `sku` and `supplier` are not exposed as filter controls. |

## Required screenshot set

- One screenshot per test case after the filter has been applied.
- Screenshots must show the custom widget controls, active filter chips, row count, linked target widgets, and the unlinked control widget when relevant.

## Required recording

- One Steel Browser recording walking through TC-01 through TC-13 in order.
- Save recording and metadata under `validation/recordings/`.
- Steel CLI `0.4.4` has no `steel browser record` command; use Steel automatic HLS recording export and convert to MP4 with `ffmpeg`.
