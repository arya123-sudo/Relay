# Relay — Architecture

Relay is a client-side web application with no build step and no server of its own. The only external system it talks to is the GitHub REST API (read-only, public repositories). This is a deliberate Round 2 reliability decision: the demo cannot fail on a cold server, an expired key, or an API quota.

## Data flow

```
Sources ──► Ingestion ──► Evidence store ──► Extraction ──► Knowledge graph
GitHub REST API            (normalized          (rule-based,     (people,
(commits, PRs, issues,      records with         schema-checked)  components,
contributors) or the       source, author,                        work items,
built-in sample project     timestamp, URL)                       decisions, edges)
                                                                      │
        ┌──────────────────┬──────────────────┬─────────────────────┤
        ▼                  ▼                  ▼                     ▼
  Handover report    Completeness       Grounded Q&A         First-week
  (claims labelled   score (pure        (retrieval over      planner
   Verified /         counting over      evidence only;       (priority =
   Inferred /         the graph; no      similarity floor     blockers that
   Unknown, each      model input)       → refusal)           unblock others)
   linked to source)        │
                            ▼
                   Review & approval gate
                   (Draft → reviewer fills gaps,
                    approves → Published)
```

## Components

| File | Responsibility |
|---|---|
| `index.html` | Page structure and layout; loads the modules below |
| `styles.css` | All presentation |
| `js/sample-data.js` | The built-in PayNest sample project: 20 evidence records and the entities derived from them, with a known answer set used by the evaluation |
| `js/engine.js` | The deterministic core: confidence labelling, completeness scoring, gap detection, claim assembly, first-week ranking, Q&A tokenization |
| `js/github.js` | GitHub ingestion: REST fetching, normalization into evidence records, generic extraction (work items, decisions, components, edges) for any public repo |
| `js/app.js` | UI rendering (report, graph, planner, review), grounded Q&A behaviour, review-gate actions, source-trace modal |

## The evidence record

Every source item — a commit, PR, issue, review or document — becomes one record:

```json
{ "id": "e2", "type": "pr", "ref": "PR #42", "author": "arjun-mehta",
  "date": "2026-09-02", "title": "…", "body": "…", "url": "…" }
```

Nothing enters a handover except through a record, so every claim can be traced back in one click. Ingestion is idempotent by source identity: re-running it reuses records instead of duplicating them.

## Hallucination controls (layered, per the Round 1 proposal)

1. **Retrieval grounding** — no source record, no claim. Q&A retrieves only from the evidence store.
2. **Schema-checked extraction** — extraction produces structured entities (work item, decision, component, edge), never free prose presented as fact.
3. **Confidence labels** — Verified requires a directly supporting source; Inferred requires two corroborating sources and shows its reasoning; everything else is Unknown and listed as a gap.
4. **Similarity floor** — below it, Q&A refuses and names the missing evidence instead of answering weakly.
5. **Deterministic scoring** — the completeness score is pure counting over the evidence graph; no model output can inflate it. See `docs/SCORING.md`.
6. **Human approval gate** — a handover stays Draft until a reviewer approves it; reviewer corrections become new evidence records and recompute the score.

## Failure behaviour

- A failed or rate-limited GitHub fetch reports the failure and leaves the sample project available; a partial ingestion still produces a scored handover whose gap list shows what is missing.
- Removing sources (the demo toggle) never edits claims by hand: labels, gaps, score and Q&A behaviour are all recomputed from the surviving evidence, which is why the score falls and answers turn into refusals.

## Round 3 direction

The deterministic engine is the floor, not the ceiling: Round 3 adds a Gemini extraction layer that may only *propose* cited, schema-valid items on top of it (uncited proposals are rejected by code), GitHub App access for private/multi-repo ingestion, document upload, and PostgreSQL + pgvector persistence. See the README's Round 3 section.
