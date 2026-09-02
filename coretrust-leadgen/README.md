# CoreTrust Lead Generation Engine

One AI-augmented lead generation motion for CoreTrust logistics, built as a
**proof of concept**: one Excel workbook holds every member scored 0-100 by
Fit v3, a Copilot Studio agent reads it to rank the day, research accounts,
draft email, and log touches, and a BANTC qualification layer on top of
that decides which leads are actually worth a category SME's time and
routes them there automatically. Everything runs out of a single
OneDrive-synced file plus a handful of Python scripts for the parts
Copilot Studio can't (or shouldn't) do by itself -- no SharePoint, no new
platform to buy to start. Tracking is treated as the deliverable, not an
afterthought: see `POC SCORECARD` and `KPI DASHBOARD` on the workbook, and
`docs/CoreTrust_POC_Implementation_Timeline.md` for the phased rollout.

If you only read one thing: `docs/CoreTrust_LeadGen_MASTER_Handoff.md`. It
has the business case, the full data model, and the six-flow spec this repo
implements. This README is the "how do I actually run it" companion.

**The short version of what "quality lead" means here:** Fit v3 answers
*who's worth calling* (freight budget + CoreTrust relationship + reach).
BANTC answers *whether a specific call turned into a real opportunity*
(Budget, Authority, Need, Timeline, Category) -- a lead only crosses into
`SME HANDOFF`, and only then generates a meeting request to the category's
subject matter expert, once it clears both gates. See "BANTC qualification
and the SME handoff" below.

## What's in this folder

```
data/
  CoreTrust_Master_Members.xlsx        The one file everything runs from.
                                        Tabs: MASTER MEMBERS, TOUCHPOINTS,
                                        CADENCE, SME ROUTING, SME HANDOFF,
                                        KPI DASHBOARD, POC SCORECARD,
                                        SUMMARY, READ ME, Data Dictionary.
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
                              Priority, Service_Fit, BANTC, and writes the
                              final workbook with real named Excel Tables.
  log_touch.py                Log one touch (email/call/LinkedIn) against a
                              Lead_ID from the command line -- what the Log
                              Touch Copilot Studio flow does, usable offline.
  save_qualification.py       Save the five qualification markers, compute
                              BANTC, and -- the moment a lead clears the
                              gate -- log it to SME HANDOFF routed to the
                              right category SME. Offline version of the
                              extended Save Qualification flow.
  weekly_kpi_snapshot.py      Append this week's demand-gen numbers to the
                              KPI DASHBOARD history log. Run weekly.
  requirements.txt            pandas + openpyxl.
agent/
  CoreTrust_Copilot_Studio_Workshop_Guide.md    Start here if you've never
                                                 used Copilot Studio -- nine
                                                 workshops from a blank
                                                 environment to the full
                                                 agent, with checkpoints and
                                                 a team-training agenda.
  CoreTrust_LeadGen_Agent_Instructions_v3.md   Paste into Copilot Studio's
                                                 Instructions field.
  CoreTrust_Enrichment_Prompts_v2.md            The nine prompts the agent
                                                 runs, quoted in full so you
                                                 can paste them into topics.
  Copilot_Studio_Flow_Build_Guide.md            Card-by-card build steps for
                                                 the six flows, including the
                                                 BANTC/SME-handoff extension
                                                 -- the fast reference the
                                                 workshop guide points to.
dashboard/
  CoreTrust_Activity_Dashboard.html   Open in any browser. Load a MASTER
                                       MEMBERS export for demand-gen tiles,
                                       a TOUCHPOINTS export for outreach
                                       activity, or just look at the demo.
deploy/
  portal-index.html          Landing page for the optional private VPS
                              mirror (links to the dashboard + workbook).
docs/
  CoreTrust_LeadGen_MASTER_Handoff.md            Full project context.
  CoreTrust_Master_AIAgent_Build_Guide.md        Step-by-step, task by task.
  CoreTrust_Fit_v3_Scoring_Methodology.md        Why the score is weighted
                                                   this way.
  CoreTrust_Aspirational_Investment_KPI_Proposal.md   The ask to leadership.
  CoreTrust_POC_Implementation_Timeline.md        The phased pilot plan --
                                                    start here for "what do
                                                    I do, in what order."
ONEDRIVE_HOSTING_GUIDE.md   The full OneDrive setup -- folder structure,
                             Files On-Demand, sharing, version history/
                             backup, conflict handling, mobile access,
                             troubleshooting. "Where the file lives" below
                             is the condensed version.
```

