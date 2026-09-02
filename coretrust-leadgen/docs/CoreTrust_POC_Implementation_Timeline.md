# CoreTrust Lead Gen, Proof of Concept Implementation Timeline

The phase structure and day ranges below are copied from
`docs/CoreTrust_SDR_Playbook.md`'s own "Implementation Timeline" and
"Roadmap: Crawl, Walk, Run" sections -- this doc doesn't set new dates, it
operationalizes the playbook's dates against the specific tools in this
repo. Where an earlier version of this doc said something different (a
flat 30-day pilot instead of the playbook's 90-day Launch/Validate/Automate
arc), the playbook wins; that was this doc's own mistake, corrected here.

Tracking is the point of a proof of concept -- every phase below ends in
something written to `POC SCORECARD` or `KPI DASHBOARD`, not just a status
update.

**Two views of the same journey.** The playbook gives you both a
**calendar** (five phases, fixed day ranges, below) and a **trigger-based
roadmap** (Crawl / Walk / Run, advancement gated on hitting a constraint,
not a date). Use the calendar to plan; use Crawl/Walk/Run to decide
whether you're actually *ready* to move to the next phase even if the
calendar says you should be. It's entirely possible to hit Day 90 still in
Crawl because the constraint the playbook names hasn't shown up yet --
that's not falling behind, that's the model telling you honestly what to
fund next.

Set `Pilot_Start` on `POC SCORECARD` to the actual day you begin Phase 1
below; the tab computes Day 30/60/90 from it automatically.

---

## Roadmap: Crawl, Walk, Run

| Stage | Operating model / capabilities added | Success measure / value unlocked | Advance to next stage when |
|---|---|---|---|
| **Crawl** -- Prove the Model | One employee uses the agent, Excel, and a manual Salesforce upload. The agent enriches leads through structured web research. | Generate 6-10 qualified opportunities per month, meet speed-to-lead SLAs, exceed a 5% positive reply rate. | Manual enrichment or CRM entry becomes the primary constraint on output, rather than lead quality or available demand. |
| **Walk** -- Automate the Constraints | Connect Salesforce through Power Automate; activate the ZoomInfo API using existing licenses. | Automate CRM creation, eliminate manual file uploads, improve contact accuracy, reachability, and response rates. | The Tier A and Tier B pipeline consistently exceeds one employee's capacity and verified demand supports broader investment. |
| **Run** -- Scale Across Categories | Add a private equity enrichment platform, expand Copilot Studio automation, hire a second representative when justified by demand. | Convert one sponsor relationship into multiple portfolio-company conversations, automate enrichment at scale, apply the same engine across logistics and material handling. | -- (this is the destination; from here it's ongoing scale, not a further gate) |

Everything already built in this repo (the pipeline, the six flows, BANTC,
the dashboard, the workshop guide) is what makes Crawl possible with one
person. Walk needs nothing new *built* -- it needs the Salesforce connector
approved and the ZoomInfo API activated, both licensing/IT-approval tasks,
not engineering. Run needs a funded PE enrichment tool and, per the
handoff doc section 9, Material Handling's category-specific inputs (ICPs,
target lists, the Hyster-Yale lease-end report) before that second score
can exist.

---

## Phase 1: Launch and Baseline (Days 1-30)

*Playbook's objective: "Configure the agent and workflows, load the master
file, begin outreach to Tier A and Tier B accounts, and establish baseline
performance."*

First time in Copilot Studio? Work the agent-build part of this phase as
`agent/CoreTrust_Copilot_Studio_Workshop_Guide.md` Workshops 0-7 instead of
the compressed table below -- same outcome, with a checkpoint at each step
so a stall is caught the day it happens, not on Day 20.

| Days | Task | Done when |
|---|---|---|
| 1-5 | Build the agent shell, paste Agent Instructions v3, upload Knowledge, build all six flows per `agent/Copilot_Studio_Flow_Build_Guide.md`. | Run the guide's test plan (or the workshop guide's 8-row QA table) end to end with 5-10 real accounts; publish and connect Teams. |
| 5-10 | Load `CoreTrust_Master_Members.xlsx` into OneDrive for Business (`ONEDRIVE_HOSTING_GUIDE.md`), confirm the agent's Excel Online (Business) connector sees it. Merge in the real freight-analysis file if you have it by now (see "Data depth," below) -- if not, proceed with what shipped in this repo and merge it in during Phase 2. | Agent answers "who should I call today" with real Tier A/B accounts from the live file. |
| 10-30 | Begin outreach to Tier A and Tier B, Ready to Call first. Work the daily and weekly rhythm from the root `README.md`. Let Nightly Enrichment run every night from Day 10 on. | By Day 30: a baseline week of real touches, replies, and (per playbook SLAs) same-day response on hot leads, is on `TOUCHPOINTS` and `KPI DASHBOARD`. |

**Data depth, any time during this phase:** the workbook shipped in this
repo is built from the SFDC export plus a 15-account verified-contact
sample (11 matched or newly filed). The playbook's full numbers depend on
merging in the real freight analysis files
(`CoreTrust_Freight_Leads_full.csv`, `CoreTrust_Freight_Master.csv`) once
you have them -- drop them in `data/source/`, re-run
`scripts/fitv3_pipeline.py`, re-publish to OneDrive. `KPI DASHBOARD`'s
Verified Contacts and Addressable Freight tiles should visibly move.

