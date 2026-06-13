#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pygrister",
# ]
# ///
"""Create a new fake-data Grist validation document for this widget.

Safety rules:
- Creates a new document only.
- Does not read or mutate existing documents.
- Requires --confirm for any write.
- Uses fake validation records only.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from pygrister.api import GristApi

RECORDS = [
    {
        "sku": "FAKE-001",
        "category": "Contraceptive",
        "region": "South",
        "supplier": "Atlas Demo Supply",
        "priority_text": "Priority replenishment for stable demand",
        "active": True,
        "stock_cover_days": 12,
        "next_review_date": "2026-06-15",
    },
    {
        "sku": "FAKE-002",
        "category": "Contraceptive",
        "region": "North",
        "supplier": "Beacon Demo Supply",
        "priority_text": "Backlog review and pending approval",
        "active": False,
        "stock_cover_days": 45,
        "next_review_date": "2026-07-01",
    },
    {
        "sku": "FAKE-003",
        "category": "Health Kit",
        "region": "South",
        "supplier": "Atlas Demo Supply",
        "priority_text": "Routine replenishment candidate",
        "active": True,
        "stock_cover_days": 25,
        "next_review_date": "2026-06-22",
    },
    {
        "sku": "FAKE-004",
        "category": "Diagnostic",
        "region": "East",
        "supplier": "Cascade Demo Supply",
        "priority_text": "Priority exception with low coverage",
        "active": True,
        "stock_cover_days": 5,
        "next_review_date": "2026-06-05",
    },
    {
        "sku": "FAKE-005",
        "category": "Health Kit",
        "region": "West",
        "supplier": "Beacon Demo Supply",
        "priority_text": "Seasonal promotion stock review",
        "active": False,
        "stock_cover_days": 70,
        "next_review_date": "2026-08-10",
    },
    {
        "sku": "FAKE-006",
        "category": "Diagnostic",
        "region": "North",
        "supplier": "Cascade Demo Supply",
        "priority_text": "Priority launch replenishment",
        "active": True,
        "stock_cover_days": 18,
        "next_review_date": "2026-07-15",
    },
]

TABLES = [
    {
        "id": "Fake_DRP_Filter_Source",
        "columns": [
            {"id": "sku", "fields": {"label": "SKU", "type": "Text"}},
            {"id": "category", "fields": {"label": "Category", "type": "Text"}},
            {"id": "region", "fields": {"label": "Region", "type": "Text"}},
            {"id": "supplier", "fields": {"label": "Supplier", "type": "Text"}},
            {"id": "priority_text", "fields": {"label": "Priority Text", "type": "Text"}},
            {"id": "active", "fields": {"label": "Active", "type": "Bool"}},
            {"id": "stock_cover_days", "fields": {"label": "Stock Cover Days", "type": "Numeric"}},
            {"id": "next_review_date", "fields": {"label": "Next Review Date", "type": "Date"}},
        ],
    }
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace-id", type=int, default=int(os.environ.get("GRIST_WORKSPACE_ID", "208684")))
    parser.add_argument("--name", default=f"Global Filter Widget Validation {datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}")
    parser.add_argument("--evidence", default="validation/dummy-grist-document.json")
    parser.add_argument("--confirm", action="store_true", help="Actually create the new Grist document.")
    args = parser.parse_args()

    evidence_path = Path(args.evidence)
    evidence_path.parent.mkdir(parents=True, exist_ok=True)

    evidence = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "workspace_id": args.workspace_id,
        "document_name": args.name,
        "source_table": "Fake_DRP_Filter_Source",
        "fake_record_count": len(RECORDS),
        "confirmed": args.confirm,
        "doc_id": None,
        "table_ids": [],
        "record_ids": [],
        "note": "Creates a new fake-data validation document only; does not mutate existing documents.",
    }

    if not args.confirm:
        evidence["dry_run"] = True
        evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        print(json.dumps(evidence, indent=2))
        return 0

    grist = GristApi(config={"GRIST_WORKSPACE_ID": str(args.workspace_id)})
    grist.apicaller.request_options = {"timeout": 30}
    grist.open_session()
    try:
        status, doc_id = grist.add_doc(args.name, pinned=False, ws_id=args.workspace_id)
        if status >= 300:
            raise RuntimeError(f"add_doc failed: {status} {doc_id}")
        evidence["doc_id"] = doc_id

        status, table_ids = grist.add_tables(TABLES, doc_id=doc_id)
        if status >= 300:
            raise RuntimeError(f"add_tables failed: {status} {table_ids}")
        evidence["table_ids"] = table_ids

        status, record_ids = grist.add_records("Fake_DRP_Filter_Source", RECORDS, doc_id=doc_id)
        if status >= 300:
            raise RuntimeError(f"add_records failed: {status} {record_ids}")
        evidence["record_ids"] = record_ids

        status, rows = grist.list_records("Fake_DRP_Filter_Source", doc_id=doc_id)
        if status >= 300:
            raise RuntimeError(f"verification list_records failed: {status} {rows}")
        evidence["verified_record_count"] = len(rows)
        evidence["dry_run"] = False
    finally:
        grist.close_session()

    evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(json.dumps(evidence, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
