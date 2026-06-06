"""Hand-grade a run against the rubric in rubric.md.

Usage:
  python evals/score.py                       # grade the latest run
  python evals/score.py --run 2026-05-26T...  # grade a specific run
  python evals/score.py --ids dtc-retention-cliff  # grade one problem from latest run

Walks every <id>.json in the run, displays the problem + response, prompts you
for each rubric item, writes the scores to evals/scores/<run>.csv.

The rubric items here MUST match rubric.md. When the rubric changes, update both.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

CORPUS_PATH = Path(__file__).parent / "corpus.jsonl"
RUNS_DIR = Path(__file__).parent / "runs"
SCORES_DIR = Path(__file__).parent / "scores"

# Rubric items — keep in sync with rubric.md ! generate_roadmap section.
RUBRIC = [
    {"key": "type_correct", "kind": "binary", "prompt": "1. Type classification correct? (1=yes, 0=no)"},
    {"key": "recap_captures_stakes", "kind": "binary", "prompt": "2. Recap captures the stakes (who, time pressure, non-obvious aspect)? (1=yes, 0=no)"},
    {"key": "nodes_complete", "kind": "binary", "prompt": "3. Nodes complete (no obvious node missing vs ideal_node_titles)? (1=yes, 0=no)"},
    {"key": "nodes_specific", "kind": "scale5", "prompt": "4. Nodes specific to this problem (1=all generic, 5=all reference the user's problem)"},
    {"key": "order_makes_sense", "kind": "scale5", "prompt": "5. Order makes sense (1=random/backwards, 5=clean workflow)"},
    {"key": "notes", "kind": "freetext", "prompt": "6. Observations (free text, blank to skip)"},
]


def load_corpus(path: Path) -> dict[str, dict]:
    items: dict[str, dict] = {}
    with path.open(encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw or raw.startswith("#"):
                continue
            item = json.loads(raw)
            items[item["id"]] = item
    return items


def latest_run() -> Path:
    runs = sorted([p for p in RUNS_DIR.iterdir() if p.is_dir()], reverse=True) if RUNS_DIR.exists() else []
    if not runs:
        raise SystemExit("no runs found in evals/runs/. Run evals/run_corpus.py first.")
    return runs[0]


def display(corpus_item: dict, response: dict) -> None:
    """Print the problem + response in a way that fits a terminal pane."""
    print("=" * 72)
    print(f"ID:               {corpus_item['id']}")
    print(f"DOMAIN:           {corpus_item.get('domain', '—')}")
    print(f"EXPECTED TYPE:    {corpus_item.get('expected_type', '—')}")
    print(f"RETURNED TYPE:    {response.get('problem_type', '—')}")
    print(f"INFERRED TYPE:    {response.get('inferred_problem_type', '—')}")
    print(f"SOURCE:           {response.get('source', '—')}")
    print("-" * 72)
    print("PROBLEM:")
    print(corpus_item["problem"])
    print("-" * 72)
    print("ASSESSMENT TITLE:")
    print(response.get("assessment_title", "—"))
    print()
    print("ASSESSMENT RECAP:")
    print(response.get("assessment_recap", "—"))
    print("-" * 72)
    print("IDEAL NODES (from corpus):")
    print("  " + " · ".join(corpus_item.get("ideal_node_titles", [])))
    print()
    print("RETURNED ROADMAP:")
    for i, node in enumerate(response.get("roadmap", []) or [], start=1):
        title = node.get("title", "—")
        why = (node.get("why") or "").strip()
        print(f"  {i:02d}. {title}")
        if why:
            print(f"      └─ {why[:240]}{'…' if len(why) > 240 else ''}")
    print("-" * 72)
    if corpus_item.get("traps"):
        print("TRAPS TO WATCH FOR:")
        for trap in corpus_item["traps"]:
            print(f"  · {trap}")
        print("-" * 72)
    print()


def prompt_item(item: dict) -> str:
    while True:
        raw = input(f"  {item['prompt']}: ").strip()
        if item["kind"] == "binary":
            if raw in {"0", "1"}:
                return raw
            print("    enter 0 or 1.")
        elif item["kind"] == "scale5":
            if raw in {"1", "2", "3", "4", "5"}:
                return raw
            print("    enter 1, 2, 3, 4, or 5.")
        else:  # freetext
            return raw


def main() -> int:
    parser = argparse.ArgumentParser(description="Hand-grade an eval run against rubric.md")
    parser.add_argument("--run", default=None, help="Run timestamp folder (default: latest)")
    parser.add_argument("--ids", default=None, help="Comma-separated problem ids (default: all)")
    parser.add_argument("--resume", action="store_true",
                        help="Skip problems already scored in the output CSV")
    args = parser.parse_args()

    if args.run:
        run_dir = RUNS_DIR / args.run
        if not run_dir.is_dir():
            raise SystemExit(f"run dir not found: {run_dir}")
    else:
        run_dir = latest_run()
    print(f"grading run: {run_dir.name}\n")

    corpus = load_corpus(CORPUS_PATH)

    # Pick the responses to grade
    if args.ids:
        wanted = [s.strip() for s in args.ids.split(",")]
    else:
        # Grade everything that has both a corpus entry and a response JSON
        wanted = []
        for path in sorted(run_dir.glob("*.json")):
            wanted.append(path.stem)

    SCORES_DIR.mkdir(parents=True, exist_ok=True)
    output = SCORES_DIR / f"{run_dir.name}.csv"
    fieldnames = ["id", "expected_type", "returned_type"] + [it["key"] for it in RUBRIC]

    already: set[str] = set()
    if args.resume and output.exists():
        with output.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                already.add(row["id"])
        print(f"resuming — {len(already)} already scored, skipping those")

    write_header = not output.exists()
    with output.open("a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()

        for pid in wanted:
            if pid in already:
                continue
            corpus_item = corpus.get(pid)
            if not corpus_item:
                print(f"  skip {pid} (not in corpus.jsonl)")
                continue
            response_path = run_dir / f"{pid}.json"
            if not response_path.exists():
                print(f"  skip {pid} (no response in {run_dir.name})")
                continue
            response = json.loads(response_path.read_text(encoding="utf-8"))
            if "error" in response:
                print(f"  skip {pid} (response was an error)")
                continue

            display(corpus_item, response)
            row = {
                "id": pid,
                "expected_type": corpus_item.get("expected_type", ""),
                "returned_type": response.get("problem_type", ""),
            }
            for item in RUBRIC:
                row[item["key"]] = prompt_item(item)
            writer.writerow(row)
            f.flush()
            print()

    # Print aggregate
    print()
    print("=" * 72)
    print(f"scores written to {output}")
    rows = list(csv.DictReader(output.open(encoding="utf-8")))
    if not rows:
        return 0
    type_match = sum(1 for r in rows if r.get("type_correct") == "1")
    recap = sum(1 for r in rows if r.get("recap_captures_stakes") == "1")
    nodes_complete = sum(1 for r in rows if r.get("nodes_complete") == "1")
    specific = [int(r["nodes_specific"]) for r in rows if r.get("nodes_specific", "").isdigit()]
    order = [int(r["order_makes_sense"]) for r in rows if r.get("order_makes_sense", "").isdigit()]
    n = len(rows)
    print(f"  type correct:         {type_match}/{n} ({100 * type_match / n:.0f}%)")
    print(f"  recap captures stakes:{recap}/{n} ({100 * recap / n:.0f}%)")
    print(f"  nodes complete:       {nodes_complete}/{n} ({100 * nodes_complete / n:.0f}%)")
    if specific:
        print(f"  specificity mean:     {sum(specific) / len(specific):.2f}")
    if order:
        print(f"  order mean:           {sum(order) / len(order):.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
