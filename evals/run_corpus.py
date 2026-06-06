"""Run the eval corpus through the Strenaysis /api/roadmap endpoint.

Usage:
  python evals/run_corpus.py --passcode <CODE>
  python evals/run_corpus.py --passcode <CODE> --base-url http://localhost:8765
  python evals/run_corpus.py --passcode <CODE> --limit 3       # smoke test
  python evals/run_corpus.py --passcode <CODE> --ids dtc-retention-cliff,trial-retention-predict

The backend must be running with an OPENAI_API_KEY set (otherwise every problem
falls back to the deterministic template path and the eval measures the fallback,
not the LLM).

Output:
  evals/runs/<UTC-ISO>/manifest.csv      one row per problem with shape data
  evals/runs/<UTC-ISO>/<id>.json         full /api/roadmap response per problem
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

CORPUS_PATH = Path(__file__).parent / "corpus.jsonl"
RUNS_DIR = Path(__file__).parent / "runs"


def utc_stamp() -> str:
    """ISO-ish timestamp that's safe in a filename."""
    return dt.datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%SZ")


def load_corpus(path: Path) -> list[dict]:
    items: list[dict] = []
    with path.open(encoding="utf-8") as f:
        for line_no, raw in enumerate(f, start=1):
            raw = raw.strip()
            if not raw or raw.startswith("#"):
                continue
            try:
                items.append(json.loads(raw))
            except json.JSONDecodeError as exc:
                print(f"corpus.jsonl line {line_no}: {exc}", file=sys.stderr)
                sys.exit(1)
    return items


def filter_corpus(items: list[dict], limit: int | None, ids: list[str] | None) -> list[dict]:
    if ids:
        wanted = set(ids)
        items = [item for item in items if item["id"] in wanted]
        missing = wanted - {item["id"] for item in items}
        if missing:
            print(f"warning: unknown ids in --ids: {sorted(missing)}", file=sys.stderr)
    if limit is not None:
        items = items[:limit]
    return items


def unlock(base_url: str, passcode: str) -> str:
    """POST /unlock and return the access cookie value."""
    body = urllib.parse.urlencode({"passcode": passcode}).encode("utf-8")
    req = urllib.request.Request(
        base_url.rstrip("/") + "/unlock",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            cookie_header = resp.getheader("Set-Cookie", "")
    except urllib.error.HTTPError as exc:
        # 303 redirect on success is success; urllib raises on 3xx without follow
        if exc.code in (302, 303):
            cookie_header = exc.headers.get("Set-Cookie", "")
        else:
            raise SystemExit(f"unlock failed: HTTP {exc.code} — bad passcode?")
    if "strenaysis_access=" not in cookie_header:
        raise SystemExit("unlock did not return an access cookie — wrong passcode?")
    # Cookie header looks like "strenaysis_access=ABC; Path=/; HttpOnly; SameSite=Lax"
    value = cookie_header.split(";", 1)[0]
    return value  # e.g. "strenaysis_access=ABC"


def call_roadmap(base_url: str, cookie: str, problem: str, problem_details: str = "", problem_type: str = "") -> dict:
    body = json.dumps({
        "problem": problem,
        "problem_details": problem_details,
        "problem_type": problem_type,
    }).encode("utf-8")
    req = urllib.request.Request(
        base_url.rstrip("/") + "/api/roadmap",
        data=body,
        headers={"Content-Type": "application/json", "Cookie": cookie},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def summarize_row(corpus_item: dict, response: dict) -> dict:
    nodes = response.get("roadmap", []) or []
    return {
        "id": corpus_item["id"],
        "expected_type": corpus_item.get("expected_type", ""),
        "returned_type": response.get("problem_type", ""),
        "type_match": "1" if response.get("problem_type") == corpus_item.get("expected_type") else "0",
        "source": response.get("source", ""),
        "node_count": len(nodes),
        "node_titles": " | ".join(str(n.get("title", "")) for n in nodes),
        "assessment_title": response.get("assessment_title", ""),
        "recap_length": len(response.get("assessment_recap", "") or ""),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the eval corpus against /api/roadmap")
    parser.add_argument("--base-url", default="http://localhost:8765",
                        help="Strenaysis base URL (default: http://localhost:8765)")
    parser.add_argument("--passcode", required=True, help="ACCESS_CODE for the unlock gate")
    parser.add_argument("--limit", type=int, default=None,
                        help="Run only the first N problems (smoke test)")
    parser.add_argument("--ids", default=None,
                        help="Comma-separated problem ids to run (overrides --limit)")
    args = parser.parse_args()

    corpus = load_corpus(CORPUS_PATH)
    ids_list = [s.strip() for s in args.ids.split(",")] if args.ids else None
    corpus = filter_corpus(corpus, args.limit, ids_list)
    if not corpus:
        print("no problems to run after filters", file=sys.stderr)
        return 1

    stamp = utc_stamp()
    run_dir = RUNS_DIR / stamp
    run_dir.mkdir(parents=True, exist_ok=True)

    print(f"unlocking {args.base_url}…")
    cookie = unlock(args.base_url, args.passcode)
    print(f"unlocked. writing runs to {run_dir}\n")

    rows = []
    for i, item in enumerate(corpus, start=1):
        print(f"[{i}/{len(corpus)}] {item['id']}  …", flush=True)
        try:
            response = call_roadmap(args.base_url, cookie, item["problem"])
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            response = {"error": str(exc)}
        (run_dir / f"{item['id']}.json").write_text(
            json.dumps(response, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if "error" not in response:
            row = summarize_row(item, response)
            rows.append(row)
            tick = "✓" if row["type_match"] == "1" else "✗"
            print(f"  {tick} {row['returned_type']} (expected {row['expected_type']}) · {row['node_count']} nodes · source={row['source']}")
        else:
            rows.append({
                "id": item["id"], "expected_type": item.get("expected_type", ""),
                "returned_type": "ERROR", "type_match": "0", "source": "",
                "node_count": 0, "node_titles": "", "assessment_title": "",
                "recap_length": 0,
            })

    manifest = run_dir / "manifest.csv"
    fieldnames = list(rows[0].keys()) if rows else []
    with manifest.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nwrote {manifest}")

    if rows:
        type_match = sum(1 for r in rows if r["type_match"] == "1")
        print(f"\ntype_match: {type_match}/{len(rows)} ({100 * type_match / len(rows):.0f}%)")
        sources = {r["source"] for r in rows}
        if sources == {"fallback"}:
            print("\n⚠️  every response came from the fallback path — set OPENAI_API_KEY on the backend.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
