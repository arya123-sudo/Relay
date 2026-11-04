# How the Handover Completeness Score works

The score is a **deterministic function of the evidence set**. Same evidence in → same score out, on every run, with no model judgment anywhere in the computation. That is what makes it auditable: anyone can recount it by hand from the report.

## Formula

```
HCS = 0.25·WorkState + 0.20·Decisions + 0.20·Dependencies
    + 0.15·Ownership + 0.10·Documentation + 0.10·Risks
```

Each dimension is a coverage ratio (0–100): items that are **evidenced** divided by items that **should be evidenced**, where "evidenced" means the item carries at least one surviving source record.

| Dimension | Denominator (total) | Numerator (evidenced) |
|---|---|---|
| Work state (25%) | Every work item in scope | Items with ≥1 source record |
| Decisions (20%) | Every extracted decision | Decisions whose **reason** is recorded **and** cited |
| Dependencies (20%) | Every graph edge | Edges with ≥1 source record |
| Ownership & access (15%) | Every work item and component | Items with a named owner |
| Documentation (10%) | Every component | Components with ≥1 documentation record |
| Risks & blockers (10%) | Every blocked or unassigned item | Items surfaced with ≥1 source record |

## Confidence labels (separate from the score)

- **Verified** — a claim directly stated in a cited source record.
- **Inferred** — a claim corroborated by two or more independent sources; the report shows the inference in one line.
- **Unknown** — no evidence found. Unknowns are never filled in; they appear in the gap list and pull the relevant dimension down.

## Worked example — the sample project (PayNest)

Full sources (20 records): work state 100, decisions 80 (one decision — the SMS vendor — has no recorded reason), dependencies 100, ownership 93 (one unassigned work item), documentation 60 (two undocumented components), risks 100 → **HCS 91**.

Remove half the sources (the demo toggle): payment and documentation evidence disappears → work state 70, decisions 60, dependencies 63, documentation 20 → **HCS 68**, and the gap list grows from 4 to 10 named gaps. Nothing was edited by hand; the score is recomputed from the surviving evidence, and Q&A refuses questions whose evidence was removed.

## Why a handover cannot inflate its own score

- The numerator only counts items backed by source records that exist in the store — writing more prose adds nothing.
- A decision without a recorded reason counts in the denominator but never the numerator.
- Reviewer gap-filling raises the score only by adding a real, attributed evidence record (a reviewer note), which is itself shown in the report.
