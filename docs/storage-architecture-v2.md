# Storage Architecture Proposal — v2 Multi-User

**Status:** draft for review
**Author:** Euphie (drafted in collaboration with Claude)
**Date:** 2026-05-26
**Scope:** Storage layer for v2 (multi-user OAuth, team plans, reviewable artifacts) and forward-compatibility with v3 (warehouse connectors).

---

## TL;DR

- **Stack:** Postgres + JSONB hybrid, single database, row-level tenancy by `team_id`.
- **Stop using flat JSON files** for the source of truth as soon as we hit v2. Files are fine for v1.x; they break at multi-user.
- **Introduce a storage-abstraction layer in v1.x** so the v2 cutover is a swap, not a rewrite.
- **Four load-bearing decisions to get right on day one:** UUIDs everywhere, `team_id` on every domain row, `created_by` + `updated_at` everywhere, soft-delete via `deleted_at`.
- **Outsource OAuth** to a managed provider (Clerk / Auth0 / Supabase Auth) rather than self-host. Auth is where small teams burn weeks.

---

## 1. Background

Strenaysis is a guided coaching SPA for data scientists. Users walk a 4-step flow: Question → Roadmap → Per-node Q&A → Review/export. The roadmap is a graph of "nodes" (Metric, Drivers, Data, etc.); each node generates coaching questions, the user answers them with a response-type tag (Confirmed / Assumption / Hypothesis), and the system suggests action items for a workplan.

### Roadmap context

| Version | State | Storage model |
|---|---|---|
| v0 | Static prototype, hand-authored example. **Done.** | None — embedded in the marketing site. |
| v1 | Real LLM wiring, single-user demo with basic auth and .docx export. **Building.** | Flat JSON files: `saved_problem_structures/{date}_{slug}.json`. One passcode gates the whole instance. |
| v2 | Multi-user, shared problems, comments on answers, review mode for leads. **Next.** | This document. |
| v3 | Read-only connectors to dbt, BigQuery, Snowflake, Looker. Data node pulls real warehouse metadata. **Later.** | Adds warehouse-connection tables; otherwise built on top of v2. |

---

## 2. What's wrong with the current storage

The v1 file-based model is fine for a single-user demo. It breaks in four specific ways as soon as v2 lands:

1. **No identity.** The passcode is shared across whoever has it. There's no way to attribute an answer to a user, scope a framing to a team, or distinguish a reviewer from an author.
2. **No concurrency.** Two reviewers commenting on the same answer would race-write the JSON file. Filesystem locks are the wrong primitive.
3. **No cross-cutting queries.** The Actions view ("every action item across all my team's framings where I'm the owner") requires opening every file and parsing every blob. Doesn't scale past low hundreds of framings.
4. **No referential integrity.** A comment is supposed to attach to a specific answer. With JSON blobs, there's no stable answer ID — the data lives inside an array at a known index, and that index drifts as the framing gets edited.

None of these break v1. All of them break v2.

---

## 3. Proposed architecture

### Stack

**Postgres + JSONB hybrid, single database, row-level tenancy by `team_id`.**

| Choice | Rationale |
|---|---|
| Postgres | Boring on purpose. Row-level tenancy is well-supported; transactions matter once multiple users edit concurrently; FTS via `tsvector` scales to millions of rows; foreign keys keep referential integrity sane. |
| **Mostly normalized** structure (problems, nodes, questions, answers, actions, comments) | The Actions view and review mode need cross-cutting queries. "All open actions across my team's framings where I'm the owner" should be one indexed query, not "parse 200 JSON files." |
| **JSONB for loose-shape fields** (`assessment_recap`, `extracted_context`, warehouse `cached_metadata`) | Query when you need to, blob when you don't. |
| Skip Mongo / Firestore / DynamoDB | No reason for them; every reason against (vendor lock-in, weaker transactions, harder analytical queries). |
| Skip SQLite for prod | Fine for tests, bad for concurrent web traffic. |

### Auth

**Outsource OAuth to a managed provider** — Clerk, Auth0, or Supabase Auth. All three handle Google/Microsoft SSO + team management. Costs $25–50/month at our scale and saves weeks of work that's easy to get wrong.

Treat the OAuth provider as the **identity issuer only**. Our `users` and `memberships` tables are the **source of truth** for who-can-do-what. Don't try to use OAuth groups directly for authorization — too brittle.

---

## 4. Schema sketch

