# CoreTrust Lead Gen, Proof of Concept Implementation Timeline

A phased plan from "the tools exist" to "leadership has a go/no-go decision
backed by real pilot numbers." Tracking is the point of a proof of concept
-- every phase below ends in something written to `POC SCORECARD` or
`KPI DASHBOARD`, not just a status update.

Dates are expressed as weeks/days from kickoff, not calendar dates, because
kickoff depends on when the Copilot Studio agent is actually built. Set the
real anchor once you start: `Pilot_Start` on the `POC SCORECARD` tab
defaults to the day `fitv3_pipeline.py` was last run, `Pilot_End` to 30
days after -- edit both cells to match your actual pilot window (the pilot
window and the "30 days" in the investment proposal's own economics model
are the same 30 days, so keeping them aligned matters).

## Phase 0 -- Foundation (done, this repo)

Already built and in this PR: the Fit v3-scored master workbook with real
named Excel Tables, the merge/scoring pipeline, the agent instructions and
enrichment prompt library, a card-by-card flow build guide, the BANTC
qualification layer with SME routing, the activity + demand-gen dashboard,
local scripts for working the file without Copilot Studio open, and this
timeline. Nothing in Phase 1 onward is blocked on more code -- it's blocked
on building the Copilot Studio agent itself (a Power Platform maker task,
not a repo task) and on running the pilot.

## Phase 1 -- Agent build (Week 1)

First time in Copilot Studio? Work this phase as
`agent/CoreTrust_Copilot_Studio_Workshop_Guide.md` Workshops 0-6 instead of
the compressed table below -- same outcome, with checkpoints at each step
so a stall is caught the day it happens, not on Day 5.

| Day | Task | Done when |
|---|---|---|
| 1-2 | Build the agent shell, paste Agent Instructions v3, upload Knowledge (`agent/Copilot_Studio_Flow_Build_Guide.md`'s setup steps 1-4, or Workshops 0-1 of the workshop guide). | Agent responds to "who should I call today" with *something*, even before flows exist. |
| 2-4 | Build all six flows per `agent/Copilot_Studio_Flow_Build_Guide.md`, in the order it recommends (Get Today List, Draft Email, Log Touch, Save Qualification, Export For Salesforce, Nightly Enrichment last). | Each flow passes its own test-pane run once, using a real `Lead_ID` from the workbook. |
| 5 | Run the guide's six-step test plan end to end with 5-10 real accounts (or the workshop guide's 8-row formal QA table, Workshop 6). | Five members answered correctly, ten New rows enriched without touching green columns, three emails drafted and logged, follow-up list returns the right accounts, one CSV export test-imports into a Salesforce sandbox. |
| 5 | Publish and connect the Teams channel (workshop guide, Workshop 7). | Rep can reach the agent from Teams, not just the maker test pane. |

**Tracked:** none yet -- this phase is infrastructure, not pipeline. The
first real entry on `POC SCORECARD` is Phase 3, Day 1.

## Phase 2 -- Data depth (Week 1-2, runs in parallel with Phase 1)

The workbook shipped in this repo is built from the SFDC export plus a
15-account verified-contact sample (11 matched or newly filed). The
handoff document's real numbers -- 1,050+ verified contacts, the full PE
sponsor rollup, ~$560B addressable freight across the complete base --
depend on merging in the actual freight analysis files
(`CoreTrust_Freight_Leads_full.csv`, `CoreTrust_Freight_Master.csv`) once
you have them.

