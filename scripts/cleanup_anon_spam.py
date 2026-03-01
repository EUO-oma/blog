#!/usr/bin/env python3
"""
Periodic anon board spam cleaner.

Rules (default):
1) Same author posts >=5 within 10 minutes -> mark newest overflow as spam.
2) Same normalized content repeated >=3 overall -> mark repeats as spam.

Requires env:
- FIREBASE_PROJECT_ID
- FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON)
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import firebase_admin
from firebase_admin import credentials, firestore

COL = "anon_posts"


def normalize_text(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^\w\s가-힣]", "", s)
    return s


def init_db():
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not raw:
        raise RuntimeError("Missing FIREBASE_SERVICE_ACCOUNT_JSON")
    info = json.loads(raw)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(info))
    return firestore.client()


def to_dt(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
    try:
        return v.to_datetime().replace(tzinfo=timezone.utc)
    except Exception:
        return None


def main():
    db = init_db()
    docs = list(db.collection(COL).stream())
    rows = []
    for d in docs:
        data = d.to_dict() or {}
        rows.append({
            "id": d.id,
            "ref": d.reference,
            "authorKey": str(data.get("authorKey", "")),
            "content": str(data.get("content", "")),
            "createdAt": to_dt(data.get("createdAt")) or datetime.now(timezone.utc),
            "spamStatus": data.get("spamStatus"),
        })

    # already-marked 제외
    clean_rows = [r for r in rows if r.get("spamStatus") != "spam"]

    spam_ids = set()
    reasons = {}

    # Rule 1: burst posting by same author
    by_author = defaultdict(list)
    for r in clean_rows:
        by_author[r["authorKey"]].append(r)

    for author, arr in by_author.items():
        arr.sort(key=lambda x: x["createdAt"])
        for i, cur in enumerate(arr):
            win_start = cur["createdAt"] - timedelta(minutes=10)
            in_window = [x for x in arr if win_start <= x["createdAt"] <= cur["createdAt"]]
            if len(in_window) >= 5:
                # keep first 4, mark overflow as spam
                overflow = in_window[4:]
                for x in overflow:
                    spam_ids.add(x["id"])
                    reasons[x["id"]] = "burst_posting"

    # Rule 2: duplicated content globally
    by_norm = defaultdict(list)
    for r in clean_rows:
        n = normalize_text(r["content"])
        if n:
            by_norm[n].append(r)

    for _, arr in by_norm.items():
        if len(arr) >= 3:
            arr.sort(key=lambda x: x["createdAt"])
            for x in arr[2:]:
                spam_ids.add(x["id"])
                reasons.setdefault(x["id"], "duplicate_content")

    # apply updates
    updated = 0
    now = datetime.now(timezone.utc)
    for r in rows:
        if r["id"] in spam_ids:
            r["ref"].set(
                {
                    "spamStatus": "spam",
                    "spamReason": reasons.get(r["id"], "rule_match"),
                    "spamReviewedAt": now,
                },
                merge=True,
            )
            updated += 1

    print(f"anon_spam_cleanup done | total={len(rows)} marked={updated}")


if __name__ == "__main__":
    main()