```sql
-- ──────────────────────────────────────────────────────────────────
-- Identity layer
-- ──────────────────────────────────────────────────────────────────

users (
  id            uuid pk,
  email         text unique not null,
  oauth_provider text,           -- 'google' | 'microsoft' | 'github'
  oauth_sub     text,            -- subject claim from provider
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now()
)

teams (
  id            uuid pk,
  slug          text unique,
  name          text not null,
  plan          text default 'free',   -- 'free' | 'pro' | 'team'
  created_at    timestamptz default now(),
  created_by    uuid references users(id)
)

memberships (
  team_id       uuid references teams(id) on delete cascade,
  user_id       uuid references users(id) on delete cascade,
  role          text not null,         -- 'owner' | 'admin' | 'member' | 'viewer'
  joined_at     timestamptz default now(),
  PRIMARY KEY (team_id, user_id)
)

-- ──────────────────────────────────────────────────────────────────
-- Domain layer (every row carries team_id)
-- ──────────────────────────────────────────────────────────────────

problems (
  id              uuid pk,
  team_id         uuid not null references teams(id),
  created_by      uuid not null references users(id),
  problem_text    text not null,
  problem_details text,
  problem_type           text,    -- 'descriptive_analysis' | 'predictive_modeling' | ...
  inferred_problem_type  text,    -- the system's original suggestion, pinned
  assessment_title text,
  assessment_recap text,
  status          text default 'draft',  -- 'draft' | 'in_progress' | 'complete' | 'archived'
  visibility      text default 'team',   -- 'team' | 'private'
  search_vector   tsvector,              -- FTS index
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  last_touched_at timestamptz default now(),
  deleted_at      timestamptz             -- soft delete
)
CREATE INDEX problems_team_idx ON problems(team_id) WHERE deleted_at IS NULL;
CREATE INDEX problems_search_idx ON problems USING GIN(search_vector);

nodes (
  id            uuid pk,
  problem_id    uuid not null references problems(id) on delete cascade,
  position      int not null,
  title         text not null,
  description   text,
  breakdown     text,
  is_custom     bool default false,
  status        text default 'open',     -- 'open' | 'in_progress' | 'settled'
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)
CREATE INDEX nodes_problem_idx ON nodes(problem_id, position);

questions (
  id            uuid pk,
  node_id       uuid not null references nodes(id) on delete cascade,
  position      int not null,
  text          text not null,
  llm_generated bool default true,
  created_at    timestamptz default now()
)
CREATE INDEX questions_node_idx ON questions(node_id, position);

answers (
  id            uuid pk,
  question_id   uuid not null references questions(id) on delete cascade,
  author_id     uuid not null references users(id),
  text          text not null,
  response_type text not null,           -- 'confirmed' | 'assumption' | 'hypothesis'
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)
CREATE UNIQUE INDEX answers_question_unique ON answers(question_id);
-- ^ one current answer per question; edit overwrites. History via events log if needed.

followups (
  id            uuid pk,
  answer_id     uuid not null references answers(id) on delete cascade,
  text          text not null,
  source        text default 'llm',      -- 'llm' | 'manual'
  created_at    timestamptz default now()
)

actions (
  id              uuid pk,
  node_id         uuid not null references nodes(id) on delete cascade,
  problem_id      uuid not null references problems(id),   -- denormed for Actions view perf
  from_question_id uuid references questions(id),
  action_text     text not null,
  owner           text,
  collaborator    text,
  source          text,
  artifact        text,
  approval        text,
  blockers        text,
  status          text default 'open',   -- 'open' | 'in_progress' | 'blocked' | 'done'
  position        int,
  created_by      uuid references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  completed_at    timestamptz
)
CREATE INDEX actions_problem_idx ON actions(problem_id);
CREATE INDEX actions_status_idx ON actions(status) WHERE status != 'done';

-- ──────────────────────────────────────────────────────────────────
-- v2 collaboration layer
-- ──────────────────────────────────────────────────────────────────

comments (
  id            uuid pk,
  team_id       uuid not null references teams(id),
  parent_type   text not null,       -- 'answer' | 'action'
  parent_id     uuid not null,       -- polymorphic ref
  author_id     uuid not null references users(id),
  body          text not null,
  created_at    timestamptz default now()
)
CREATE INDEX comments_parent_idx ON comments(parent_type, parent_id);

reviews (
  id            uuid pk,
  problem_id    uuid not null references problems(id),
  reviewer_id   uuid not null references users(id),
  status        text default 'pending', -- 'pending' | 'approved' | 'changes_requested'
  notes         text,
  created_at    timestamptz default now(),
  decided_at    timestamptz
)

-- Optional, defer to v2.5 unless needed earlier:
events (
  id            uuid pk,
  team_id       uuid not null references teams(id),
  actor_id      uuid references users(id),
  entity_type   text not null,       -- 'problem' | 'answer' | 'action' | ...
  entity_id     uuid not null,
  verb          text not null,       -- 'created' | 'updated' | 'commented' | 'reviewed'
  diff          jsonb,
  created_at    timestamptz default now()
)

-- ──────────────────────────────────────────────────────────────────
-- v3 warehouse layer
-- ──────────────────────────────────────────────────────────────────

warehouse_connections (
  id            uuid pk,
  team_id       uuid not null references teams(id),
  type          text not null,       -- 'dbt' | 'bigquery' | 'snowflake' | 'looker'
  credentials_encrypted jsonb,       -- pgcrypto or KMS-backed
  metadata_last_synced_at timestamptz
)

node_data_sources (                  -- ties a Data node to real warehouse refs
  id            uuid pk,
  node_id       uuid references nodes(id) on delete cascade,
  connection_id uuid references warehouse_connections(id),
  source_ref    text,                -- e.g. 'warehouse.events.exposures'
  cached_metadata jsonb,
  cached_at     timestamptz
)
```