The repo root also has `deploy/Caddyfile`, `deploy/update-coretrust.sh`,
and `deploy/DEPLOY_CORETRUST.md` (outside this folder, alongside the Bible
Bot site's own deploy scripts) -- see "Optional: a private VPS mirror"
below.

## Where the file lives (OneDrive only, no SharePoint)

This is a OneDrive-for-Business setup on purpose -- no SharePoint team
site to provision, just your own OneDrive folder and a shareable link.
**For the full setup** -- folder structure, Files On-Demand gotchas that
break the local scripts, version history/backup, avoiding write conflicts
between the agent's flows and your own edits, mobile access, and a
troubleshooting table -- see `ONEDRIVE_HOSTING_GUIDE.md` in this folder's
root. The steps below are the condensed version.

1. Create a folder in your OneDrive: `CoreTrust Lead Gen/`.
2. Copy `data/CoreTrust_Master_Members.xlsx` (and, if you want them handy,
   `dashboard/CoreTrust_Activity_Dashboard.html` and
   `data/CoreTrust_SFDC_Import_Leads_sample.csv`) into it. That copy,
   synced by the OneDrive desktop client, is now the single source of
   truth -- Copilot Studio's Excel Online (Business) connector reads and
   writes it there, you can open and edit it in desktop Excel like any
   other file, and the Python scripts in `scripts/` can point at it
   directly by its local OneDrive sync path (e.g.
   `C:\Users\you\OneDrive\CoreTrust Lead Gen\CoreTrust_Master_Members.xlsx`
   on Windows, or the equivalent under `~/OneDrive` / `~/Library/CloudStorage`
   on Mac).
3. **Access via hyperlink:** in OneDrive (web or desktop), right-click the
   file -> **Share** -> **Copy link**. Set it to "People with the link can
   view" (or "can edit" for your own use) rather than a SharePoint-style
   site invite -- that link is what you hand to anyone who needs the file
   without giving them a OneDrive folder tour. The same works for the
   dashboard HTML file, so a link opens it straight in the browser.
4. Everything else in this repo (`scripts/`, `agent/`, `docs/`,
   `dashboard/`) can live wherever you keep code -- only the workbook (and
   optionally the dashboard/CSV) needs to be inside the synced OneDrive
   folder, since that's what Copilot Studio and the rep both need to
   reach.
5. First open: open the workbook once in desktop Excel (or Excel Online)
   before pointing Copilot Studio at it. Excel recalculates formulas on
   open and caches the results; a file that has only ever been touched by
   this repo's Python scripts has formula *text* but no cached formula
   *values* yet (openpyxl writes formulas, it doesn't evaluate them), and
   some tools read cached values. One open-and-save in real Excel fixes
   that permanently.

## Optional: a private VPS mirror

If you want a link that opens without OneDrive signed in -- from a phone,
someone else's machine, wherever -- `deploy/DEPLOY_CORETRUST.md` (repo
root, next to the Bible Bot site's own deploy scripts) publishes the
dashboard and workbook to `https://kypher.cc/coretrust-leadgen/`, gated by
a login and excluded from search indexing. It's a **mirror**, not the
primary copy: OneDrive stays what Copilot Studio and the rep edit day to
day; the VPS copy only updates when you run
`deploy/update-coretrust.sh` by hand. Entirely optional -- skip it if
OneDrive-only is enough.

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

# Save BANTC qualification markers by hand and auto-trigger the SME
# handoff if the lead clears the gate (what the extended Save Qualification
# flow does):
python3 scripts/save_qualification.py --lead CT-00001 \
  --tms "Optimized TMS" --contract-status "Renewal <6mo" \
  --capacity-source "Broker/Spot" --private-fleet No --under-contract Yes

# Snapshot this week's demand-gen numbers into the KPI history log:
python3 scripts/weekly_kpi_snapshot.py
```

Then open `dashboard/CoreTrust_Activity_Dashboard.html` in a browser (just
double-click it, no server needed) and load a CSV export of MASTER MEMBERS
and/or TOUCHPOINTS (File > Save a Copy > CSV in Excel, one tab at a time) to
see it populate with real numbers instead of the demo data.

## Setting up the Copilot Studio agent

**Never built anything in Copilot Studio before?** Use
`agent/CoreTrust_Copilot_Studio_Workshop_Guide.md` instead of the steps
below -- it's the same build, broken into nine hands-on workshops (0-8)
with a checkpoint after each one, prerequisites/licensing/DLP checks up
front, and a facilitator's agenda if you're training more than yourself.
It also covers publishing to Teams and ongoing monitoring, which the quick
version below doesn't.

The quick version, if you already know Copilot Studio:

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

## BANTC qualification and the SME handoff

Fit v3 ranks who's worth a rep's time; it doesn't say a lead is *sold*.
BANTC is the second gate, run at qualification time on `MASTER MEMBERS`:

| Letter | What it reads | Source |
|---|---|---|
| **B**udget | `Confirmed_Freight_Spend` / `Est_Freight_Spend` | Already on the row from Fit v3's own inputs, or confirmed on a call. |
| **A**uthority | `Contact_Title` + a verified `Contact_Email` | Decision-maker title match (VP/Director/Chief/etc.) plus reachability. |
| **N**eed | `TMS_In_Use`, `Capacity_Source`, `Under_Contract` | The same qualification-call markers Save Qualification already collects. |
| **T**imeline | `Contract_Status` | "None" or "Renewal <6mo" reads as a real trigger; "Locked" doesn't. |
| **C**ategory | `Freight_Relevant` | Which CoreTrust category owns this opportunity -- routes the handoff. |

A lead crosses to `BANTC_Status` = **Qualified - Ready for SME** once
Budget and Authority are both "Yes" and at least three of the four BANT
letters are "Yes." That status is the trigger: `scripts/save_qualification.py`
(or the extended Save Qualification flow, see the flow guide) immediately
logs the lead to `SME HANDOFF`, looked up against `SME ROUTING` by
`Category`, so the right subject matter expert gets a meeting request
instead of the lead sitting in a spreadsheet cell. `SME ROUTING` ships
seeded with the two names the project docs actually name -- Rod Andrews
for Logistics, Nick Beach for Material Handling (once that category is
scored) -- add rows as your category structure grows; never invent a name
or email that isn't verified.

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

For the phased pilot plan (what to do in what week), see
`docs/CoreTrust_POC_Implementation_Timeline.md`. Day to day, once the
pilot is running:

| Day | What happens |
|---|---|
| Every morning | Rep asks the agent "who do I call today" (Flow 1). Works Tier A then B, prefers Ready to Call. |
| Every touch | Draft Email (Flow 3) logs itself via Log Touch (Flow 2); a call or LinkedIn touch gets logged the same way, or via `log_touch.py` if working offline. |
| After a qualification call | Save Qualification (Flow 4) records the five markers, computes BANTC, and -- the moment the gate clears -- logs the lead to SME HANDOFF and routes it to that category's SME. Offline: `save_qualification.py`. |
| SME follow-through | Whoever owns `SME ROUTING` for that category moves the `SME HANDOFF` row's `Meeting_Status` from Requested to Scheduled to Completed. This isn't automated -- it's a human loop the sheet just makes visible. |
| Nightly | Nightly Enrichment (Flow 6) researches New/Enriching rows, adds contacts, files them Ready to Call. |
| Weekly | Run `scripts/weekly_kpi_snapshot.py`, review `POC SCORECARD` (targets vs actuals) and `KPI DASHBOARD`'s history log, check the Follow Up list (Prompt 5 / the dashboard's follow-up table) with the rep. |
| As qualified leads accumulate | Export For Salesforce (Flow 5), run the Data Import Wizard, note the load date so nothing double-imports. |
| Whenever a covered PE sponsor announces an acquisition | Run Enrichment Prompt 8 (PE acquisition watch) manually against the target -- this one isn't a flow yet because it's triggered by news, not a schedule. |

## The numbers, as of this workbook

Tier A: 124 &nbsp;&nbsp; Tier B: 1,196 &nbsp;&nbsp; Tier C: 3,581 &nbsp;&nbsp;
Tier D: 2,886 &nbsp;&nbsp; Freight-relevant: 7,787 of 25,443 total members
&nbsp;&nbsp; Verified contacts on hand: 11 &nbsp;&nbsp; Addressable freight
spend: ~$560B. Full detail on the SUMMARY tab; live, self-updating tiles
plus the appendable weekly history on the KPI DASHBOARD tab, and
target-vs-actual tracking for the pilot itself on POC SCORECARD. See
`docs/CoreTrust_Aspirational_Investment_KPI_Proposal.md` for what these
numbers mean for the investment case, and
`docs/CoreTrust_POC_Implementation_Timeline.md` for how the pilot turns
them into a go/no-go decision.

## Troubleshooting

Flow-building issues -> the gotchas table at the bottom of
`agent/Copilot_Studio_Flow_Build_Guide.md`. Scoring questions -> `docs/
CoreTrust_Fit_v3_Scoring_Methodology.md`. BANTC or SME routing questions ->
"BANTC qualification and the SME handoff" above. VPS/login issues ->
`deploy/DEPLOY_CORETRUST.md`. Anything about what's done and what's still
open -> `docs/CoreTrust_LeadGen_MASTER_Handoff.md` section 10 and
`docs/CoreTrust_POC_Implementation_Timeline.md`.