| Task | Done when |
|---|---|
| Get the freight analysis files (or the ZoomInfo/PE-tool exports that replace them, if those get activated -- see the investment proposal). | Files land in `data/source/`. |
| Re-run `scripts/fitv3_pipeline.py --master ... --verified <freight file> --out data/CoreTrust_Master_Members.xlsx`. | Tier A/B counts and verified-contact count on `SUMMARY` jump the way section 2.1 of the handoff doc describes. |
| Re-publish to OneDrive (and the VPS mirror, if you're using one -- `deploy/update-coretrust.sh`). | The agent's next `List rows` call sees the enriched data. |

**Tracked:** `KPI DASHBOARD`'s "Verified contacts" and "Addressable freight
$" tiles should visibly move after this phase. Note the before/after in
`POC SCORECARD`'s notes column so the pilot's baseline is honest about
when real enrichment started.

## Phase 3 -- Pilot launch (Day 1 of the 30-day window)

1. Set `Pilot_Start` on `POC SCORECARD` to today.
2. Rep's first morning: ask the agent "who should I call today," work the
   returned list, draft and log every touch.
3. Turn on Nightly Enrichment (Recurrence trigger) so New/Enriching rows
   start filling in behind the pilot without anyone asking for it.
4. Confirm `TOUCHPOINTS` picks up today's activity -- open the file, check
   row count and `Last_Touch_Date`.

**Tracked:** this is the first day `POC SCORECARD`'s "Actual" formulas
have anything to count.

## Phase 4 -- Weekly operating cadence (Days 1-30)

Follow the root `README.md`'s "weekly operating cadence" table day to day.
Once a week, specifically for the POC:

1. Run `python3 scripts/weekly_kpi_snapshot.py` -- appends one row to
   `KPI DASHBOARD`'s history log.
2. Open `POC SCORECARD`. Compare Actuals to Targets (or to nothing, for
   the TBD rows -- those exist to *get* a number, not to already have one).
3. Every `BANTC_Status` = "Qualified - Ready for SME" row should have a
   matching `SME HANDOFF` row with `Meeting_Status` moving from
   "Requested" to "Scheduled" to "Completed" -- if it's stuck on
   "Requested" for more than a few days, that's the pilot's first real
   process gap, worth raising with the SME directly rather than waiting
   for the 30-day readout.
4. Note anything qualitative (which titles reply, which industries land
   meetings, what enrichment sources were most reliable -- Enrichment
   Prompt 9, the learning note) in `POC SCORECARD`'s or `SUMMARY`'s notes.

## Phase 5 -- Mid-pilot checkpoint (Day 15)

A checkpoint, not a decision gate. Read `POC SCORECARD` and ask: is the
qualified-opportunity pace on track for the ~15/month baseline? Is BANTC
actually catching leads and routing them, or is the SME meeting count
stuck at zero because Need/Timeline never get filled in during calls? Is
reply rate suggesting the email templates or cadence need a tweak before
the back half of the pilot? Adjust the cadence (CADENCE tab) or the
authority-title keyword list (`scripts/save_qualification.py`'s
`AUTHORITY_TITLES`, if BANT_Authority is misreading titles) now, not on
Day 30, so the second half of the pilot benefits from the fix.

## Phase 6 -- Measurement and go/no-go (Day 30)

1. Run `weekly_kpi_snapshot.py` one final time.
2. Fill in every remaining TBD on `POC SCORECARD` with what actually
   happened -- reply rate, SME meetings completed, cost per qualified
   opportunity if you have a cost basis.
3. Compare against `docs/CoreTrust_Aspirational_Investment_KPI_Proposal.md`'s
   "what the money produces" section -- did the pilot's qualified-opp rate
   and reachability numbers support the same conclusion (reachability, not
   freight size, is the binding constraint)?
4. Use `POC SCORECARD`'s Go/No-Go section as the readout structure for
   leadership: connector approval, ZoomInfo API activation, and the PE
   enrichment tool ask, each judged against what the pilot actually showed
   rather than the aspirational numbers alone.

## Phase 7 -- Scale decision

If leadership approves: activate the connector and API per the investment
proposal, fund the PE tool, and revisit `SME ROUTING` and `Category` to add
Material Handling once Nick Beach provides that category's ICPs, target
lists, and the Hyster-Yale lease-end report (handoff doc section 9). The
same pipeline and the same BANTC gate extend to a second category without
a second engine -- only a second set of scoring inputs.

If leadership says not yet: the pilot's `POC SCORECARD` and
`KPI DASHBOARD` history are still the artifact -- they're what makes the
next pitch a rerun with real numbers instead of a cold re-ask.
