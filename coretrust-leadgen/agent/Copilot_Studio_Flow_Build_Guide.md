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

This build also implements BANTC qualification (Budget, Authority, Need,
Timeline, Category) inside Flow 4, and the meeting trigger it fires to a
category SME -- see that flow's extended steps below and the two new tabs,
`SME ROUTING` (Category -> SME name/email, edit this as your category
structure grows) and `SME HANDOFF` (one row per BANTC-qualified lead, the
handoff log). A quality lead is not "someone who might ship freight" here;
it's a lead that cleared Fit v3 (worth calling) *and* BANTC (worth a
category SME's time) -- that's the whole point of separating the two
gates.

## Before you build any flow

1. Put `CoreTrust_Master_Members.xlsx` in OneDrive (see the root
   `README.md`, "Where the file lives" -- this build is OneDrive-only, no
   SharePoint site required). Every flow points at that one file and never
   a local copy.
2. Confirm all six tables exist and are named exactly `MasterTable`,
   `TouchTable`, `CadenceTable`, `SMERoutingTable`, `SMEHandoffTable`, and
   `LearningNotesTable` -- open the file, click inside each range, check
   the Table Design tab. `scripts/fitv3_pipeline.py` already builds them
   with the right names; if the table-picker in a flow shows nothing,
   this is the first thing to check (see Gotchas below).
