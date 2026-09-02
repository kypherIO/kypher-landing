# CoreTrust Lead Generation Engine

One AI-augmented lead generation motion for CoreTrust logistics: one Excel
workbook holds every member scored 0-100 by Fit v3, a Copilot Studio agent
reads it to rank the day, research accounts, draft email, and log touches,
and everything runs locally out of a single OneDrive-synced file plus a
handful of Python scripts for the parts Copilot Studio can't (or shouldn't)
do by itself. No new platform to buy to start -- this runs today on
Microsoft 365 you already have.

If you only read one thing: `docs/CoreTrust_LeadGen_MASTER_Handoff.md`. It
has the business case, the full data model, and the six-flow spec this repo
implements. This README is the "how do I actually run it" companion.

## What's in this folder

```
data/
  CoreTrust_Master_Members.xlsx        The one file everything runs from.
                                        Tabs: MASTER MEMBERS, TOUCHPOINTS,
                                        CADENCE, KPI DASHBOARD, SUMMARY,
                                        READ ME, Data Dictionary.
  CoreTrust_SFDC_Import_Leads_sample.csv   Sample Data Import Wizard export.
  source/                              Pipeline inputs (SFDC-scored master +
                                        the verified-contact / freight-
                                        analysis file). Drop fresh exports
                                        here and re-run the pipeline.
scripts/
  fitv3_engine.py            Fit v3 scoring functions. The math (30/30/15/
                              15/10 weights, tiers) lives here and nowhere
                              else -- never re-derive it inline.
  fitv3_pipeline.py          Merges the SFDC master with verified-contact /
                              freight data, backfills Actionability, Warmth,
                              Priority, Service_Fit, and writes the final
                              workbook with real named Excel Tables.
  log_touch.py                Log one touch (email/call/LinkedIn) against a
                              Lead_ID from the command line -- what the Log
                              Touch Copilot Studio flow does, usable offline.
  weekly_kpi_snapshot.py      Append this week's demand-gen numbers to the
                              KPI DASHBOARD history log. Run weekly.
  requirements.txt            pandas + openpyxl.
agent/
  CoreTrust_LeadGen_Agent_Instructions_v3.md   Paste into Copilot Studio's
                                                 Instructions field.
  CoreTrust_Enrichment_Prompts_v2.md            The nine prompts the agent
                                                 runs, quoted in full so you
                                                 can paste them into topics.
  Copilot_Studio_Flow_Build_Guide.md            Card-by-card build steps for
                                                 the six flows.
dashboard/
  CoreTrust_Activity_Dashboard.html   Open in any browser. Load a MASTER
                                       MEMBERS export for demand-gen tiles,
                                       a TOUCHPOINTS export for outreach
                                       activity, or just look at the demo.
docs/
  CoreTrust_LeadGen_MASTER_Handoff.md            Full project context.
  CoreTrust_Master_AIAgent_Build_Guide.md        Step-by-step, task by task.
  CoreTrust_Fit_v3_Scoring_Methodology.md        Why the score is weighted
                                                   this way.
  CoreTrust_Aspirational_Investment_KPI_Proposal.md   The ask to leadership.
```

## Where the file lives (the "runs locally in OneDrive" part)

1. Create a folder in your OneDrive (or a SharePoint team site, which is
   OneDrive under the hood for this purpose): `CoreTrust Lead Gen/`.
2. Copy `data/CoreTrust_Master_Members.xlsx` into it. That copy, synced by
   the OneDrive desktop client, is now the single source of truth --
   Copilot Studio's Excel Online (Business) connector reads and writes it
   there, you can open and edit it in desktop Excel like any other file,
   and the Python scripts in `scripts/` can point at it directly by its
   local OneDrive sync path (e.g.
   `C:\Users\you\OneDrive - CoreTrust\CoreTrust Lead Gen\CoreTrust_Master_Members.xlsx`
   on Windows, or the equivalent under `~/OneDrive` / `~/Library/CloudStorage`
   on Mac).
3. Everything else in this repo (`scripts/`, `agent/`, `docs/`,
   `dashboard/`) can live wherever you keep code -- only the workbook itself
   needs to be inside the synced OneDrive folder, since that's what
   Copilot Studio and the rep both need to reach.
