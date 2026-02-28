#!/usr/bin/env python3
import os
import re
import json
import requests
from typing import Dict, Any, List

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID") or os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "")
WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY") or os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY", "")
EMAIL = os.getenv("FIREBASE_EMAIL", "")
PASSWORD = os.getenv("FIREBASE_PASSWORD", "")


def summarize_extractive(text: str, sentence_count: int = 3) -> str:
    clean = re.sub(r"\s+", " ", (text or "")).strip()
    if not clean:
        return ""

    # Python re: variable-width lookbehind 미지원 -> 단순 문장 경계 분리
    sentences = [s.strip() for s in re.split(r"[.!?。！？]+\s+", clean) if s.strip()]
    if len(sentences) <= sentence_count:
        return " ".join(sentences)

    tokens = [
        t for t in re.sub(r"[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]", " ", clean.lower()).split()
        if len(t) > 1
    ]
    freq: Dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1

    scored = []
    for idx, s in enumerate(sentences):
        words = [
            w for w in re.sub(r"[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]", " ", s.lower()).split()
            if len(w) > 1
        ]
        score = sum(freq.get(w, 0) for w in words) / max(1, len(words))
        scored.append((idx, s, score))

    top = sorted(scored, key=lambda x: x[2], reverse=True)[:sentence_count]
    top_sorted = sorted(top, key=lambda x: x[0])
    return " ".join(s for _, s, _ in top_sorted)


def to_firestore_value(v: Any) -> Dict[str, Any]:
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if v is None:
        return {"nullValue": None}
    return {"stringValue": str(v)}


def sign_in() -> str:
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={WEB_API_KEY}"
    res = requests.post(url, json={"email": EMAIL, "password": PASSWORD, "returnSecureToken": True}, timeout=20)
    res.raise_for_status()
    return res.json()["idToken"]


def list_posts(id_token: str) -> List[Dict[str, Any]]:
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/posts?pageSize=200"
    res = requests.get(url, headers={"Authorization": f"Bearer {id_token}"}, timeout=30)
    res.raise_for_status()
    return res.json().get("documents", [])


def fs_string(fields: Dict[str, Any], key: str) -> str:
    v = fields.get(key, {})
    return v.get("stringValue", "")


def fs_timestamp(fields: Dict[str, Any], key: str) -> str:
    v = fields.get(key, {})
    return v.get("timestampValue", "")


def patch_summary(id_token: str, doc_name: str, short: str, long_: str):
    url = f"https://firestore.googleapis.com/v1/{doc_name}"
    params = [
        ("updateMask.fieldPaths", "summaryShort"),
        ("updateMask.fieldPaths", "summaryLong"),
        ("updateMask.fieldPaths", "summaryUpdatedAt"),
    ]
    payload = {
        "fields": {
            "summaryShort": to_firestore_value(short),
            "summaryLong": to_firestore_value(long_),
            "summaryUpdatedAt": {"timestampValue": __import__("datetime").datetime.utcnow().isoformat() + "Z"},
        }
    }
    res = requests.patch(url, params=params, headers={"Authorization": f"Bearer {id_token}"}, json=payload, timeout=30)
    res.raise_for_status()


def should_update(fields: Dict[str, Any]) -> bool:
    content = fs_string(fields, "content")
    if not content.strip():
        return False
    updated = fs_timestamp(fields, "updatedAt")
    summarized = fs_timestamp(fields, "summaryUpdatedAt")
    if not fs_string(fields, "summaryShort") or not fs_string(fields, "summaryLong"):
        return True
    if updated and summarized and updated > summarized:
        return True
    return False


def main():
    missing = [k for k, v in {
        "FIREBASE_PROJECT_ID": PROJECT_ID,
        "FIREBASE_WEB_API_KEY": WEB_API_KEY,
        "FIREBASE_EMAIL": EMAIL,
        "FIREBASE_PASSWORD": PASSWORD,
    }.items() if not v]
    if missing:
        print("[summary] missing env:", ", ".join(missing))
        return

    id_token = sign_in()
    docs = list_posts(id_token)

    updated_count = 0
    for d in docs:
        fields = d.get("fields", {})
        if not should_update(fields):
            continue
        content = fs_string(fields, "content")
        short = summarize_extractive(content, 3)
        long_ = summarize_extractive(content, 7)
        patch_summary(id_token, d.get("name"), short, long_)
        updated_count += 1

    print(f"[summary] processed={len(docs)}, updated={updated_count}")


if __name__ == "__main__":
    main()
