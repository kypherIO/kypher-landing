# CoreTrust Lead Gen: Full Deployment Guide

The single, linear, start-to-finish path from "I have this repo" to "the
agent is live in Teams, verified, and the rep is working real leads."
Follow it top to bottom. Each part gives you the steps directly where
they're simple, and points to a deeper, more detailed guide where the
step has enough surface area to deserve its own document.

## What's verified fact vs. what's spec-accurate but unconfirmed live

Read this once before you start, because it matters for how much to trust
each part below:

- **File structure, formulas, table names, and every Python script**:
  actually executed and checked in this repo's own build process --
  running the pipeline, running every script against a simulated OneDrive
  path (spaces in the folder name, nested directories, exactly the shape
  a real OneDrive for Business sync creates), reloading the result and
  confirming the tables, formulas, and Fit v3 scores survived intact
  across repeated writes. Part 3 below has the specifics of what was
  tested.
- **Copilot Studio's UI** (menu labels, click paths, connector picker
  behavior): written to the current documented behavior and this
  project's own build guide, but not click-tested against a live tenant
  in this session -- Microsoft ships UI changes to Copilot Studio
  regularly, and exact labels can drift. Where a step says "click X," and
  you see something adjacent instead, that's UI drift, not a wrong
  instruction -- the underlying action (add a trigger, add an Update a
  row card, etc.) is what to trust.

## What "done" looks like

- `CoreTrust_Master_Members.xlsx` and the dashboard live in a OneDrive for
  Business folder, confirmed synced.
- A Copilot Studio agent exists, published, reachable from Teams, with
  all six flows built and individually tested against the real file.
- The 9-row QA table (Workshop 6, linked below) all passes.
- You can ask "who should I call today" from Teams and get a real,
  ranked, Tier A/B list back.

---

## Prerequisites (check every box before starting)

- [ ] Copilot Studio access (standalone license, or M365 Copilot with
  agent-building included, or a trial).
- [ ] A Power Platform environment you have Maker access to.
- [ ] **OneDrive for Business** -- not personal/consumer OneDrive. Check:
  sign in at `onedrive.com` with your CoreTrust work account; the URL
  after sign-in should contain `-my.sharepoint.com`. If it's plain
  `onedrive.live.com` with no org branding, that's the wrong account --
  see `ONEDRIVE_HOSTING_GUIDE.md` Part 0 before continuing.
- [ ] Excel Online (Business), Office 365 Outlook, and OneDrive for
  Business connections available in Power Automate (`make.powerautomate.com`
  > Data > Connections > + New connection, search each name).
- [ ] No DLP policy blocking those three connectors from being used
  together (ask your admin if unsure).
- [ ] Python 3.9+ and `pip` available locally, if you'll run the pipeline
  or the local scripts (`scripts/requirements.txt`: pandas + openpyxl).

---

## Part 1: Get the files

```bash
git clone <this repo's URL>
cd <repo>/coretrust-leadgen
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt
```

`data/CoreTrust_Master_Members.xlsx` in this repo is already a current,
fully-built workbook (25,443 members, Fit v3-scored, all eleven tabs) --
you don't have to regenerate it to start. Regenerate it later only when a
fresh SFDC export or freight-analysis file shows up (`scripts/
fitv3_pipeline.py`, see the root `README.md`'s "Rescoring after
enrichment").

---

## Part 2: Set up OneDrive for Business

Full depth: **`ONEDRIVE_HOSTING_GUIDE.md`** -- read it if this is your
first time, it covers Files On-Demand's placeholder-file trap (breaks the
local scripts if you skip it), sharing scopes, version history, and
conflict handling. Condensed version:

1. Sign in to OneDrive for Business, confirm the `-my.sharepoint.com` URL.
2. Create `CoreTrust Lead Gen/`, and inside it `Exports/` and `Archive/`.
3. Upload `data/CoreTrust_Master_Members.xlsx` and
   `dashboard/CoreTrust_Activity_Dashboard.html` to the top level.
4. Install/sign in to the OneDrive desktop client if it isn't already
   running, so the folder syncs to your local machine.
5. Right-click `CoreTrust_Master_Members.xlsx` locally > **"Always keep on
   this device"** -- forces a real local copy instead of a cloud
   placeholder, which otherwise breaks the Python scripts with a
   confusing "file not found."

**Checkpoint:** the folder shows a green synced checkmark locally, not a
blue cloud icon, on the workbook specifically.

---

## Part 3: Verify the file actually works from that path