### Notes on schema choices

- **`team_id` denormalized to `actions`.** The Actions view's hottest query is "every action item across all my team's framings where status != done." Denorming `team_id` onto `actions` removes a join.
- **`answers` is unique-per-question.** Edits overwrite. Audit trail lives in `events`, not in answer history rows — keeps the answers table clean.
- **Polymorphic `comments.parent_id`.** A comment attaches to either an answer or an action. Polymorphism is simpler than two separate tables. The (`parent_type`, `parent_id`) composite index keeps lookups fast.
- **`search_vector` on problems only.** Library search is "find a framing." Action search can be a `LIKE` for now; revisit when there are 10k+ actions.
- **Soft-delete via `deleted_at`.** All read queries default to `WHERE deleted_at IS NULL`. Hard-delete only on user purge for compliance.

---

## 5. Authorization model

Three layers, all enforced server-side:

### Layer 1: Tenant isolation

Every domain row has `team_id`. Every query scopes:

```sql
WHERE team_id IN (SELECT team_id FROM memberships WHERE user_id = :current_user)
```

Start with **app-layer scoping** (a query helper that injects the filter). Postgres Row-Level Security (RLS) is the stronger version — defer until you actually need it because it interacts oddly with connection pools.

### Layer 2: Per-row visibility

`problems.visibility = 'private'` adds an extra clause:

```sql
AND (visibility = 'team' OR created_by = :current_user)
```

This lets a team member draft something messy without it showing up in the team's Library until they're ready.

### Layer 3: Role gates (app-layer, not DB)

| Role | Can |
|---|---|
| Viewer | Read everything in their team |
| Member | + Create/edit their own framings, comment on others' |
| Admin | + Edit anyone's framings, submit reviews |
| Owner | + Manage team membership, billing |

---

## 6. Migration path

### Step A — before v2 (do in v1.x)

**Introduce a storage abstraction layer**, even while still backed by flat files.

Create a `ProblemStore` class with methods like:

```python
class ProblemStore:
    def list_problems(self, team_id: str) -> list[ProblemSummary]: ...
    def get_problem(self, problem_id: str) -> Problem: ...
    def save_problem(self, problem: Problem) -> str: ...
    def upsert_action(self, action_id: str, fields: dict) -> Action: ...
    def list_actions(self, team_id: str, filter: ActionFilter) -> list[Action]: ...
```

The HTTP handlers in `server.py` call the store. The store (in v1.x) talks to files. In v2, swap the store implementation for a Postgres-backed one.

**Cost:** ~half a day. **Saves:** the v2 cutover becomes a swap, not a rewrite.

### Step B — v2 cutover

1. Stand up Postgres. Render's managed Postgres is the cheapest path; Supabase if you want the bundled auth + storage.
2. Switch backend from `http.server` to **FastAPI** (or Flask) for Alembic/SQLAlchemy ergonomics.
3. Run Alembic migrations to create the schema above.
4. Swap the FS-backed `ProblemStore` for a Postgres-backed one.
5. **Run a one-time migration script**: read every `saved_problem_structures/*.json`, parse, write into the new tables. Create a single seed team for the existing user. Mint UUIDs from the start.
6. Wire OAuth (Clerk/Auth0/Supabase Auth).
7. Add `team_id` scope to every query path. Add the visibility check.
8. Build the comments + reviews UI (sibling work; not really a storage problem).

