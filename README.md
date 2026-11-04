# Relay — Handover Intelligence

**When someone leaves, the knowledge stays.**

Relay converts scattered project activity into a usable handover when a team member leaves. It reconstructs the project's actual state from evidence — GitHub commits, pull requests, issues, reviews and documents — and produces a handover in which **every important claim links to its source**, every claim is labelled **Verified / Inferred / Unknown**, and the whole handover carries a deterministic **Handover Completeness Score (0–100)**. A human review-and-approval gate sits between generation and publication.

Built by team **Vibe and Theme** (Arya Yaligar — lead, Sanjana, Sanika, Vajresh; Acharya Institute of Technology, Bengaluru) for **WCC Forge 48**. Round 1 proposal → Round 2 working build.

## Live demo

Open `index.html` in any browser (or the hosted link in our Round 2 submission). No build step, no server, no API key.

**10-minute judge demo script**
1. **Connect (0–2 min):** Click *Load sample project — PayNest*. 20 evidence records are ingested; the handover for departing backend lead Arjun Mehta is reconstructed. Or paste any **public GitHub repo URL** and click *Ingest GitHub repo* — Relay pulls commits, PRs, issues and contributors live from the GitHub REST API and detects the departing member (most active contributor).
2. **Read & trace (2–5 min):** The report opens with a completeness score of **91/100** and confidence-labelled claims. Click any source chip (e.g. *PR #42*) to see the exact evidence behind a claim. Note the 4 named gaps — including a decision whose reason was never recorded.
3. **Break it live (5–7 min):** Tick *Demo mode: remove half the sources*. The score falls to **68**, gaps grow from 4 to 10, and asking *"Why did the team switch to Razorpay?"* now gets a **refusal** — the evidence is gone, so Relay will not guess. Untick to restore.
4. **Ask (7–9 min):** Try the preset questions. *"Why was that SMS vendor chosen?"* is refused even with full sources — its reason exists nowhere in the evidence, and Relay says so.
5. **Land the plan (9–10 min):** Open *First-Week Plan* — the successor's first task is the blocked token-service migration, because three other items depend on it. In *Review & Approve*, fill a gap with a note and watch the score rise, then approve to publish.

## Core features (all working end-to-end)

- **Project Knowledge Reconstruction** — GitHub activity (commits, PRs, issues) or the built-in sample project, normalized into citable evidence records with author, date and source link.
- **Decision Memory** — decisions extracted with their reasons; a decision without a recorded reason is labelled and listed as a gap, never embellished.
- **Work Continuity Intelligence** — every work item classified completed / in progress / blocked / pending / unassigned, with owners and evidence.
- **Knowledge Dependency Graph** — people, components, work items and decisions; blocked-by edges highlighted.
- **Knowledge Gap Detector** — undocumented components, unowned work, unevidenced claims, decisions without reasons.
- **Confidence labels** — Verified (directly stated in a cited source), Inferred (corroborated by 2+ sources, reasoning shown), Unknown (no evidence — a named gap).
- **Handover Completeness Score** — deterministic, weighted: work state 25%, decisions 20%, dependencies 20%, ownership & access 15%, documentation 10%, risks & blockers 10%. Computed from evidence coverage only; no AI model can inflate it.
- **Grounded Q&A** — answers only from the evidence store, always cited; refuses when evidence is absent.
- **First-Week Action Planner** — blocked-unblocking work first, then dependency-central work, then quick wins, laid out Monday–Friday.
- **Human review & approval gate** — handover stays Draft until a reviewer approves; reviewers can fill gaps with notes that become new evidence and raise the score.

## Repository structure

```
index.html            page shell — loads the modules below, no build step
styles.css            all presentation
js/sample-data.js     the PayNest sample project (20 evidence records, known answer set)
js/engine.js          deterministic core: confidence labels, completeness score, gaps, planner ranking
js/github.js          GitHub REST ingestion + generic extraction for any public repo
js/app.js             UI: report, graph, Q&A, review gate, source-trace modal
docs/ARCHITECTURE.md  components, data flow, and the layered hallucination controls
docs/SCORING.md       the completeness-score formula, denominators, and a worked example
tests/engine.test.js  headless tests for scoring, gaps, labels, Q&A refusal, planner
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how evidence flows from sources to a published handover, and the six layered controls that keep generated content honest.
- [How scoring works](docs/SCORING.md) — the exact formula and denominators behind the 0–100 score, with the sample project worked through by hand (91 with full sources, 68 with half removed).

## Running the tests

```
npm test        # or: node tests/engine.test.js
```

The suite loads the real browser modules headlessly and asserts: score determinism (91 full / 68 half), gap growth (4 → 10), Verified/Inferred labelling, Q&A answering with evidence, Q&A refusal when evidence is absent or removed, and planner ranking. CI runs it on every push.

## Technology & implementation

Dependency-free web app (vanilla HTML/CSS/JavaScript, modular, no build step) so the demo can never fail on a build, a cold server, or an API quota — a deliberate Round 2 reliability decision. GitHub ingestion uses the public GitHub REST API (read-only, no token). Extraction is **rule-based and deterministic** — the fallback architecture our Round 1 proposal specified (work state derived from issue/PR states; decisions marked Unknown unless cited) — so the system cannot hallucinate: no claim exists without a source record, and the completeness score is pure counting over the evidence graph.

**Changes from the Round 1 plan** (full detail in the updated project PDF): stack simplified from React + FastAPI + Supabase/pgvector + Gemini to a client-side deterministic engine for Round 2 reliability (Gemini's free tier caps current Flash models at tens of requests/day, which a full ingest would exceed); GitHub App auth replaced by public-repo REST ingestion; document upload deferred. The proposal's layered hallucination controls that remain fully in force: retrieval grounding, confidence labels, deterministic scoring, Q&A refusal, and the human approval gate.

## Round 3 improvements (planned, substantial)

1. **LLM extraction layer** — Gemini structured extraction (schema-validated JSON with cited source spans) on top of the deterministic baseline, gated by the proposal's validation-spike targets (≥90% citation coverage, 100% schema validity, decision recall against a known answer set).
2. **Private & multi-repo ingestion with persistence** — GitHub App (repo-scoped, read-only), document upload (PDF/Markdown), PostgreSQL + pgvector storage and semantic retrieval for Q&A across large projects.
3. **Living handovers & successor tracking** — the handover updates on every merge, version diffs are shown, and the first-week plan becomes a tracked checklist whose completion feeds back into the completeness score.

## Testing

Engine verified headlessly (Node): full-source sample scores 91 with 4 named gaps; removing half the sources drops it to 68 with 10 gaps; the Razorpay question answers with a citation under full sources and is refused under reduced sources; the SMS-vendor-reason question is refused under both; planner ranks the blocking migration first; review-gate gap-filling raises the score. GitHub ingestion is exercised against live public repositories.
