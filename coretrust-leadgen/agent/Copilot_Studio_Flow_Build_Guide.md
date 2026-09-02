# CoreTrust Lead Gen, Copilot Studio Flow Build Guide

Card-by-card build steps for the six Power Automate flows the CoreTrust Lead
Gen Copilot agent calls as tools. The handoff document specifies *what* each
flow does; this document is *how* to build it, one action at a time, against
the real column names in `data/CoreTrust_Master_Members.xlsx`.

Read this after `CoreTrust_Master_AIAgent_Build_Guide.md` section 2 (agent
setup) and before pasting `CoreTrust_LeadGen_Agent_Instructions_v3.md` into
the agent's Instructions field -- the instructions reference these flows by
name.

## The one rule that makes this reliable

**Never let the agent call raw Excel actions directly.** It fails
intermittently and the agent has no good way to recover. Every flow below
wraps its Excel Online (Business) actions inside a Power Automate flow, and
the *flow* is the only thing the agent ever touches, through one clean
"tool" with a sharp description. Tool descriptions are routing logic for
generative orchestration, not documentation -- write them the way you'd
brief a new hire on when to reach for this specific tool and nothing else.

## Before you build any flow

1. Put `CoreTrust_Master_Members.xlsx` in OneDrive or SharePoint (see the
   root `README.md`, "Where the file lives"). Every flow points at that one
   file and never a local copy.
2. Confirm the three tables exist and are named exactly `MasterTable`,
   `TouchTable`, `CadenceTable` -- open the file, click inside each range,
   check the Table Design tab. `scripts/fitv3_pipeline.py` already builds
   them with the right names; if the table-picker in a flow shows nothing,
   this is the first thing to check (see Gotchas below).
3. In Power Automate (make.powerautomate.com), confirm you can see
   **Excel Online (Business)**, **Office 365 Outlook**, and **SharePoint**
   connectors under your account -- all three ship with standard M365
   licensing, no premium connector needed for this build.

## Shared card settings, every flow

- **Trigger:** *When an Agent calls the flow* (Copilot Studio trigger type),
  picked from **New flow > Automation > when an agent calls the flow**
  inside Copilot Studio's own flow authoring surface, or via
  make.powerautomate.com > **New > Automation > Build with Copilot** template
  gallery. Do not start from a blank **New flow** -- see Gotchas.
- **Inputs:** declared on the trigger card, one per parameter the agent
  should pass. Give each a plain-English name and description; Copilot
  Studio surfaces these to the model when it decides how to call the tool.