3. In Power Automate (make.powerautomate.com), confirm you can see
   **Excel Online (Business)** and **Office 365 Outlook** connectors under
   your account -- both ship with standard M365 licensing, no premium
   connector needed for this build. Flow 5's export lands in OneDrive, not
   SharePoint (see that flow below) -- **OneDrive for Business** is the
   third connector to confirm.

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
| 1 | Excel Online (Business) -- **List rows present in a table** | File: the master workbook. Table: `MasterTable`. Filter Query: `Freight_Relevant eq 'Yes' and (Record_Status eq 'Ready to Call' or Record_Status eq 'In Cadence') and (Fit_Tier eq 'A' or Fit_Tier eq 'B')`. `Fit_Tier` is a plain stored value, not a live formula (unlike `Follow_Up_Flag`/`SLA_Status`), so it's safe to filter here directly -- no separate Filter array step needed just for tier. **This is a Filter Query field, which uses OData syntax, not plain English or Power Automate's own expression language:** field names must exactly match the column header including underscores (`Fit_Tier`, not `Fit Tier`), the equality operator is `eq` (not `is` or `=`), and string values need single quotes (`'A'`, not `A`). Typing anything else throws a "syntax error at position N" 400 error from the connector. |
| 2 | **Sort** (Power Automate variable / `orderBy` expression, or a Compose sorting by score descending) | Sort the rows from step 1 by `Fit_v3_Score`, descending. |
| 3 | **Compose** | `take(sort(body('List_rows_present_in_a_table'), item, desc, 'Fit_v3_Score'), triggerBody()?['Max_Results'])` -- or simpler, `first(N)` via a slice expression if Sort isn't available as a native action in your tenant. |
| 4 | **Respond to the agent** | Output `Today_List` = the composed array (Company_Name, Lead_ID, Fit_v3_Score, Fit_Tier, Contact_Email, Suggested_Supplier per row). |

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
| 3b.2 | Excel Online (Business) -- **Add a row into a table** | Table: `TouchTable`. Map every non-formula column from the values in 3b plus `Cadence_Step`=1, `Total_Touches`=1, the matching channel column=1, `Last_Touch_Date`=today, `Last_Touch_Channel`=input, `Outcome`="contacted", `Cadence_Status`="Active". Leave `Days_Since_Last`/`Next_Touch_Due`/`Follow_Up_Flag`/`SLA_Status` blank here -- the next card sets them. |
| 3b.3 | Excel Online (Business) -- **Update a row**, `TouchTable`, Key Column `Lead_ID`, Key Value the input | Set the five live-formula columns explicitly, as **structured table references** rather than a specific cell address (`Q11`, etc.) -- this is what makes it work without knowing which row Add a row just created: `Days_Since_Last` = `=IF([@Last_Touch_Date]="","",TODAY()-[@Last_Touch_Date])`; `Next_Touch_Due` = `=IF([@Last_Touch_Date]="","",[@Last_Touch_Date]+VLOOKUP([@Cadence_Step],CADENCE!$A:$B,2,FALSE))`; `Follow_Up_Flag` = `=IF([@Next_Touch_Due]="","",IF(TODAY()>=[@Next_Touch_Due],"FOLLOW UP","ok"))`; `SLA_Status` = `=IF([@Days_Since_Last]="","",IF([@Days_Since_Last]>14,"OVERDUE",IF([@Days_Since_Last]>4,"DUE SOON","ON TRACK")))`; `Nurture_Suggested` (per the SDR Playbook's retry rule -- eight touches, no reply, move to Nurture rather than delete) = `=IF(AND([@Total_Touches]>=8,[@Reply_Received]<>"Yes"),"Move to Nurture","")`. |
| 4 | Excel Online (Business) -- **Update a row**, `MasterTable` | Set `Record_Status` = "In Cadence" (only if it was Ready to Call/New/Enriching), `Updated_By` = "AI Agent", `Last_Updated` = today. |
| 5 | **Respond to the agent** | Output `Logged` = true, `Total_Touches`, `Cadence_Step`. |

**Why step 3b.3 exists, and why the formulas look different from the ones
already on the sheet:** the seed rows this repo's pipeline writes use
plain cell references (`Q11`, `T11`) because the pipeline knows the exact
row number the moment it writes the row. A flow adding a row through the
connector doesn't get a convenient row number back, and guessing wrong
would silently corrupt another row's formula. Structured references
(`[@Last_Touch_Date]`) sidestep the problem entirely -- they mean "this
row's value in that column," so the same formula text is correct no
matter which row it ends up in. Either style works in a real Excel Table;
if you're ever adding a formula to this workbook by hand, structured
references are the safer default to reach for.

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
| 5 | Excel Online (Business) -- **Get a row** | Table: `MasterTable`, Key `Lead_ID` -- re-read the row so steps 6-7 compute BANTC from what was just written, not stale values. |
| 6 | **Compose** (four expressions, one per BANT letter) | `BANT_Budget`: `Yes` if `Confirmed_Freight_Spend>0` or `Est_Freight_Spend>=1000000`, else `Unconfirmed` if `Est_Freight_Spend>0`, else blank. `BANT_Authority`: `Yes` if `Contact_Title` matches a decision-maker pattern (vp/director/chief/svp/evp/president/head of/c-suite) **and** `Contact_Email` is set, else `Unconfirmed` if a title exists, else blank. `BANT_Need`: `Yes` if `TMS_In_Use`="Manual / No TMS" or `Capacity_Source` in ("Broker/Spot","Mixed") or `Under_Contract`="No", `No` if markers are filled but show none of that, blank if no markers are filled yet. `BANT_Timeline`: `Yes` if `Contract_Status` is "None" or "Renewal <6mo", `No` if "Locked", blank otherwise. (`scripts/save_qualification.py` has these as plain Python functions if you'd rather test the logic there first.) |
| 7 | Excel Online (Business) -- **Update a row** | Write `BANT_Budget`/`BANT_Authority`/`BANT_Need`/`BANT_Timeline` from step 6, and `BANTC_Status` = "Qualified - Ready for SME" when `BANT_Budget`="Yes" and `BANT_Authority`="Yes" and at least 3 of the 4 are "Yes"; "In Progress" if any is set; "Not Started" otherwise. |
| 8 | **Condition -- the SME trigger** | `BANTC_Status` equals "Qualified - Ready for SME". This is the moment a lead becomes a category SME's problem, not just a rep's. |
| 9a | **If yes** -- Excel Online (Business) -- **List rows present in a table**, `SMERoutingTable`, filter `Category eq '@{outputs('Get_a_row')?['Category']}'` | Look up the SME name/email for this lead's category. |
| 9b | Excel Online (Business) -- **Get a row** on `MasterTable` then **Add a row into a table**, `SMEHandoffTable` | Populate every SME HANDOFF column from the master row plus the routing lookup: `Meeting_Requested_Date`=today, `Meeting_Status`="Requested". |
| 9c | Office 365 Outlook -- **Create draft** (recommended, optional) | To: the SME's email from step 9a (when it's filled in -- SME ROUTING ships with no emails, add them once you have them). Subject: `SME meeting -- {Company_Name}, {Fit_Tier} / {BANTC_Status}`. Body: the BANT summary plus contact info. Draft only, same never-send rule as Flow 3. |
| 10 | **Respond to the agent** | `Qualified` (true/false), `Markers_Set` (count), missing markers, `BANTC_Status`, and `SME_Meeting_Requested` (true/false) so the agent can tell the rep exactly what's left and whether the SME has been looped in. |

**Tool description:**
> "Use this after a qualification call to save the five markers (TMS in
> use, contract status, capacity source, private fleet, lane data
> available) and, when at least three are answered and it isn't a private
> fleet account, mark the lead Qualified. Also computes BANTC (Budget,
> Authority, Need, Timeline, Category) from the same markers plus the
> contact on file -- when a lead clears the BANTC gate, this automatically
> logs it to SME HANDOFF and routes it to that category's SME from SME
> ROUTING. Never sets Qualified or BANTC status on its own guess -- only
> from what the rep reports or what's already verified on the row."

