#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pygrister",
#   "requests",
# ]
# ///
"""Configure a validation page in the new fake-data Grist document only."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from pygrister.api import GristApi

TEAM_SITE = "dkt"
SOURCE_TABLE = "Fake_DRP_Filter_Source"
PAGE_NAME = "Global Filter Widget Validation"
WIDGET_URL = "https://jmbenedetto.github.io/grist-global-filter-widget/"
SHOWN_FIELDS = ["sku", "category", "region", "active", "stock_cover_days", "next_review_date"]


def read_secret(field_path: str) -> str:
    result = subprocess.run(["op", "read", field_path], capture_output=True, text=True, check=True)
    return result.stdout.strip()


def configure_env() -> str:
    api_key = os.environ.get("GRIST_API_KEY", "").strip() or read_secret("op://ai_agents_jmb/Grist DKT/grist_api_key")
    os.environ["GRIST_API_KEY"] = api_key
    os.environ.setdefault("GRIST_TEAM_SITE", TEAM_SITE)
    return api_key


def api_request(method: str, doc_id: str, path: str, api_key: str, payload: dict[str, Any] | None = None) -> Any:
    response = requests.request(
        method,
        f"https://{TEAM_SITE}.getgrist.com/api/docs/{doc_id}{path}",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return response.json() if response.content else None


def encode_widget_options(url: str) -> str:
    custom_view = {
        "mode": "url",
        "url": url,
        "access": "read table",
        "pluginId": "",
        "sectionId": "",
        "renderAfterReady": False,
        "widgetId": None,
        "widgetOptions": None,
        "columnsMapping": {},
    }
    return json.dumps(
        {
            "customView": json.dumps(custom_view, ensure_ascii=False, separators=(",", ":")),
            "numFrozen": 0,
            "verticalGridlines": True,
            "horizontalGridlines": True,
            "zebraStripes": False,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    )


def make_layout(section_ids: list[int]) -> str:
    # Two columns: controller on top, linked widgets/control below.
    children = [{"leaf": section_ids[0]}, {"children": [{"leaf": sid} for sid in section_ids[1:]]}]
    return json.dumps({"children": children}, separators=(",", ":"))


def fetch_metadata(grist: GristApi, doc_id: str) -> dict[str, list[dict[str, Any]]]:
    queries = {
        "tables": "select id, tableId from _grist_Tables order by id",
        "views": "select id, name, type from _grist_Views order by id",
        "pages": "select id, viewRef, pagePos from _grist_Pages order by pagePos",
        "sections": "select id, title, tableRef, parentId, parentKey, linkSrcSectionRef from _grist_Views_section order by id",
    }
    out: dict[str, list[dict[str, Any]]] = {}
    for key, sql in queries.items():
        status, rows = grist.run_sql(sql, doc_id=doc_id)
        if status >= 300:
            raise RuntimeError(f"metadata query failed {key}: {status} {rows}")
        out[key] = rows
    return out


def table_ref(metadata: dict[str, list[dict[str, Any]]]) -> int:
    table = next(row for row in metadata["tables"] if row["tableId"] == SOURCE_TABLE)
    return int(table["id"])


def col_refs(grist: GristApi, doc_id: str) -> dict[str, int]:
    status, cols = grist.list_cols(SOURCE_TABLE, doc_id=doc_id)
    if status >= 300:
        raise RuntimeError(f"list_cols failed: {status} {cols}")
    refs = {col["id"]: int(col["fields"]["colRef"]) for col in cols if col.get("id")}
    missing = [field for field in SHOWN_FIELDS if field not in refs]
    if missing:
        raise RuntimeError(f"missing fields for page sections: {missing}")
    return refs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--evidence", default="validation/page-configuration.json")
    parser.add_argument("--confirm", action="store_true")
    args = parser.parse_args()

    evidence_path = Path(args.evidence)
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, Any] = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "doc_id": args.doc_id,
        "page_name": PAGE_NAME,
        "widget_url": WIDGET_URL,
        "confirmed": args.confirm,
        "policy": "Mutates only the newly-created fake-data validation document.",
    }

    api_key = configure_env()
    grist = GristApi(config={"GRIST_TEAM_SITE": TEAM_SITE})
    metadata = fetch_metadata(grist, args.doc_id)
    if any(row.get("name") == PAGE_NAME for row in metadata["views"]):
        evidence["status"] = "already_exists"
        evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        print(json.dumps(evidence, indent=2))
        return 0

    source_table_ref = table_ref(metadata)
    refs = col_refs(grist, args.doc_id)
    if not args.confirm:
        evidence["dry_run"] = True
        evidence["source_table_ref"] = source_table_ref
        evidence["shown_fields"] = SHOWN_FIELDS
        evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        print(json.dumps(evidence, indent=2))
        return 0

    next_page_pos = max(float(row.get("pagePos") or 0) for row in metadata["pages"]) + 1
    view_response = api_request("POST", args.doc_id, "/tables/_grist_Views/records", api_key, {
        "records": [{"fields": {"name": PAGE_NAME, "type": "empty"}}]
    })
    view_id = int(view_response["records"][0]["id"])
    page_response = api_request("POST", args.doc_id, "/tables/_grist_Pages/records", api_key, {
        "records": [{"fields": {"viewRef": view_id, "pagePos": next_page_pos, "indentation": 0, "shareRef": 0}}]
    })
    page_id = int(page_response["records"][0]["id"])

    section_specs = [
        {"title": "Global Filter Controller", "parentKey": "custom", "options": encode_widget_options(WIDGET_URL), "linked": False},
        {"title": "Linked Table Target", "parentKey": "record", "linked": True},
        {"title": "Linked Card Target", "parentKey": "single", "linked": True},
        {"title": "Unlinked Table Control", "parentKey": "record", "linked": False},
    ]
    created_sections: dict[str, int] = {}
    section_ids: list[int] = []
    for spec in section_specs:
        fields: dict[str, Any] = {
            "tableRef": source_table_ref,
            "parentId": view_id,
            "parentKey": spec["parentKey"],
            "title": spec["title"],
        }
        if spec.get("options"):
            fields["options"] = spec["options"]
        response = api_request("POST", args.doc_id, "/tables/_grist_Views_section/records", api_key, {
            "records": [{"fields": fields}]
        })
        section_id = int(response["records"][0]["id"])
        created_sections[spec["title"]] = section_id
        section_ids.append(section_id)
        field_records = [
            {"fields": {"parentId": section_id, "colRef": refs[field], "parentPos": pos}}
            for pos, field in enumerate(SHOWN_FIELDS, start=1)
        ]
        if field_records:
            api_request("POST", args.doc_id, "/tables/_grist_Views_section_field/records", api_key, {"records": field_records})

    controller_id = created_sections["Global Filter Controller"]
    link_updates = [
        {"id": created_sections["Linked Table Target"], "fields": {"linkSrcSectionRef": controller_id, "linkSrcColRef": 0, "linkTargetColRef": 0}},
        {"id": created_sections["Linked Card Target"], "fields": {"linkSrcSectionRef": controller_id, "linkSrcColRef": 0, "linkTargetColRef": 0}},
    ]
    api_request("PATCH", args.doc_id, "/tables/_grist_Views_section/records", api_key, {"records": link_updates})
    api_request("PATCH", args.doc_id, "/tables/_grist_Views/records", api_key, {
        "records": [{"id": view_id, "fields": {"type": "empty", "layoutSpec": make_layout(section_ids)}}]
    })

    evidence.update({
        "dry_run": False,
        "view_id": view_id,
        "page_id": page_id,
        "source_table_ref": source_table_ref,
        "sections": created_sections,
        "linked_sections": ["Linked Table Target", "Linked Card Target"],
        "unlinked_sections": ["Unlinked Table Control"],
        "shown_fields": SHOWN_FIELDS,
    })
    evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(json.dumps(evidence, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