This step is here because it was actually tested, not assumed. During
this repo's own build, every local script was run against a simulated
OneDrive path (`/OneDrive - CoreTrust Simulated/CoreTrust Lead Gen/...`,
deliberately including the space in the folder name that real OneDrive
uses) and confirmed:

- `log_touch.py` correctly adds and increments rows, including when the
  path has spaces and is nested two directories deep.
- `save_qualification.py` correctly computes BANTC, writes to SME
  HANDOFF, and applies Retry/Nurture/Recycle dispositions, same path.
- `weekly_kpi_snapshot.py` correctly appends to the KPI history log, same
  path.
- After five sequential script runs against that path, the workbook
  reloads cleanly: all six named tables intact (`MasterTable`,
  `TouchTable`, `CadenceTable`, `SMERoutingTable`, `SMEHandoffTable`,
  `LearningNotesTable`), and all 7,785 originally-scored `MASTER MEMBERS`
  rows still carry their exact original `Fit_v3_Score`/`Fit_Tier` -- zero
  drift from repeated open-write-save cycles.
- The dashboard HTML has zero external network calls (no `fetch`, no
  XHR, no remote script/image references) -- it works fully offline, and
  works identically whether opened from a local disk or a synced OneDrive
  folder, double-clicked with no server.

Do the same check yourself, against your real OneDrive path, before
building the agent:

```bash
export CORETRUST_FILE="/path/to/your/OneDrive/CoreTrust Lead Gen/CoreTrust_Master_Members.xlsx"
python3 scripts/log_touch.py --lead CT-00001 --channel Email --file "$CORETRUST_FILE"
```

**Checkpoint:** the command prints `Saved <your path>` with no error, and
re-opening the file in Excel shows the new/incremented row on
TOUCHPOINTS.

---

## Part 4: Build the Copilot Studio agent

Full depth: **`agent/CoreTrust_Copilot_Studio_Workshop_Guide.md`** --
never used Copilot Studio before? Work through Workshops 0-7 there in
full; they have a checkpoint after every step. If you already know
Copilot Studio, the condensed version:

1. `copilotstudio.microsoft.com` > confirm the right environment > **Create
   > New agent > Configure manually**. Name it CoreTrust Lead Gen Copilot.
2. Settings: turn on **generative orchestration**, **web search**,
   moderation **High**.
3. Paste `agent/CoreTrust_LeadGen_Agent_Instructions_v3.md` into
   Instructions.
4. Upload as Knowledge: `agent/CoreTrust_Enrichment_Prompts_v2.md`,
   `docs/CoreTrust_Fit_v3_Scoring_Methodology.md`,
   `docs/CoreTrust_Master_AIAgent_Build_Guide.md`, and
   `docs/CoreTrust_SDR_Playbook.md` (the canonical operating rules --
   include it, the agent should be able to answer cadence/SLA questions
   grounded in the real playbook, not a paraphrase).

**Checkpoint:** in the test pane, "What is Fit v3?" and "What does BANTC
stand for?" both get substantively correct answers.

---

## Part 5: Confirm the workbook's tables, then build all six flows

1. In desktop Excel, click inside each of these six tabs and confirm the
   **Table Design** tab shows the exact name: MASTER MEMBERS =
   `MasterTable`, TOUCHPOINTS = `TouchTable`, CADENCE = `CadenceTable`,
   SME ROUTING = `SMERoutingTable`, SME HANDOFF = `SMEHandoffTable`,
   LEARNING NOTES = `LearningNotesTable`. (`scripts/fitv3_pipeline.py`
   already builds them this way -- this just confirms nothing got
   renamed along the way.)
2. Build all six flows using **`agent/Copilot_Studio_Flow_Build_Guide.md`**
   -- it has the exact cards, filter queries, and column names for each
   one, plus a gotchas table for the failure modes that cost the most
   time. Build in this order: Get Today List, Draft Email, Log Touch,
   Save Qualification, Export For Salesforce, Nightly Enrichment last.
3. For each flow, write the **sharp tool description** the guide gives
   you (not the auto-generated one) -- this is what generative
   orchestration routes on, it matters more than almost anything else in
   this build.