### Step C — v3 layer (later)

1. Add `warehouse_connections` + `node_data_sources` tables.
2. Encrypt credentials. Use `pgcrypto` for the simplest path; KMS-backed if SOC 2 becomes a requirement.
3. Background workers (a cron in Render, or a queue if it gets serious) sync warehouse metadata on a schedule.
4. The Data node UI in Step 3 pulls from `node_data_sources` instead of asking the LLM.

---

## 7. Decisions to make

Calling these out explicitly because they're the ones that look small but compound:

| Topic | My recommendation | Why it could go differently |
|---|---|---|
| **One DB vs per-team DBs** | One DB, `team_id` column | Per-team DBs become necessary for some enterprise compliance regimes (HIPAA-ish). Defer until a customer actually asks. |
| **Storage abstraction in v1.x** | Yes, do it now | Skipping makes the v2 cutover 4× more painful. Cheap to do now. |
| **Self-host OAuth vs Clerk/Auth0** | Use a managed provider | Auth is where small teams burn weeks. Outsourcing saves that forever. |
| **Encrypt warehouse creds: pgcrypto vs KMS** | pgcrypto for v3 demo, KMS later | Sufficient for v3; revisit when SOC 2 is on the table. |
| **JSONB vs full normalization** | Hybrid (as described) | LLM-generated narrative doesn't reward normalization. Structured Q&A does. |
| **Audit log (`events` table)** | Build in v2.5, not v2 | Useful for "what changed since I reviewed this," but overhead until comments + reviews are actually being used. |
| **Search engine** | Postgres FTS with `tsvector` | Don't reach for Elasticsearch / Algolia until FTS proves insufficient. It won't at v2 scale. |
| **API style** | REST with nested resources | GraphQL would reduce frontend over-fetch, but adds tooling complexity for one consumer. Not worth it yet. |

---

## 8. The four "get it right on day one" rules

These compound. The cost of changing them later is 5–10× the cost of doing them right now:

1. **UUIDs from day one for everything.** Even if v1 internals use composite IDs, treat them as ephemeral. The v2 migration mints UUIDs and never looks back.
2. **`team_id` on every domain row** in the first Postgres migration. Even if there's only one team in the data initially. Retrofitting tenancy is brutal.
3. **`created_by` + `updated_at` on every row.** You'll want them forever — for activity feeds, review threads, "who changed this?" lookups.
4. **Soft-delete with `deleted_at` columns.** Once teams collaborate, accidental deletes are existential. Hard-delete only on explicit user purge.

Everything else (exact role names, whether `actions.status` has 3 or 4 values, comments threading model) can be revised without pain. Get these four right and you can iterate freely.

---

## 9. Open questions for the team

- **OAuth provider choice.** Clerk, Auth0, Supabase Auth, or self-host? Each has trade-offs around pricing model, lock-in, and UI customization.
- **Hosting platform for Postgres.** Render's managed Postgres is the path of least resistance from the current deploy. Supabase bundles auth + storage if we go that route for OAuth too. Neon is a third option if we want serverless Postgres.
- **Is v2 the right moment to swap `http.server` for FastAPI/Flask?** I think yes — Alembic migrations and SQLAlchemy patterns are much more pleasant inside a real framework. But it's a meaningful refactor.
- **Should we support multiple teams per user from day one?** Schema supports it (`memberships` is a many-to-many). UX implications: a team-switcher in the sidebar. Probably yes, even if 90% of users have one team.
- **Per-action history.** Do we need to show "Euphie changed status from open → done at 3pm"? If yes, the `events` log moves from v2.5 to v2.

---

## 10. Suggested next steps

1. **Right now (v1.x):** land the `ProblemStore` abstraction. This is the only piece that has to happen before v2 work starts. Half a day of work; pays for itself the first day of v2.
2. **Decision: pick the OAuth provider.** Affects everything else. Recommend Clerk or Supabase Auth.
3. **Decision: hosting platform.** Render Postgres vs Supabase. Probably worth a 30-minute spike on each.
4. **Spec the migration script.** Read JSON files → write rows. Worth writing in parallel with the schema migrations so we know the mapping works on real data.
5. **Sketch the v2 UI changes** for comments + reviews. These are the user-visible reasons for the storage change.

Once 1–3 are decided, the rest is straightforward engineering work. Happy to break it down into smaller PR-sized chunks once we agree on direction.