**Tracked:** run `scripts/weekly_kpi_snapshot.py` weekly starting Day 7.
By Day 30, `POC SCORECARD`'s Level 1 and Level 3 rows should show real
Actuals, not just formulas with nothing behind them yet.

---

## Phase 2: Validate the Pilot (Days 31-60)

*Playbook's objective: "Generate 6 to 10 qualified opportunities, validate
speed to lead and reply rates, and identify the first constraint that
requires investment."*

1. Keep working the daily/weekly rhythm -- this phase is about volume and
   honesty, not new setup.
2. Every `BANTC_Status` = "Qualified - Ready for SME" row should have a
   matching `SME HANDOFF` row with `Meeting_Status` moving from
   "Requested" to "Scheduled" to "Completed." A row stuck on "Requested"
   for more than a few days is the first real process gap -- raise it with
   the SME directly rather than waiting for Day 60.
3. **Mid-phase checkpoint, around Day 45:** read `POC SCORECARD` in full.
   Is the qualified-opportunity pace on track for 6-10/month (Level 1)? Is
   MQL-to-SQL near 22% (Level 2) -- if not, that's a targeting/scoring
   quality problem, per the playbook's own diagnosis column, not an
   effort problem. Is reply rate beating 5%? Adjust the cadence (`CADENCE`
   tab) or the authority-title keyword list
   (`scripts/save_qualification.py`'s `AUTHORITY_TITLES`, if
   `BANT_Authority` is misreading titles) now, so the back half of this
   phase benefits.
4. **By Day 60, identify the constraint.** Per Crawl's advance condition:
   is manual enrichment or manual CRM entry now the thing actually
   limiting output -- more than lead quality or available demand? Write
   this down (POC SCORECARD's notes, or `SUMMARY`) -- it's the single most
   important sentence in the Day 90 leadership readout.

**Tracked:** `POC SCORECARD` Level 1 rows compared against target every
week from now on, not just glanced at. `LEARNING NOTES` should have real
entries by now (Nightly Enrichment's end-of-day step, or written by hand)
-- read a week of them before Day 60, they're the qualitative complement to
the numbers.

---

## Phase 3: Automate and Present (Days 61-90)

*Playbook's objective: "Connect Salesforce, activate ZoomInfo, measure the
performance lift, and present the funded recommendation to leadership."*

This phase only makes sense if Phase 2 actually found a constraint worth
automating -- don't request the connector or the API as a calendar
formality if manual entry genuinely isn't the bottleneck yet. If it is:

1. Request the Salesforce connector (Power Automate Premium) and ZoomInfo
   API activation -- both are approval/licensing tasks per the investment
   proposal's own framing ("mostly buying activations and approvals, not
   a new platform").
2. Once connected, re-measure the same `POC SCORECARD` rows and note the
   lift, specifically on Level 1's Speed to Lead and Level 2's Positive
   Reply Rate / Connect Rate -- these are exactly the metrics the
   investment proposal predicts will move.
3. **By Day 90, present to leadership.** Use `POC SCORECARD`'s Go/No-Go
   section as the readout structure. Bring the actual numbers, not the
   aspirational ones from `docs/CoreTrust_Aspirational_Investment_KPI_Proposal.md`
   -- that doc is the *hypothesis*, `POC SCORECARD` after 90 days is the
   *result*.

**Tracked:** `weekly_kpi_snapshot.py`'s history log on `KPI DASHBOARD` now
spans 12-13 weeks -- graph it (or just read the table) for the leadership
deck; a trend line is more convincing than a single end-state number.

---

## Phase 4: Expand the Model (Months 4-6)

*Playbook's objective: "Evaluate a private equity enrichment tool, add
material handling scoring, and determine whether demand supports a second
representative."* This is the Walk-to-Run transition.

- Evaluate Grata (preferred) or Cyndx (lower cost) per the investment
  proposal's numbers, now backed by the pilot's actual portfolio-mapping
  experience rather than the proposal's estimate alone.
- Material handling scoring: get Nick Beach's category inputs (ICP,
  target/whitespace lists, the Hyster-Yale lease-end report -- handoff doc
  section 9) and add "Material Handling" as a real second `Category` in
  the pipeline, alongside a second set of scoring inputs (not a second
  engine -- `fitv3_pipeline.py`'s structure already supports this,
  `SME_ROUTING` already has Nick Beach seeded).
- Second representative: justified only if the Tier A/B pipeline is
  consistently outrunning one person's capacity (Crawl/Walk/Run's own
  Walk-to-Run trigger) -- check `KPI DASHBOARD`'s New/Enriching and Ready
  to Call counts against actual throughput before making this case.

---

## Phase 5: Scale Across Categories (Month 7 and beyond)

*Playbook's objective: "Build a small operating pod, expand automated
enrichment, and run logistics and material handling through one shared
lead-generation engine."* Expected outcome per the playbook: 15 or more
qualified opportunities per representative per month, across multiple
category scores on the same member base -- notably higher than Crawl's
6-10, because by this point the Walk-stage automation (Salesforce
connector, ZoomInfo) and Run-stage tools (PE enrichment, a second rep) are
all in place removing the constraints that capped Crawl's output.

At this point `POC SCORECARD`'s targets themselves should be revisited --
they were calibrated for "one employee, manual research" (the playbook's
own framing); re-baseline them once automation changes what's actually
achievable, the same way this document's own numbers came from the
playbook rather than being invented.
