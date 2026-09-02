# CoreTrust Copilot Studio Workshop Guide

## Building the Lead Gen agent from zero, one workshop at a time

This is the "start with nothing, end with the full agent" guide. If you've
never opened Copilot Studio, start here. If you already know Copilot
Studio and just want the exact cards for each flow,
`agent/Copilot_Studio_Flow_Build_Guide.md` is the faster reference — this
guide points to it rather than repeating it, so the two never drift apart.

**Relationship to the other docs in this repo:**

| Document | What it's for |
|---|---|
| **This guide** | Learning Copilot Studio itself, in order, with checkpoints. Start here if you're new to Copilot Studio. |
| `Copilot_Studio_Flow_Build_Guide.md` | The exact cards, table names, and column names for all six flows. This guide sends you there for the how-to-click-what of each flow. |
| `CoreTrust_LeadGen_Agent_Instructions_v3.md` | What you paste into the agent's Instructions field (Workshop 1). |
| `CoreTrust_Enrichment_Prompts_v2.md` | The nine prompts the agent runs, quoted in full — useful as Knowledge and as a reference while testing. |
| `../docs/CoreTrust_Master_AIAgent_Build_Guide.md` | The original project narrative — the *why* behind each design decision. |
| `../docs/CoreTrust_POC_Implementation_Timeline.md` | The calendar this workshop sequence fits into (Phase 1, specifically). |

**Format:** each workshop has a stated time estimate, a stated outcome, a
numbered walkthrough, and a checkpoint you can actually verify pass/fail
on. Do them in order — each one assumes the previous one's checkpoint
passed. Total time for a first build, solo: roughly one working day spread
over 2-3 sessions (Workshop 4 is the long one).

**Solo vs. team.** Written for one builder working through it themselves.
If you're running this as a group training session instead, skip to
"Running this as a team workshop" at the end — it maps the same content to
a half-day or full-day agenda.

---

## Part 0 — Orientation

### What Copilot Studio actually is

Three different Microsoft things get called "Copilot" and it's worth being
precise before you start clicking:

- **Microsoft 365 Copilot** — the AI assistant baked into Word/Excel/Teams
  that helps *you* work faster in those apps. Not what we're building.
- **Copilot Studio** — a low-code tool for building your *own* custom
  agent with its own instructions, its own knowledge, and its own tools
  (things it can *do*, not just say). This is what we're building.
- **Power Automate** — the workflow engine Copilot Studio's tools are
  built on. Every "tool" the agent calls is a Power Automate flow under
  the hood; Copilot Studio just gives you a friendly way to wire a flow up
  as something the agent can invoke mid-conversation.

### The vocabulary you need before anything else makes sense