**Why BANTC lives inside Save Qualification rather than its own flow:**
the five markers this flow already collects (TMS, contract status,
capacity source, private fleet, lane data) map directly onto Need and
Timeline; Budget comes from the freight-spend fields already on the row;
Authority comes from the contact already on file. There is no new data to
collect -- BANTC is a second read of the same qualification call, so
splitting it into a separate agent-callable flow would just mean asking
the rep the same questions twice.

**Optional extension -- Retry, Nurture, and Recycle (the playbook's own
rules):** add a `Disposition` input to this same flow (one of the six
strings the `Disposition_Reason` dropdown on `TouchTable` accepts --
`scripts/save_qualification.py`'s `DISPOSITION_REASONS` has the exact
list) and a **Switch** after step 10 that writes it to `TouchTable` and
does the matching state change: `Nonbuyer - suppress` or
`Disqualified - BANTC gate failed` -> `Cadence_Status`="Suppressed" on
`TouchTable` *and* `Record_Status`="Disqualified", `Qualified`="No" on
`MasterTable`; `No response after 8 touches - nurture` ->
`Cadence_Status`="Nurture"; `New trigger - recycle` ->
`Cadence_Status`="Active" and `Cadence_Step`=1 (re-enters the cadence from
the top); `Timing not right - dated follow-up` -> `Cadence_Status`=
"Nurture" plus a `Scheduled_Followup_Date` input written through. This is
optional for a first build -- `save_qualification.py` already does all of
this locally, and the rep can set `Disposition_Reason` by hand in Excel in
the meantime -- but wiring it into the flow means the agent can do it
conversationally ("suppress this one, they told me they went with a
competitor") instead of the rep switching to the spreadsheet.

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
| 4 | OneDrive for Business -- **Create file** | Folder: `/CoreTrust Lead Gen/Exports` in the same OneDrive account the master workbook lives in (no SharePoint site needed). File Name: `CoreTrust_SFDC_Import_@{utcNow('yyyy-MM-dd')}.csv`. File Content: the CSV table output. |
| 5 | OneDrive for Business -- **Create share link** (optional) | On the file from step 4, "View" access, so the rep gets one hyperlink rather than having to browse OneDrive. |
| 6 | **Respond to the agent** | `File_Url` (the OneDrive share link, or the file path if you skip step 5), `Row_Count`. |

**Tool description:**
> "Use this when the rep asks to export qualified leads for Salesforce.
> Builds a Data Import Wizard-ready CSV of every Qualified='Yes' account
> and saves it to OneDrive, returns a link. Note the load date so the rep
> doesn't import the same file twice -- Salesforce isn't connected yet,
> this is the file-based bridge until the connector is approved."

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
| 8 | AI Builder / **Create text with GPT**, then Excel Online (Business) -- **Add a row into a table** | The playbook's Daily Rhythm end-of-day ritual, run automatically here since Nightly Enrichment already reviews everything touched that day: prompt the model with Enrichment Prompts v2 #9 ("Review the accounts you worked today... three short lines: which sources gave the most reliable data, which titles were the real decision makers, which angles earned replies"), then **Add a row into a table** on `LearningNotesTable` -- `Date`=today, `Best_Sources`/`Titles_That_Replied`/`Angles_That_Worked` from the model's three lines, `Written_By`="AI Agent". The rep reads this the next morning, per the playbook's Daily Rhythm table. |
| 9 | (no Respond card needed -- Recurrence-triggered flows don't return to an agent) | |

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
| `SMERoutingTable` / `SMEHandoffTable` (or `LearningNotesTable`) don't appear in the dropdown at all -- not even as a raw GUID, while `MasterTable`/`TouchTable`/`CadenceTable` do | Almost always a **stale OneDrive copy**: these three tabs were added to the pipeline after the others, so a workbook uploaded before that point genuinely doesn't have them. Open the OneDrive file directly and check the tab bar -- if the tabs aren't there, re-download the current `data/CoreTrust_Master_Members.xlsx` from the repo and overwrite the OneDrive copy, then in the flow remove and re-add the Excel Online (Business) connection so it re-reads the file's table list (it caches this on first pick). If the tabs *are* there but still don't show in the picker, switch the action's Table field to "Enter custom value" and type the table name directly rather than relying on the dropdown -- `SMEHandoffTable` in particular ships with zero data rows (just a header) until a lead first clears BANTC, which is worth ruling out too. |
| Filtering on `Follow_Up_Flag` or `SLA_Status` in a Filter Query silently returns nothing | Those are Excel formula columns; the Excel Online connector's `$filter` OData query can't reliably filter on computed cells. Filter on plain input columns (`Qualified`, `Freight_Relevant`, `Record_Status`) and, if you need the formula result, pull the row with List rows and filter client-side in a **Filter array** action instead. |
| A new flow opens blank and asks you to pick a trigger from scratch | You used **+ New flow** instead of **+ New flow > Automation > when an agent calls the flow** (or the Copilot Studio Tools pane's built-in "create a flow" entry point). Add the "When an Agent calls the flow" trigger yourself and the "Respond to the agent" card at the end, or just start over from the correct entry point. |
| A field in a card won't take typed text, or takes it but the flow errors on run | It needs **dynamic content**, not a literal string -- click the field, pick the token (e.g. `Lead_ID` from the trigger, or `Contact_Email` from a prior Get a row) from the popup rather than typing the column name. |
| Enrichment writes a value but Fit_v3_Score doesn't move | Expected -- see Flow 6, step 7. The score is intentionally never written by a flow directly; it only moves when the pipeline script recomputes it, so a stray flow bug can never corrupt the number the rep is trusting. |
| Excel Online (Business) action picker doesn't show **List rows present in a table** -- only single-row actions like Get a row / Add a row / Update a row / Delete a row show up | You added the connector directly as a tool (**Tools > + Add a tool > Connector**), which gives Copilot Studio's stripped-down single-action picker, not the full action set. Use **Tools > + Add a tool > New flow** instead so you land in the real Power Automate designer; if that still shows the narrow list, build the flow directly at `make.powerautomate.com` (new Instant cloud flow, trigger = "When an Agent calls the flow" under the Microsoft Copilot Studio connector, then **+ New step > Excel Online (Business)**) and Copilot Studio will pick it up from there. Also double check you searched **"Excel Online (Business)"** and not plain **"Excel Online"** -- the latter is a different, more limited connector scoped to personal OneDrive. |
| `Filter Query` throws `ConnectorRequestFailure`, "Syntax error at position N" | The Filter Query field is OData, not plain English or the natural-language phrasing this guide sometimes uses to *describe* a filter ("keep rows where Fit_Tier is A or B" is English shorthand for the logic, not something to type literally). Three specific rules: column names must match the header exactly, including underscores (`Fit_Tier`, never `Fit Tier` -- a bare space breaks the parser at exactly the position the error reports); the operator is `eq` (`ne`, `gt`, `lt`, `ge`, `le` for the others), never `is` or `=`; string values need single quotes (`Fit_Tier eq 'A'`, never `Fit_Tier eq A`). Combine multiple conditions with `and`/`or` and parenthesize each `or` group: `Freight_Relevant eq 'Yes' and (Fit_Tier eq 'A' or Fit_Tier eq 'B')`. |

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