- **Last card:** *Respond to the agent* (Copilot Studio's response action),
  one output per value the agent needs back.
- **Asynchronous response:** Off, on the trigger card -- keeps the flow
  inside the 100-second turn limit the agent enforces.
- After saving, go to the agent's **Tools** pane, add the flow, and replace
  the auto-generated name/description with the sharp version given below.

---

## Flow 1 -- Get Today List

**Trigger:** When an agent calls the flow. No inputs required (optionally
accept `Rep_Name` and `Max_Results`, default 5).

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **List rows present in a table** | File: the master workbook. Table: `MasterTable`. Filter Query: `Freight_Relevant eq 'Yes' and (Record_Status eq 'Ready to Call' or Record_Status eq 'In Cadence')`. |
| 2 | **Filter array** | From step 1, keep rows where `Fit_Tier` is `A` or `Fit_Tier` is `B`. |
| 3 | **Sort** (Power Automate variable / `orderBy` expression, or a second Filter + Compose sorting by score descending) | Sort the filtered array by `Fit_v3_Score`, descending. |
| 4 | **Compose** | `take(sort(body('Filter_array'), item, desc, 'Fit_v3_Score'), triggerBody()?['Max_Results'])` -- or simpler, `first(N)` via a slice expression if Sort isn't available as a native action in your tenant. |
| 5 | **Respond to the agent** | Output `Today_List` = the composed array (Company_Name, Lead_ID, Fit_v3_Score, Fit_Tier, Contact_Email, Suggested_Supplier per row). |

**Tool description to paste into the agent's Tools pane:**
> "Use this to get the rep's ranked call list for today. Returns the top
> Freight_Relevant='Yes' accounts in Record_Status Ready to Call or In
> Cadence, Tier A then B, sorted by Fit_v3_Score. Call this when the rep
> asks who to call, what's next, or for today's list."

---

## Flow 2 -- Log Touch

**Trigger:** When an agent calls the flow. Inputs: `Lead_ID` (required),
`Channel` (Email/Call/LinkedIn), `Outcome` (contacted/replied/meeting/
disqualified), `Reply_Received` (yes/no, optional), `Meeting_Booked`
(yes/no, optional).

This is the read-then-update-or-add pattern from
`CoreTrust_Enrichment_Prompts_v2.md` Prompt 4, as a flow:

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **List rows present in a table** | Table: `TouchTable`. Filter Query: `Lead_ID eq '@{triggerBody()?['Lead_ID']}'`. |
| 2 | **Condition** | `length(body('List_rows'))` is greater than `0`. |
| 3a | **If yes** -- Excel Online (Business) -- **Update a row** | Table: `TouchTable`. Key Column: `Lead_ID`, Key Value: the input. Set `Total_Touches` = `add(outputs('List_rows')?[0]?['Total_Touches'], 1)`; increment the matching channel column (`Emails_Sent`/`Calls_Made`/`LinkedIn_Touches`) the same way; set `Last_Touch_Date` = `utcNow('yyyy-MM-dd')`; `Last_Touch_Channel` = the Channel input; `Cadence_Step` = `min(add(current step, 1), 8)`; `Reply_Received`/`Meeting_Booked`/`Outcome` from inputs when provided. **Do not touch** `Days_Since_Last`, `Next_Touch_Due`, `Follow_Up_Flag`, `SLA_Status` -- those are live formulas on the sheet, writing to them through the connector overwrites the formula with a static value. |
| 3b | **If no** -- Excel Online (Business) -- **Get a row** | Table: `MasterTable`, Key Column `Lead_ID`, to pull Company_Name/Contact_First/Contact_Last/Contact_Title/Contact_Email/Fit_Tier/Priority/Spend_Bucket/Suggested_Supplier. |
| 3b.2 | Excel Online (Business) -- **Add a row into a table** | Table: `TouchTable`. Map every non-formula column from the values in 3b plus `Cadence_Step`=1, `Total_Touches`=1, the matching channel column=1, `Last_Touch_Date`=today, `Last_Touch_Channel`=input, `Outcome`="contacted", `Cadence_Status`="Active". Leave `Days_Since_Last`/`Next_Touch_Due`/`Follow_Up_Flag`/`SLA_Status` **blank** -- Excel Online's Add a row does not carry formulas into a new row automatically; either leave them for the next person to open the file in Excel (which recalculates on open) or run `scripts/log_touch.py` locally once to backfill the formula strings for that row (it writes the exact same four formulas the pipeline uses). |
| 4 | Excel Online (Business) -- **Update a row**, `MasterTable` | Set `Record_Status` = "In Cadence" (only if it was Ready to Call/New/Enriching), `Updated_By` = "AI Agent", `Last_Updated` = today. |
| 5 | **Respond to the agent** | Output `Logged` = true, `Total_Touches`, `Cadence_Step`. |

**Tool description:**
> "Use this immediately after drafting an email, making a call, or sending
> a LinkedIn message. Records the touch on the TOUCHPOINTS tab -- adds the
> account if it isn't tracked yet, otherwise increments its touch counters
> and advances the cadence step. Always call this after Draft Email, never
> skip it."

---

## Flow 3 -- Draft Email

**Trigger:** When an agent calls the flow. Input: `Lead_ID` (required).

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **Get a row** | Table: `MasterTable`, Key Column `Lead_ID`. |
| 2 | **Condition** | `Exclusion_Reason` is blank. If not blank, skip to a Respond card that returns `Excluded: true, Reason: <Exclusion_Reason>` and stop -- never draft an email to an excluded account. |
| 3 | AI Builder -- **Run a prompt** (or Copilot Studio's own **Create text with GPT** action if AI Builder isn't licensed) | Prompt, built from Enrichment Prompts v2 #4: *"Write a first-touch email to {Contact_First} at {Company_Name}. Write to {Contact_Title}; lead with what that role cares about. Personable to {Industry}, reference what they move using {Service_Fit}. Mention pre-negotiated {Suggested_Supplier} pricing as a CoreTrust member. Subject lowercase 3-5 words, company or savings in it. Body 75-100 words. End with a clear next step: propose a short meeting or ask an open ended question. Never end flat. Output as JSON: {\"subject\": ..., \"body\": ...}."* Map every `{...}` token to the row's column from step 1. |
| 4 | **Parse JSON** | Schema: `{"subject": "string", "body": "string"}`, on the AI action's output text. |
| 5 | Office 365 Outlook -- **Create draft** | To: `Contact_Email`. Subject: parsed `subject`. Body: parsed `body`. **Never** use Send an email -- Create draft only, per the agent's hard rule. |
| 6 | **Respond to the agent** | Output `Drafted: true`, `Subject`, `Draft_Id`. Tell the agent in its own reply to the rep to call Log Touch next -- or better, chain step 7 below so the agent doesn't have to remember. |
| 7 (recommended) | Call the **Log Touch** flow (Flow 2) from inside this flow, Channel="Email", Outcome="contacted" | Folding the log-touch call into Draft Email means the agent can't forget it, and matches "Then update TOUCHPOINTS" being one inseparable step in the agent instructions. |

**Tool description:**
> "Use this to write a first-touch or follow-up outreach email for one
> account and place it as an Outlook draft (never sent). Requires Lead_ID.
> Automatically logs the touch. Refuses excluded accounts (K-12, non-US,
> PE/VC, transportation, no-signal) and tells you why."

---

## Flow 4 -- Save Qualification

**Trigger:** When an agent calls the flow. Inputs: `Lead_ID`, and the five
markers from a call -- `TMS_In_Use`, `Under_Contract`/`Contract_Status`,
`Capacity_Source`, `Private_Fleet`, `Lane_Data_Available`, plus
`Confirmed_Freight_Spend` when the rep has it.

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **Update a row** | Table: `MasterTable`, Key `Lead_ID`. Write only the marker columns passed in (skip any input left blank -- don't overwrite a known value with empty). |
| 2 | **Condition -- the discipline gate** | At least three of the five markers are non-blank AND `Private_Fleet` is not "Yes" (a private-fleet account is a backhaul conversation, not a standard qualification -- flag it instead of auto-qualifying). |
| 3a | **If yes** -- Excel Online (Business) -- **Update a row** | `Qualified` = "Yes", `Record_Status` = "Qualified". |
| 3b | **If no** -- nothing further; the row stays in cadence. |
| 4 | Excel Online (Business) -- **Update a row** | `Updated_By` = "AI Agent", `Last_Updated` = today, on every call regardless of the gate result. |
| 5 | **Respond to the agent** | `Qualified` (true/false), `Markers_Set` (count), and which markers are still missing so the agent can tell the rep what's left. |

**Tool description:**
> "Use this after a qualification call to save the five markers (TMS in
> use, contract status, capacity source, private fleet, lane data
> available) and, when at least three are answered and it isn't a private
> fleet account, mark the lead Qualified. Never sets Qualified on its own
> guess -- only from what the rep reports."

---

## Flow 5 -- Export For Salesforce

**Trigger:** When an agent calls the flow. No required inputs (optionally
`Tier_Filter`, default "A,B").

Produces the exact column set `data/CoreTrust_SFDC_Import_Leads_sample.csv`
already shows, for the Data Import Wizard.

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **List rows present in a table** | Table: `MasterTable`. Filter Query: `Qualified eq 'Yes'`. |
| 2 | **Apply to each** row from step 1, **Compose** | Build one object per row with the Salesforce Lead terminology headers: `Company`=Company_Name, `First Name`=Contact_First, `Last Name`=Contact_Last (fallback "Unknown" if blank -- Last Name is required by the Wizard), `Title`=Contact_Title, `Email`=Contact_Email, `Phone`=Contact_Phone, `Website`=Website, `Industry`=Industry, `State/Province`=HQ_State, `Country`="United States", `Lead Source`="CoreTrust Lead Gen", `No. of Employees`=Employees, `Annual Revenue`=Annual_Revenue, `Rating`= map Fit_Tier A→"Hot" B→"Warm" C/D→"Cold", `Description`=concat("Fit v3 ", Fit_v3_Score, " \| Tier ", Fit_Tier, " \| Est freight ", Est_Freight_Spend, " \| ", Suggested_Supplier, " \| Service: ", Service_Fit), `Freight Spend`=Est_Freight_Spend, `Lead Tier`=Fit_Tier, `Fit Score`=Fit_v3_Score, `Preferred Partner`=Suggested_Supplier, `PE Sponsor`=PE_Sponsor. |
| 3 | **Create CSV table** | From the array of composed objects, `From`=`outputs('Apply_to_each')`, with headers. |
| 4 | SharePoint -- **Create file** | Site: your team site. Folder: `/CoreTrust Lead Gen/Exports`. File Name: `CoreTrust_SFDC_Import_@{utcNow('yyyy-MM-dd')}.csv`. File Content: the CSV table output. |
| 5 | **Respond to the agent** | `File_Url` (the SharePoint link), `Row_Count`. |

**Tool description:**
> "Use this when the rep asks to export qualified leads for Salesforce.
> Builds a Data Import Wizard-ready CSV of every Qualified='Yes' account
> and saves it to SharePoint, returns the link. Note the load date so the
> rep doesn't import the same file twice -- Salesforce isn't connected
> yet, this is the file-based bridge until the connector is approved."

---

## Flow 6 -- Nightly Enrichment

**Trigger:** Recurrence, once daily (e.g. 2:00 AM local), not "When an agent
calls the flow" -- this is the only one of the six the agent doesn't call
directly; it runs itself and grows the callable pool overnight.

| # | Action | Configuration |
|---|--------|----------------|
| 1 | Excel Online (Business) -- **List rows present in a table** | Table: `MasterTable`. Filter Query: `Record_Status eq 'New' or Record_Status eq 'Enriching'`, and `Freight_Relevant eq 'Yes'`. |
| 2 | **Apply to each** row (cap the batch, e.g. `take(..., 25)`, so the flow stays inside run limits) | |
| 3 | AI Builder / **Create text with GPT** | Prompt from Enrichment Prompts v2 #3, company + contact research: logistics decision maker (name, title, LinkedIn, email only if published/clear pattern), firmographics confirmation, freight signals (private fleet + DOT, carriers, DCs, import/export), ownership (PE sponsor + source). Web search must be turned on for the agent/connection this action uses. |
| 4 | **Parse JSON** the model's structured output (contact fields, PE_Sponsor, freight signals, sources). | |
| 5 | **Condition** | A verified email was found. |
| 6a | **If yes** -- Excel Online (Business) -- **Update a row** | Write `Contact_First/Last/Title/Email`, `PE_Sponsor`, `Est_Freight_Spend` (only if evidenced), `Private_Fleet`/`Capacity_Source` (only if evidenced), `Record_Status`="Ready to Call", `Updated_By`="AI Agent", `Last_Updated`=today, `Notes`= sources cited. **Never write to** `Fit_v3_Score`, `Fit_Tier`, `Freight_Opportunity`, `Engrainment`, `Freight_Intensity`, `Actionability`, `Warmth`, `Priority`, `Service_Fit`, `Spend_Bucket`, `Suggested_Supplier` -- those are the green computed columns; they only change when `scripts/fitv3_pipeline.py` is re-run against the refreshed data, or via the same recompute this flow can trigger in step 7. |
| 6b | **If no** -- Excel Online (Business) -- **Update a row** | `Record_Status`="Enriching" (keep trying next run), `Notes`= what was tried, `Updated_By`/`Last_Updated`. |
| 7 (optional, needs a premium HTTP/Automate-to-script bridge) | Trigger a re-run of `scripts/fitv3_pipeline.py --merge-only` (see root README, "Rescoring after enrichment") so `Fit_v3_Score`/`Fit_Tier` catch up with the new contacts on the next open. Without this step, enriched rows stay accurate on every input column but keep their pre-enrichment score until the next manual pipeline run. | |
| 8 | (no Respond card needed -- Recurrence-triggered flows don't return to an agent) | |

**Why this one isn't a tool:** the agent instructions call this "the
engine that grows the callable pool" precisely because it runs unattended.
Exposing it as an agent tool as well is harmless but rarely useful --
nightly enrichment already touches every New/Enriching row without being
asked.

---

## Gotchas (from the field, keep this list next to you while building)

| Symptom | Real cause and fix |
|---|---|
| Agent picks the wrong tool, or none | Weak tool description. Rewrite it to say exactly when to use the tool and nothing else -- descriptions are routing logic. |
| Flow test pane says "failed" but the row is actually written | A test-pane reporting quirk with Excel Online. Open the file; if the row is there, it worked. Trust the file over the test pane. |
| Table dropdown in the flow action is empty | The range isn't a *named Excel Table* (a ListObject), just a formatted range. Select the range, Insert > Table, name it exactly `MasterTable`/`TouchTable`/`CadenceTable` in Table Design. `fitv3_pipeline.py` already does this correctly -- if you rebuild the file by hand, check Table Design, not just cell coloring. |
| Filtering on `Follow_Up_Flag` or `SLA_Status` in a Filter Query silently returns nothing | Those are Excel formula columns; the Excel Online connector's `$filter` OData query can't reliably filter on computed cells. Filter on plain input columns (`Qualified`, `Freight_Relevant`, `Record_Status`) and, if you need the formula result, pull the row with List rows and filter client-side in a **Filter array** action instead. |
| A new flow opens blank and asks you to pick a trigger from scratch | You used **+ New flow** instead of **+ New flow > Automation > when an agent calls the flow** (or the Copilot Studio Tools pane's built-in "create a flow" entry point). Add the "When an Agent calls the flow" trigger yourself and the "Respond to the agent" card at the end, or just start over from the correct entry point. |
| A field in a card won't take typed text, or takes it but the flow errors on run | It needs **dynamic content**, not a literal string -- click the field, pick the token (e.g. `Lead_ID` from the trigger, or `Contact_Email` from a prior Get a row) from the popup rather than typing the column name. |
| Enrichment writes a value but Fit_v3_Score doesn't move | Expected -- see Flow 6, step 7. The score is intentionally never written by a flow directly; it only moves when the pipeline script recomputes it, so a stray flow bug can never corrupt the number the rep is trusting. |

## Testing order (mirrors the build guide's own test plan)

1. Build and test Flow 1 alone -- ask the agent "who should I call today,"
   confirm five ranked accounts with real Fit v3 scores come back.
2. Build Flow 3, draft three emails, confirm each lands in Outlook unsent
   and (once Flow 2 exists) appends a TOUCHPOINTS row.
3. Build Flow 2 standalone, log a touch for an account already in
   TouchTable and one that isn't, confirm the increment and the add both
   work and the four formula columns still compute after you close and
   reopen the file in Excel.
4. Build Flow 4, save qualification markers for two accounts, confirm one
   crosses the three-marker gate and one doesn't.
5. Build Flow 5, export, open the CSV, run one test import into a
   Salesforce sandbox.
6. Build Flow 6 last, since it's the least urgent for a first pilot day.
   Let it run once, then check that New/Enriching rows either moved to
   Ready to Call with a cited contact or stayed in Enriching with notes on
   what was tried.