| Term | Plain definition |
|---|---|
| **Agent** | The thing you're building. One agent = one Instructions field, one set of Knowledge, one set of Tools. |
| **Topic** | A scripted conversation path (trigger phrases -> a fixed flow of questions/answers). We use almost none of these — generative orchestration handles routing instead. |
| **Generative orchestration** | The mode where the agent reads your Instructions, looks at your Tools' descriptions, and *decides* what to do for a given message, instead of following a rigid topic script. This is the mode this whole build depends on. |
| **Knowledge** | Documents/sites the agent can search and cite when answering questions (not the same as a Tool — Knowledge only lets it *read*, never *write*). |
| **Tool** (sometimes labeled "Action" depending on your tenant's Copilot Studio version) | Something the agent can *do* — almost always a Power Automate flow, wired up with a name and a description the model uses to decide when to call it. |
| **Connector** | The thing a Power Automate flow uses to talk to an external system — Excel Online (Business), Office 365 Outlook, OneDrive for Business, in this build. All three are standard, included in your existing M365 licensing. |
| **Publish** | Locks in the current Instructions/Topics/Tools/Knowledge as the live version end users interact with. Testing in the test pane always uses your *unpublished* draft, so you can experiment freely before publishing. |
| **Channel** | Where end users actually reach the agent — Teams, a web widget, etc. We use Teams (see Workshop 7). |
| **Environment** | A Power Platform container (think: a workspace) that holds your agent, its flows, and its connections. Ask your Microsoft 365 admin which environment you should build in if you're not sure — building in the wrong one is the single most common reason a flow later fails to find "the" Excel file. |

### The shape of what you're building

```
                     ┌─────────────────────────────┐
   Rep, in Teams ───▶│   CoreTrust Lead Gen Copilot │
                     │   (Instructions + Knowledge)  │
                     └───────────────┬───────────────┘
                                     │ generative orchestration
                                     │ picks a tool per message
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
      Flow 1: Get Today      Flow 3: Draft Email     Flow 6: Nightly
        List (agent-called)   (agent-called)          Enrichment
              │                      │                (Recurrence-
              ▼                      ▼                 triggered,
      Flow 2: Log Touch      Flow 4: Save              not agent-
        (agent-called, also   Qualification →           called)
        chained from Flow 3)  BANTC → Flow "SME
              │                Handoff" (same flow)
              ▼                      │
      Flow 5: Export For             ▼
        Salesforce            SME HANDOFF tab,
        (agent-called)         routed via SME
              │                ROUTING
              ▼                      │
     ┌────────┴──────────────────────┴────────┐
     │   CoreTrust_Master_Members.xlsx          │
     │   (OneDrive) — MasterTable, TouchTable,   │
     │   CadenceTable, SMERoutingTable,          │
     │   SMEHandoffTable                         │
     └────────────────────┬──────────────────────┘
                           │
                  Office 365 Outlook (drafts only)
```

Every arrow into the workbook goes through a flow — never straight from
the agent. That's the single rule the rest of this guide keeps coming back
to.

---

## Part 1 — Prerequisites

Check every box before Workshop 0. Missing one of these is the most common
reason a first build stalls halfway through.

- [ ] **Copilot Studio access.** Either a standalone Copilot Studio license,
  or a Microsoft 365 Copilot license that includes Copilot Studio agent
  building, or your tenant's trial. If you're not sure which you have, go
  to `copilotstudio.microsoft.com` and see if "Create an agent" is
  clickable — if it prompts for a license, ask your M365 admin.
- [ ] **A Power Platform environment** you have Maker access to. Ask your
  admin for a Dataverse-enabled environment if this is a first build — a
  default/trial environment works for a proof of concept.
- [ ] **Excel Online (Business), Office 365 Outlook, and OneDrive for
  Business** connections available in Power Automate under your account.
  All three are standard connectors (no premium license needed) — confirm
  by going to `make.powerautomate.com` > **Data > Connections > + New
  connection** and searching each name.
- [ ] **No Data Loss Prevention (DLP) policy blocking these connectors
  from being used together.** If your tenant has a DLP policy, Excel
  Online, Outlook, and OneDrive need to be in the same group (e.g. all
  "Business" data group) or flows will fail silently on publish. Ask your
  admin to check if you hit this — the symptom is a flow that saves fine
  but errors the moment you try to turn it on.
- [ ] **`CoreTrust_Master_Members.xlsx` is already in OneDrive**, per the
  root `README.md`'s "Where the file lives" section, and you've opened it
  once in desktop Excel or Excel Online (so its formulas have cached
  values — see that README section for why this matters).
- [ ] **You've read `docs/CoreTrust_Fit_v3_Scoring_Methodology.md`** and
  the BANTC section of the root README. You don't need to memorize the
  math, but you should be able to explain in one sentence what Fit v3
  measures and what BANTC adds on top, because you'll be writing tool
  descriptions that need to say this correctly.

---

## Workshop 0 — Environment and your first agent (30-45 min)

**Outcome:** an agent exists, generative orchestration is on, and it can
hold a basic conversation in the test pane.

1. Go to `copilotstudio.microsoft.com`, sign in, and confirm the
   **Environment** selector (top right) shows the environment from your
   Prerequisites checklist. Every flow you build later has to be built in
   this same environment — switching environments mid-project is the
   single easiest way to end up with a flow that "can't find" the Excel
   file.
2. **Create > New agent > Configure manually** (not "Describe your
   agent" — that path generates instructions for you, and we already have
   a precise instruction set to paste in Workshop 1; manual configuration
   gives you a clean slate).
3. Name it **CoreTrust Lead Gen Copilot**. Add a short description (one
   sentence — this is for your own agent list, not for routing).
4. Take the tour of the left nav before touching anything else:
   - **Overview** — the Instructions field lives here (or under Settings
     in some tenant versions — if you don't see it on Overview, check
     Settings > Generative AI).
   - **Topics** — scripted conversation paths. We'll leave this mostly
     empty; generative orchestration handles routing instead.
   - **Knowledge** — documents/sites the agent can search (Workshop 1).
   - **Tools** (or **Actions**, depending on your tenant's version) — where
     flows get wired up as things the agent can do (Workshop 3 onward).
   - **Channels** — where the agent gets published to (Workshop 7).
   - **Analytics** — usage data, once it's live (Workshop 8).
5. Go to **Settings** (or the equivalent gear icon) and turn on:
   - **Generative orchestration** — this is what lets the agent pick tools
     based on their descriptions instead of a fixed topic script. Confirm
     it's on, not just available.
   - **Web search** — the enrichment flow's research step depends on this.
   - **Moderation: High.**
6. Open the **test pane** (usually docked on the right side of every
   screen in Copilot Studio). Type something conversational — "hi, what
   can you do?" You should get a generic, reasonable reply. It won't know
   anything about CoreTrust yet; that's expected, that's Workshop 1.

**Checkpoint:** the agent exists, responds in the test pane, and
Settings shows generative orchestration + web search + high moderation
all on. If the test pane errors out entirely, stop and check the
Prerequisites checklist again before continuing — something upstream
(licensing, environment) is usually the cause.

---

## Workshop 1 — Instructions and Knowledge (30-45 min)

**Outcome:** the agent can answer a question about Fit v3 or the
qualification process, citing the uploaded documents, using its own words
(not yet reading the live workbook — that's Workshop 2-3).

1. Open `agent/CoreTrust_LeadGen_Agent_Instructions_v3.md` in this repo.
   Copy the whole thing (it's already paste-ready — no reformatting
   needed) into the agent's **Instructions** field. Save.
2. Go to **Knowledge > Add knowledge > Upload files**, and upload:
   - `agent/CoreTrust_Enrichment_Prompts_v2.md`
   - `docs/CoreTrust_Fit_v3_Scoring_Methodology.md`
   - `docs/CoreTrust_Master_AIAgent_Build_Guide.md`
   Wait for each to finish indexing (a status column shows this) before
   testing.
3. In the test pane, ask three questions in order:
   - "What is Fit v3?" — should get the 30/30/15/15/10 breakdown, in the
     agent's own words, roughly matching the methodology doc.
   - "What does BANTC stand for and when does a lead trigger an SME
     meeting?" — should describe Budget/Authority/Need/Timeline/Category
     and the "3 of 4 plus Budget and Authority" gate. (If this answer is
     vague or wrong, the Instructions paste in step 1 may have been
     truncated — check the field's character count against the source
     file.)
   - "Who is excluded from scoring?" — should list K-12, non-US, PE/VC,
     transportation, no-signal.

**Checkpoint:** all three answers are substantively correct and the agent
cites or clearly draws from the uploaded documents (Copilot Studio
typically shows a small citation/source indicator under grounded answers
— if answers look generic instead of specific to these docs, re-check
that Knowledge indexing actually finished).

---

## Workshop 2 — Connecting the workbook (30 min)

**Outcome:** you understand why every Excel interaction goes through a
flow, and your Excel Online (Business) connection is ready for Workshop 3.

1. Re-read "The one rule that makes this reliable" at the top of
   `Copilot_Studio_Flow_Build_Guide.md` if you haven't already — this
   workshop exists to make sure that rule is intuitive before you start
   building, not just a warning you skimmed past.
2. Open `CoreTrust_Master_Members.xlsx` in desktop Excel (from its OneDrive
   sync path). Click inside the MASTER MEMBERS data, check the **Table
   Design** tab (appears when a cell inside a table is selected), and
   confirm the **Table Name** field reads exactly `MasterTable`. Repeat for
   TOUCHPOINTS (`TouchTable`), CADENCE (`CadenceTable`), SME ROUTING
   (`SMERoutingTable`), and SME HANDOFF (`SMEHandoffTable`). `scripts/
   fitv3_pipeline.py` already builds them this way — this step is just
   confirming nothing got renamed or re-saved into a plain range along the
   way.
3. Go to `make.powerautomate.com` > **Data > Connections > + New
   connection**, search **Excel Online (Business)**, and sign in once with
   the same account that owns the OneDrive file. This connection gets
   reused by every flow from here on — you only authenticate once.
4. While you're there, add connections for **Office 365 Outlook** and
   **OneDrive for Business** too, so Workshop 3 onward never stalls on a
   sign-in prompt mid-build.

**Checkpoint:** all five table names verified, all three connections show
"Connected" (not "Sign in required") in Power Automate's Connections list.

---

## Workshop 3 — Your first tool: Get Today List (45-60 min)

**Outcome:** the agent can answer "who should I call today" by actually
reading the live workbook — the first real tool, end to end.

1. In Copilot Studio, go to **Tools > + Add a tool > New flow**. This
   opens Power Automate with the **When an Agent calls the flow** trigger
   already added — if instead you land on a blank canvas asking you to
   pick any trigger, you started from Power Automate's own **+ New flow**
   button instead; go back and use the Tools pane's entry point (see the
   Gotchas table in the flow guide, "flow started blank").
2. Build the flow using **Flow 1 -- Get Today List** in
   `Copilot_Studio_Flow_Build_Guide.md` as your exact card-by-card
   reference. Don't skip the `Respond to the agent` card at the end — a
   flow with no response card is invisible to the agent even if it runs
   successfully.
3. Save the flow, then go back to Copilot Studio's Tools pane. The tool
   should now appear (sometimes needs a refresh). Click it, and replace
   the auto-generated name/description with the sharp version given in
   the flow guide's "Tool description to paste into the agent's Tools
   pane" callout — this is the single most important sentence in the
   whole build, since generative orchestration routes almost entirely on
   this text.
4. Test: "who should I call today?" Confirm you get back real company
   names from the workbook, ranked, Tier A first.

**Break-it-to-learn-it exercise (5 min, optional but recommended):**
temporarily rename `MasterTable` back to something else in Excel (e.g.
`Table99`), save, and ask the agent the same question again. Watch it
fail or say something unhelpful. Rename it back to `MasterTable`, save,
and confirm the agent recovers on the next try. This is the "table
dropdown empty" gotcha from the flow guide, deliberately reproduced so you
recognize it instantly if it happens for real later.

**Checkpoint:** the agent's answer to "who should I call today" contains
real company names and real Fit v3 scores from the live file, and you've
seen (and recovered from) the table-naming failure mode at least once.

---

## Workshop 4 — Build the remaining five flows

**Outcome:** all six flows exist as tools, each individually tested.

This is the long workshop — budget a half day, or split it across two or
three sessions using the checkpoints below as natural stopping points.
Build in this order (matches the flow guide's own testing order, each one
depends conceptually on the last):

| Order | Flow | Reference section | Time estimate | Depends on |
|---|---|---|---|---|
| 1 | Get Today List | done in Workshop 3 | — | — |
| 2 | Draft Email | `Copilot_Studio_Flow_Build_Guide.md` Flow 3 | 45-60 min | Outlook connection (Workshop 2) |
| 3 | Log Touch | Flow 2 | 30-45 min | none new |
| 4 | Save Qualification (+ BANTC/SME extension) | Flow 4 | 60-90 min | SME ROUTING / SME HANDOFF tables (already built by the pipeline) |
| 5 | Export For Salesforce | Flow 5 | 45 min | OneDrive connection |
| 6 | Nightly Enrichment | Flow 6 | 45-60 min | Web search on (Workshop 0) |

For each flow:

1. Build every card per the flow guide's table for that flow.
2. Write the tool description from the flow guide's callout, verbatim or
   close to it — don't paraphrase it into something vaguer.
3. Run the flow's own **checkpoint test** below before moving to the next
   flow. Testing incrementally here is much faster than building all six
   and debugging them together at the end.

**Per-flow checkpoints:**

- **Draft Email:** ask the agent to draft an email to a specific
  Tier A company. Confirm: (a) it lands in Outlook Drafts, not Sent; (b)
  subject is lowercase, 3-5 words; (c) body is 75-100 words and ends with
  a clear next step; (d) a TOUCHPOINTS row appeared or updated for that
  lead (Draft Email chains into Log Touch automatically per the guide's
  step 7).
- **Log Touch, standalone:** log a touch for a lead *not* already on
  TOUCHPOINTS. Confirm a new row appeared with `Cadence_Step`=1 and the
  four formula columns (`Days_Since_Last` etc.) show real values once you
  open the file in Excel (they won't show cached values through the flow
  test pane alone — that's expected, see the root README's "First open"
  note).
- **Save Qualification:** run it once with markers that should *not*
  clear the BANTC gate (e.g. no confirmed spend, generic title) and once
  with markers that *should* (confirmed spend ≥$1M, a VP+ title with a
  verified email, a pain-signal marker, a near-term contract renewal).
  Confirm the first stays `In Progress` and the second produces a new row
  on SME HANDOFF, routed to the right SME (Rod Andrews for Logistics is
  the only category that will route correctly today — Material Handling
  has no scored leads yet, per the BANTC section of the root README).
- **Export For Salesforce:** mark one test lead `Qualified`=Yes, run the
  export, confirm a CSV lands in the OneDrive `/CoreTrust Lead Gen/
  Exports` folder with the right headers (compare against
  `data/CoreTrust_SFDC_Import_Leads_sample.csv`).
- **Nightly Enrichment:** don't wait for the Recurrence trigger — open
  the flow in Power Automate and use **Run > Test > Manually** to fire it
  once immediately. Confirm it processes New/Enriching rows and doesn't
  touch any green computed column (spot-check a row's `Fit_v3_Score`
  before and after — it must be identical).

**Checkpoint (end of workshop):** all six tools listed under Copilot
Studio's Tools pane, each with its sharp description, each individually
tested per the table above.

---

## Workshop 5 — Multi-tool orchestration and prompt tuning (30-45 min)

**Outcome:** the agent correctly chains and chooses between all six tools
in a single conversation, not just one at a time in isolation.

1. Start a *fresh* test pane conversation (clear history) and run this
   sequence without restarting between messages:
   - "Who should I call today?"
   - "Draft an email to the first one." (should resolve "the first one"
     from the prior message's context and correctly call Draft Email with
     that specific `Lead_ID`)
   - "I just qualified them — they've got an optimized TMS, spend
     confirmed at $2M, contract renews in 4 months, and I was talking to
     their VP of Supply Chain." (should call Save Qualification with
     inferred marker values, not ask you to repeat the Lead_ID if it's
     still in context)
   - "Who do I need to follow up with?" (should call Log Touch's sibling
     read — actually the follow-up prompt from Enrichment Prompts v2 #5 —
     confirm it reads TOUCHPOINTS correctly)
2. If any step calls the wrong tool, or asks for information it should
   already have from context, the fix is almost always the tool
   *description*, not the flow itself. Open the misrouted tool's
   description and make it more specific about exactly when to use it and
   when not to (the flow guide's "sharp tool description" principle).
   Re-test after every edit — small wording changes can meaningfully shift
   routing.
3. **Deliberate misrouting exercise:** temporarily edit the Export For
   Salesforce tool's description to something vague like "handles
   exports." Ask "export my qualified leads" and separately "can you
   export today's call list" — watch whether the agent now hesitates or
   picks the wrong tool for the second question. Restore the original
   sharp description and confirm both questions route correctly again.
   This is the fastest way to *feel* why description quality matters more
   than almost anything else in this build.

**Checkpoint:** the four-message sequence in step 1 completes without you
having to repeat the Lead_ID or re-explain what you want, and you've seen
at least one real misrouting-then-fix cycle.

---

## Workshop 6 — End-to-end QA (formal sign-off)

**Outcome:** a completed test log you'd be comfortable showing someone
else as evidence the agent works, before the pilot (Phase 1 of
`docs/CoreTrust_POC_Implementation_Timeline.md`) actually starts.

Run every row below. Keep a copy of this table (a Notes column in
`POC SCORECARD`, or a separate note) with the date and pass/fail for each
— thirty seconds of record-keeping now saves a lot of "wait, did we test
that" later.

| # | Test | Pass criteria |
|---|---|---|
| 1 | Ask about 5 different members (mix of Tier A, B, C, and one excluded account). | Each answer follows the five-line format from the agent instructions; the excluded account is correctly identified as excluded, with a reason. |
| 2 | Point the agent at 10 `New` rows and ask it to enrich them. | Contacts get added with cited sources where found; unverifiable fields stay blank; no green column (`Fit_v3_Score`, `Fit_Tier`, etc.) changes. |
| 3 | Ask it to draft 3 emails to different titles (e.g. a VP Supply Chain, a Director of Logistics, a CFO). | Each is written to the title, personable to the industry, ends with a clear next step, lands in Outlook unsent, and logs a touch. |
| 4 | Ask "who do I need to follow up with?" | Returns accounts flagged FOLLOW UP or OVERDUE on TOUCHPOINTS, ordered by tier then spend bucket. |
| 5 | Qualify one lead all the way through BANTC to "Qualified - Ready for SME." | A row appears on SME HANDOFF, `SME_Name` populated from SME ROUTING, `Meeting_Status`="Requested". |
| 6 | Run the Salesforce export. | CSV headers match the sample file exactly; `Last Name` fallback to "Unknown" works for a blank-name test row; `Rating` maps A→Hot, B→Warm, C/D→Cold. |
| 7 | Fire Nightly Enrichment manually once. | Runs without error against the current New/Enriching backlog; a spot-checked row's Fit v3 score is unchanged before/after. |
| 8 | Ask a question about a K-12, non-US, PE/VC, and transportation-company record (one of each). | Each is correctly declined with the specific exclusion reason, never scored or pitched. |

**Checkpoint:** all 8 rows pass. If any fail, fix and re-run *that row
only* before moving on — don't re-run the whole table for one fix, it
wastes time and this table is designed to isolate failures per-flow
already.

---

## Workshop 7 — Publish and deploy to Teams (30 min)

**Outcome:** the rep can talk to the agent from Teams, not just the
Copilot Studio test pane.

1. Click **Publish** (top right of Copilot Studio). This locks in the
   current Instructions, Knowledge, Tools, and their descriptions as the
   live version — any further edits you make afterward stay in draft
   until you publish again.
2. Go to **Channels > Microsoft Teams + Microsoft 365**, turn it on. This
   is covered by existing M365 licensing (the standard-harness decision
   from the project's own build guide, section 5.1) — no additional
   per-seat cost for this channel.
3. Decide availability: for a one-person pilot, "just me" / a specific
   user list is simplest. Widen it only when you're ready for more than
   one rep to use it.
4. Open Teams, find the agent (usually under Apps, or pinned directly if
   you added it to your own sidebar), and re-run a couple of the
   Workshop 6 tests there — the test pane and the real Teams surface can
   behave slightly differently (message length limits, card rendering),
   worth catching before the pilot's Day 1.

**Alternative / lighter path:** if you don't have a Copilot Studio license
yet but do have M365 Copilot, `docs/CoreTrust_Master_AIAgent_Build_Guide.md`
section 7 covers the M365 Copilot agent builder — a declarative agent that
can score, rank, and draft from an uploaded (filtered Tier A/B) copy of the
file, but can't write back to Excel or Outlook. Useful as a bridge while
you sort out full Copilot Studio access; not a substitute for it, since
Log Touch / Save Qualification / Export all need write access.

**Checkpoint:** the agent responds correctly in Teams to at least the
"who should I call today" and "draft an email to X" tests from earlier
workshops.

---

## Workshop 8 — Operate, monitor, and iterate (ongoing, not one-time)

**Outcome:** you know how to tell whether the agent is actually working
well in production, and how to safely change it once it is.

1. **Analytics tab** (Copilot Studio left nav): check session count,
   resolution rate, and escalation rate weekly, alongside the
   `KPI DASHBOARD` and `POC SCORECARD` review already in the root
   README's weekly cadence table. A rising escalation rate with no change
   in volume is usually a routing regression — go back to Workshop 5's
   technique before assuming it's a data problem.
2. **Read transcripts**, not just the aggregate numbers, at least once a
   week during the pilot. The aggregate rate tells you *that* something's
   wrong; the transcript tells you *what*. Look specifically for: the
   agent asking for information it should already have, calling a tool
   that clearly wasn't the right one, or giving an answer that contradicts
   a hard rule (never guessing an email, never sending instead of
   drafting).
3. **Editing a live flow safely:** open the flow in Power Automate, make
   your change, and use its own **Test** pane to run it in isolation
   *before* it affects the live agent — a flow edit takes effect
   immediately on save, there's no separate "publish" step for flows the
   way there is for the agent's Instructions/Tools. For a flow already in
   active daily use, consider testing the edit against a duplicate flow
   first, then swapping the tool over, if the change is non-trivial.
4. **Editing Instructions or tool descriptions:** make the change, test in
   the (unpublished) test pane against a few of Workshop 6's rows, *then*
   publish. Never edit directly against the published/live version's
   expectations without a re-test — small wording changes can shift
   routing in ways that are obvious in hindsight and easy to miss without
   testing.
5. **Back up before a big change.** Copilot Studio agents can be exported
   as a solution (Settings > Advanced, or via the maker portal's Solutions
   area) — worth doing before any change bigger than a one-line
   description edit, the same instinct as committing to git before a risky
   refactor.

This workshop doesn't end — fold it into the weekly cadence already
described in the root `README.md` and revisit it at the Phase 5 mid-pilot
checkpoint in `docs/CoreTrust_POC_Implementation_Timeline.md`.

---

## Running this as a team workshop

Everything above is written for one person working through it solo. If
you're instead introducing this to other reps, IT, or a category SME as a
group session, here's the same content mapped to a facilitator agenda.

**Group size:** works best with 2-6 people who each have (or share) Maker
access to the same Power Platform environment. More than that, split into
build pairs and have each pair own a subset of the six flows in Workshop 4.

**Prerequisites for a group session:** every attendee needs the
Prerequisites checklist satisfied *individually*, or you need a shared
sandbox environment set up in advance — don't discover a licensing gap
mid-workshop with a room full of people.

**Suggested full-day agenda:**

| Time | Workshop | Notes |
|---|---|---|
| 9:00 - 9:30 | Part 0 + Part 1 (orientation, prerequisites check) | Do this as a group walkthrough, not silent reading — the vocabulary table is the thing people ask about later if skipped. |
| 9:30 - 10:15 | Workshop 0 | Everyone builds their own test agent in parallel. |
| 10:15 - 11:00 | Workshop 1 | |
| 11:00 - 11:15 | Break | |
| 11:15 - 12:00 | Workshop 2 + Workshop 3 | This is the "aha" moment workshop — protect the time for it, don't compress it. |
| 12:00 - 1:00 | Lunch | |
| 1:00 - 3:30 | Workshop 4 | The long one. If working in pairs, have each pair present their flow's checkpoint test to the room before moving on — catches mistakes faster than solo debugging. |
| 3:30 - 4:00 | Workshop 5 | |
| 4:00 - 4:30 | Workshop 6 | Assign the 8-row test table across the room, everyone reports pass/fail. |
| 4:30 - 5:00 | Workshop 7 + wrap-up | Publish one agreed-upon agent (not everyone's individual test build) to Teams for the actual pilot. |

**Half-day version:** compress by having the facilitator build Workshops
0-3 live in front of the room (15-20 min demo instead of hands-on), then
let attendees do Workshop 4 hands-on in pairs for the remaining time.
Workshops 5-8 become a follow-up session once the pilot is actually
running, since they depend on having real usage to look at.

**Materials to have open/printed:** this guide, `Copilot_Studio_Flow_
Build_Guide.md`, `CoreTrust_LeadGen_Agent_Instructions_v3.md`, and a
shared link to `CoreTrust_Master_Members.xlsx` in OneDrive so everyone's
pointing at the same live data rather than working from stale copies.

---

## Appendix A — Full glossary

See "The vocabulary you need before anything else makes sense" in Part 0
for the core terms. A few more that come up mid-build:

| Term | Plain definition |
|---|---|
| **Generative answers** | The older, knowledge-only response mode (no tool-calling). We use generative *orchestration* instead, which is the superset that also picks tools. |
| **Trigger (flow)** | What starts a flow running. Ours are almost all "When an Agent calls the flow"; Nightly Enrichment is the one exception (Recurrence). |
| **Respond to the agent** | The card that ends every agent-callable flow and returns data back to the conversation. Miss this and the flow runs but the agent never sees the result. |
| **Structured reference** (Excel) | The `TableName[ColumnName]` syntax (e.g. `MasterTable[Fit_Tier]`) used in formulas and in flow filter queries — only works because the ranges are real named Excel Tables, which is exactly why Workshop 2 makes you verify the table names first. |
| **DLP policy** | Data Loss Prevention — a tenant-level rule about which connectors can be used together in one flow. Usually invisible until it blocks something; see Prerequisites. |
| **Solution** (Power Platform) | A packaged, exportable/importable bundle of an agent, its flows, and their dependencies — the backup/versioning mechanism referenced in Workshop 8. |

## Appendix B — Where each repo file fits in this workshop sequence

| File | First used in |
|---|---|
| `CoreTrust_LeadGen_Agent_Instructions_v3.md` | Workshop 1 |
| `CoreTrust_Enrichment_Prompts_v2.md` | Workshop 1 (Knowledge), then referenced throughout testing |
| `Copilot_Studio_Flow_Build_Guide.md` | Workshop 3 onward, every flow |
| `../data/CoreTrust_Master_Members.xlsx` | Workshop 2 onward |
| `../data/CoreTrust_SFDC_Import_Leads_sample.csv` | Workshop 4 (Export flow's checkpoint) |
| `../scripts/save_qualification.py` | Reference for Workshop 4's BANTC compose-expression logic — the flow's `Compose` step and this script's Python functions should agree; if you change one, change the other. |
| `../docs/CoreTrust_Fit_v3_Scoring_Methodology.md` | Prerequisites reading, Workshop 1 (Knowledge) |
| `../docs/CoreTrust_POC_Implementation_Timeline.md` | Sets the calendar this whole guide's Workshop 0-8 sequence fills Phase 1 of |
| `../README.md` | Weekly cadence (Workshop 8 ongoing), OneDrive setup (Prerequisites) |

## Appendix C — Common errors, and where the fix lives

This guide deliberately doesn't repeat the gotchas table — it's already in
`Copilot_Studio_Flow_Build_Guide.md` under "Gotchas (from the field, keep
this list next to you while building)" and duplicating it here would just
create two copies to keep in sync. If something breaks mid-workshop, that
table is the first place to check; this guide's break-it-to-learn-it
exercises in Workshops 3 and 5 are deliberately drawn from the two most
common entries in it.