4. First open: open the workbook once in desktop Excel (or Excel Online)
   before pointing Copilot Studio at it. Excel recalculates formulas on
   open and caches the results; a file that has only ever been touched by
   this repo's Python scripts has formula *text* but no cached formula
   *values* yet (openpyxl writes formulas, it doesn't evaluate them), and
   some tools read cached values. One open-and-save in real Excel fixes
   that permanently.

## Quick start

```bash
cd coretrust-leadgen
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r scripts/requirements.txt

# Regenerate the master workbook from source (only needed after a fresh
# SFDC export or a fresh enrichment/freight-analysis batch lands in
# data/source/ -- the shipped data/CoreTrust_Master_Members.xlsx is already
# current as of this commit):
python3 scripts/fitv3_pipeline.py \
  --master data/source/CoreTrust_Master_Members_SFDC_Scored.xlsx \
  --verified data/source/CoreTrust_Master_Members_Verified_Sample.xlsx \
  --out data/CoreTrust_Master_Members.xlsx

# Log a touch by hand (what the Log Touch flow does, for when you're not
# in Copilot):
python3 scripts/log_touch.py --lead CT-00001 --channel Email

# Snapshot this week's demand-gen numbers into the KPI history log:
python3 scripts/weekly_kpi_snapshot.py
```

Then open `dashboard/CoreTrust_Activity_Dashboard.html` in a browser (just
double-click it, no server needed) and load a CSV export of MASTER MEMBERS
and/or TOUCHPOINTS (File > Save a Copy > CSV in Excel, one tab at a time) to
see it populate with real numbers instead of the demo data.

## Setting up the Copilot Studio agent

1. Follow `docs/CoreTrust_Master_AIAgent_Build_Guide.md` section 2 to create
   the agent shell (generative orchestration on, web search on, moderation
   high).
2. Build the six flows using `agent/Copilot_Studio_Flow_Build_Guide.md` --
   it has the exact cards, table names, and column names to wire up, plus
   the gotchas that will otherwise cost you an afternoon.
3. Paste `agent/CoreTrust_LeadGen_Agent_Instructions_v3.md` into the
   agent's Instructions field.
4. Upload `agent/CoreTrust_Enrichment_Prompts_v2.md`,
   `docs/CoreTrust_Fit_v3_Scoring_Methodology.md`, and
   `docs/CoreTrust_Master_AIAgent_Build_Guide.md` as Knowledge.
5. Add each flow from step 2 as a Tool, with the sharp tool description
   given in the flow guide (not the auto-generated one).
6. Test in this order: ask about five members, enrich ten New rows, draft
   three emails, ask who to follow up with, run the export, then turn on
   Nightly Enrichment last.

No Copilot Studio license yet, or want the read-only half sooner? Section 7
of the build guide covers the M365 Copilot agent builder path -- it can
score, rank, and draft from an uploaded copy of the file, it just can't
write back to Excel or Outlook, so Log Touch / Draft Email / Save
Qualification / Export stay manual until you're on full Copilot Studio.

## Rescoring after enrichment

Flows write contact, ownership, and freight-signal fields directly (see the
flow guide) but deliberately never touch `Fit_v3_Score`, `Fit_Tier`, or any
other green computed column -- that math only ever runs in
`fitv3_engine.py`, called from `fitv3_pipeline.py`. After a batch of
enrichment (a Nightly Enrichment run, or a fresh verified-contact file from
the freight analysis), re-run the pipeline command from Quick Start above
to fold the new evidence into the score. This is the same reason merged
rows in this repo's shipped workbook show a higher score than the
SFDC-only baseline -- see `data/CoreTrust_Master_Members.xlsx`'s READ ME tab
for exactly which rows changed and why.

## The weekly operating cadence

| Day | What happens |
|---|---|
| Every morning | Rep asks the agent "who do I call today" (Flow 1). Works Tier A then B, prefers Ready to Call. |
| Every touch | Draft Email (Flow 3) logs itself via Log Touch (Flow 2); a call or LinkedIn touch gets logged the same way, or via `log_touch.py` if working offline. |
| After a qualification call | Save Qualification (Flow 4) records the five markers. |
| Nightly | Nightly Enrichment (Flow 6) researches New/Enriching rows, adds contacts, files them Ready to Call. |
| Weekly | Run `scripts/weekly_kpi_snapshot.py`, open the dashboard with fresh exports, review the KPI DASHBOARD history log and the Follow Up list (Prompt 5 / the dashboard's follow-up table) with the rep. |
| As qualified leads accumulate | Export For Salesforce (Flow 5), run the Data Import Wizard, note the load date so nothing double-imports. |
| Whenever a covered PE sponsor announces an acquisition | Run Enrichment Prompt 8 (PE acquisition watch) manually against the target -- this one isn't a flow yet because it's triggered by news, not a schedule. |

## The numbers, as of this workbook

Tier A: 124 &nbsp;&nbsp; Tier B: 1,196 &nbsp;&nbsp; Tier C: 3,581 &nbsp;&nbsp;
Tier D: 2,886 &nbsp;&nbsp; Freight-relevant: 7,787 of 25,443 total members
&nbsp;&nbsp; Verified contacts on hand: 11 &nbsp;&nbsp; Addressable freight
spend: ~$560B. Full detail on the SUMMARY tab; live, self-updating tiles
plus the appendable weekly history on the KPI DASHBOARD tab. See
`docs/CoreTrust_Aspirational_Investment_KPI_Proposal.md` for what these
numbers mean for the investment case.

## Troubleshooting

Flow-building issues -> the gotchas table at the bottom of
`agent/Copilot_Studio_Flow_Build_Guide.md`. Scoring questions -> `docs/
CoreTrust_Fit_v3_Scoring_Methodology.md`. Anything about what's done and
what's still open -> `docs/CoreTrust_LeadGen_MASTER_Handoff.md` section 10.