**Checkpoint, per flow** (the flow guide's per-flow tests, or Workshop
4's table in the workshop guide):

| Flow | Quick test |
|---|---|
| Get Today List | "Who should I call today?" returns real Tier A/B companies with real scores. |
| Draft Email | Drafts land in Outlook unsent, log a touch automatically. |
| Log Touch | Logging a touch for a brand-new lead creates a row with working `Days_Since_Last`/`Next_Touch_Due`/`Follow_Up_Flag`/`SLA_Status`/`Nurture_Suggested` formulas (structured references, not a guessed row number -- see the flow guide's Flow 2, step 3b.3). |
| Save Qualification | Clearing BANTC (Budget=Yes, Authority=Yes, 3+ of 4 Yes) adds a row to SME HANDOFF, routed by Category through SME ROUTING. |
| Export For Salesforce | CSV lands in OneDrive's `Exports/` folder, headers match `data/CoreTrust_SFDC_Import_Leads_sample.csv`. |
| Nightly Enrichment | Runs without touching any green computed column; ends by writing a row to LEARNING NOTES. |

---

## Part 6: Full QA sign-off

Run the complete 9-row table in `agent/CoreTrust_Copilot_Studio_Workshop_Guide.md`,
Workshop 6 -- it covers member Q&A, enrichment, email drafting, follow-up
lists, BANTC-to-SME-HANDOFF, the Salesforce export, Nightly Enrichment,
exclusion handling, and the Nurture trigger after 8 touches. Keep a dated
record of pass/fail (a note in `POC SCORECARD` is fine) -- this is your
evidence the build works before real outreach starts on it.

---

## Part 7: Publish and connect Teams

1. **Publish** (top right of Copilot Studio) -- locks in the current
   Instructions/Knowledge/Tools as the live version.
2. **Channels > Microsoft Teams + Microsoft 365** > turn on. Standard M365
   licensing covers this, no extra cost.
3. Set availability (start with "just me" for a one-person pilot).
4. Open Teams, find the agent, re-run a couple of Part 5's checkpoint
   tests there -- Teams can render slightly differently than the test
   pane.

**Checkpoint:** "who should I call today" and "draft an email to X" both
work correctly from Teams, not just the maker test pane.

---

## Part 8 (optional): Private VPS mirror

Only if you want a link that opens without OneDrive signed in. Full
guide: **`deploy/DEPLOY_CORETRUST.md`** (repo root). Short version: it
publishes the dashboard and workbook to a password-gated, `noindex`d path
on your existing VPS, with the password hash living in a server-side
environment variable, never in git. Entirely skippable -- nothing in
Parts 1-7 depends on it.

---

## Part 9: Go-live checklist

- [ ] Workbook and dashboard confirmed synced in OneDrive for Business
      (Part 2-3).
- [ ] Agent built, published, reachable from Teams (Part 4, 7).
- [ ] All six tables confirmed correctly named (Part 5, step 1).
- [ ] All six flows built and individually tested (Part 5).
- [ ] Workshop 6's full 9-row QA table passes (Part 6).
- [ ] `POC SCORECARD`'s `Pilot_Start` set to today.
- [ ] Rep knows the daily/weekly rhythm (root `README.md`, "The operating
      rhythm").
- [ ] Nightly Enrichment's Recurrence trigger turned on.

Once every box is checked, you're in Phase 1 ("Launch and Baseline") of
`docs/CoreTrust_POC_Implementation_Timeline.md` -- that document takes
over from here for the 90-day arc through to a leadership go/no-go.

---

## What runs via the agent, and what's a manual/local fallback

| Capability | Runs via the agent (Copilot Studio) | Local fallback if you're not in Copilot Studio |
|---|---|---|
| Rank today's call list | Flow 1 | Sort `MasterTable` by `Fit_v3_Score` in Excel directly |
| Research and enrich a lead | Flow 6 (nightly) or ask the agent directly | Manual web research, type into the row |
| Draft outreach email | Flow 3 | Write it yourself |
| Log a touch | Flow 2 (chained from Flow 3, or called directly) | `scripts/log_touch.py` |
| Qualify a lead / compute BANTC / trigger SME handoff | Flow 4 | `scripts/save_qualification.py` |
| Apply a Retry/Nurture/Recycle disposition | Flow 4's optional extension (see the flow guide) | `scripts/save_qualification.py --disposition ...` |
| Export qualified leads for Salesforce | Flow 5 | Filter `Qualified = Yes` in Excel, build the CSV by hand against `data/CoreTrust_SFDC_Import_Leads_sample.csv`'s headers |
| Weekly KPI snapshot | Not a flow (by design -- see the flow guide's Flow 6 note) | `scripts/weekly_kpi_snapshot.py`, run weekly |
| Rescore after enrichment (Fit v3) | Never automatic, by design -- the green columns only ever move via the pipeline | `scripts/fitv3_pipeline.py`, re-run after a data refresh |

Every local fallback script was the one actually run in Part 3's
verification -- they're not aspirational, they work today, standalone,
with no Copilot Studio license at all if you need to operate without one
temporarily.
