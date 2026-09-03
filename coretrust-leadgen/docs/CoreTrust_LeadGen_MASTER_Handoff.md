**CORETRUST PURCHASING GROUP**

MASTER HANDOFF DOCUMENT · FULL PROJECT OVERSIGHT

**AI-Augmented Lead**

**Generation Engine**

Everything discussed, summed up. Strategy, data, scoring, the agent, the
flows, the numbers, and every next step.

  -----------------------------------------------------------------------
  *This document is written to hand the entire project to Claude Code so
  the work can continue directly. It captures the full context in one
  place: the business problem, the data we built, the Fit v3 scoring
  method, the master file structure, the Copilot Studio agent and its six
  flows, the material handling extension, the investment case, and a
  precise list of what is done and what remains. Read it top to bottom
  and you have complete oversight.*

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Field**        **Detail**
  ---------------- ------------------------------------------------------
  Owner            Rod Andrews, Category Manager, Logistics, CoreTrust
                   Purchasing Group

  Current tools    Salesforce, Microsoft 365, Copilot Studio standard,
                   one employee

  Suppliers in     CoreTrust Connect, Redwood, GEODIS, SEKO, plus
  scope            material handling: Hyster-Yale, Ferrellgas, Millwood

  Status           Data scored, agent design complete, flows specified,
                   ready to build and pilot
  -----------------------------------------------------------------------

0\. How to use this document with Claude Code

Paste this whole document into Claude Code as the project context. It
gives Claude everything it needs to continue: the goal, the data model,
the scoring math, the agent and flow specs, and the open tasks. Then ask
Claude Code to help with the specific next piece, for example
regenerating the scored master from the source files, or refining a
flow.

+-----------------------------------------------------------------------+
| **The one paragraph brief, if you only paste one thing**              |
|                                                                       |
| Build and run an AI lead generation engine for CoreTrust logistics.   |
| One master Excel file holds every member, scored 0 to 100 by a        |
| weighted Fit v3 method that ranks who is worth qualifying. A Copilot  |
| Studio agent reads the file, ranks the rep\'s day, drafts personable  |
| emails, logs touches, and enriches members from the web to raise      |
| their scores over time. The whole motion runs today with one person   |
| and the tools we already own. The ask to leadership is to fund three  |
| tools that scale it.                                                  |
+-----------------------------------------------------------------------+

0.1 The source files this project runs on

  -------------------------------------------------------------------------------------
  **File**                           **What it is**                        **Status**
  ---------------------------------- ------------------------------------- ------------
  Member.xlsx                        The full Salesforce export of every   Provided by
                                     CoreTrust member, about 25,800 rows,  Rod
                                     27 columns.                           

  CoreTrust_Freight_Leads_full.csv   The freight analysis, about 3,200     Provided by
                                     accounts with fit scores and          Rod
                                     contacts.                             

  CoreTrust_Freight_Master.csv       The Fit v3 scored analysis, about     Provided by
                                     7,900 accounts with verified          Rod
                                     contacts, web signals, import         
                                     shipments, private fleet flags, and   
                                     the PE sponsor rollup.                
  -------------------------------------------------------------------------------------

*The pipeline merges these into one scored master. If Claude Code has
these three files, it can regenerate the complete 25,441 member scored
master in about half a minute. Without them it works from the seeded top
accounts.*

1\. The business problem and the strategy

1.1 The problem

CoreTrust has proven demand in logistics and material handling but no
engine to capture it on purpose. Leads are pulled by hand, there is no
ingestion into Salesforce, qualification is inconsistent from rep to
rep, and the realization gap, the difference between committed and
actual member spend, keeps rebuilding. Pipeline leans on whichever
supplier is easiest rather than the best fit.

1.2 The strategy, one engine, one person, prove it

Build a small AI-augmented engine that turns the members we already have
into qualified logistics opportunities. One employee runs it. The AI
does the busywork, scoring, research, ranking, drafting, and logging, so
the person spends the day on calls that matter. Prove it manually with
the tools we own, then buy the upgrades the results justify.

1.3 The eight step motion

  -----------------------------------------------------------------------
  **Step**      **What happens**
  ------------- ---------------------------------------------------------
  1\. Ingest    Members come from the Salesforce export and the freight
                analysis.

  2\. Enrich    The agent researches the web to add contacts and freight
                signals.

  3\. Tier      Fit v3 scores each member and sorts them into tiers.

  4\. Engage    The rep works an eight touch cadence with templatized
                email.

  5\. Qualify   Five markers plus a discipline gate decide who is real.

  6\. Route     Each qualified lead goes to the right supplier by spend
                tier.

  7\. Load      Qualified leads export to Salesforce by file.

  8\. Measure   A dashboard tracks the week against benchmarks.
  -----------------------------------------------------------------------

2\. The data, what we built and what it says

We combined the full Salesforce export with the freight analysis into
one deduplicated master, matched on a normalized company name so no
member appears twice. Then we scored every member with Fit v3.

2.1 The headline numbers, from the full scored base

  -----------------------------------------------------------------------
  **What the file shows**                 **Number**
  --------------------------------------- -------------------------------
  Total members, deduplicated             25,441

  Freight-relevant members scored         7,785

  Tier A accounts, the top of the file    123

  Tier B accounts                         1,195

  Tier A and B combined, the rep-led      1,318
  universe                                

  Accounts at ten million dollars or more 2,397
  in freight                              

  Accounts at one million dollars or more 4,965

  Estimated addressable freight spend     about 560 billion dollars

  K-12 districts correctly set aside      10,006

  Non-US members set aside                1,706

  Transportation companies set aside      335
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **A note on the scores, important**                                   |
|                                                                       |
| When scored from Salesforce firmographics alone, the contact          |
| actionability component, fifteen percent of the score, is zero        |
| because there are no contacts yet. So many strong accounts sit in     |
| Tier B or C until the agent enriches a verified contact, then they    |
| rise. This is by design. When the freight analysis file with verified |
| contacts is merged in, the top tiers fill out, roughly 400 Tier A and |
| 790 Tier B with about 1,060 already holding a verified email.         |
+-----------------------------------------------------------------------+

2.2 The private equity multiplier

Thousands of the freight members are private equity portfolio companies
across hundreds of sponsors. The top ten sponsors alone cover hundreds
of freight-shipping portfolio companies. One relationship with a sponsor
opens a portfolio, so a tool that maps ownership turns one warm
introduction into ten or fifteen qualified conversations. This is why
the proposal asks for a private equity focused data tool, not a generic
contact database.

3\. The Fit v3 scoring method, the core

Fit v3 is the number that tells the rep whether a member is worth
qualifying before a single call. The agent runs it on every member the
same way every time.

**Fit v3 = 30 percent freight opportunity, plus 30 percent CoreTrust
engrainment, plus 15 percent freight intensity, plus 15 percent contact
actionability, plus 10 percent relationship warmth.**

  ------------------------------------------------------------------------------
  **Component**   **Weight**   **How it is built**
  --------------- ------------ -------------------------------------------------
  Freight         30%          From estimated annual freight spend, revenue
  opportunity                  times a transport spend percentage by vertical
                               (distribution 7.5%, manufacturing 6%, consumer
                               5.5%, retail 4.5%, services under 1%), log scaled
                               so ten million scores 60 and one billion scores
                               100.

  CoreTrust       30%          Percentile of the member\'s CoreTrust reported
  engrainment                  spend at 85 percent, plus opportunities won and
                               recent activity. A member who already buys
                               through us is the easiest cross sell.

  Freight         15%          How much physical product the industry moves.
  intensity                    Wholesale and distribution highest, manufacturing
                               95, retail 80, services near zero.

  Contact         15%          Can we reach them. Verified logistics-titled
  actionability                email 100, generic 75, email no title 60,
                               hand-researched name 40, nothing 0. This rises
                               when the agent enriches a contact.

  Relationship    10%          PE backed 60, plus a named account owner 40. An
  warmth                       accelerant that breaks ties.
  ------------------------------------------------------------------------------

3.1 The tiers

  ----------------------------------------------------------------------------
  **Tier**   **Score**    **Meaning**
  ---------- ------------ ----------------------------------------------------
  A          70 and above Real freight budget and a proven CoreTrust buying
                          habit. Call today.

  B          55 and above Strong on freight and reachable. Work next.

  C          40 and above Some signal, thinner. Nurture and enrich.

  D          below 40     Not worth qualifying yet.
  ----------------------------------------------------------------------------

3.2 Who is excluded, on purpose

Non-US members, K-12 districts, private equity firm and venture records,
no-signal service accounts, and transportation or logistics companies,
which are potential carriers, not shipper prospects. Each is flagged in
an Exclusion_Reason column and set to Low Priority so it does not dilute
the ranking.

3.3 The spend-tier routing

  -------------------------------------------------------------------------
  **Spend band**  **Tier**        **Supplier**
  --------------- --------------- -----------------------------------------
  Under \$1M      Transactional   CoreTrust Connect

  \$700K to \$1M  Gray            Connect, managed only if a lane analysis
                                  proves savings

  \$1 to 2M       Strategic S1    Redwood

  \$2 to 5M       Strategic S2    Redwood or GEODIS

  \$5 to 10M      Strategic S3    GEODIS

  \$10M+          Strategic S4    GEODIS enterprise
  -------------------------------------------------------------------------

4\. The master file, structure and columns

Everything runs from one workbook, CoreTrust_Master_Members.xlsx. It has
these tabs: MASTER MEMBERS, SUMMARY, TOUCHPOINTS, CADENCE, READ ME, Data
Dictionary. Every member is one row, found by Lead_ID.

4.1 The column groups on MASTER MEMBERS

  -------------------------------------------------------------------------
  **Group**   **Columns**                                     **Who writes
                                                              them**
  ----------- ----------------------------------------------- -------------
  Record      Lead_ID, Record_Status, Freight_Relevant,       Agent
              Data_Source, Assigned_Rep, Last_Updated,        maintains
              Updated_By                                      

  Company     Company_Name, Website, Industry, Sub_Industry,  From
              HQ_City, HQ_State, Employees, Annual_Revenue,   Salesforce,
              Rev_Source, Sales_Village, CT_Account_Manager,  agent
              CT_TTM_Spend, Opps_Won, PA_Effective_Date       corrects

  Contact     Contact_First, Contact_Last, Contact_Title,     Blank now,
              Contact_Email                                   agent fills
                                                              from research

  Markers 1   Est_Freight_Spend, Confirmed_Freight_Spend,     The call
  to 5        TMS_In_Use, Tech_State, Under_Contract,         fills them
              Contract_Status, Capacity_Source,               
              Private_Fleet, Lane_Data_Available              

  Score       Freight_Opportunity, Engrainment,               Agent fills
  inputs      Freight_Intensity, Exclusion_Reason             

  Scoring,    Fit_v3_Score, Fit_Tier, Spend_Bucket, Priority, Never
  GREEN,      Suggested_Supplier                              overwrite
  computed                                                    

  Outcome     Qualified, Notes                                Agent and rep
  -------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **The golden rule for the agent**                                     |
|                                                                       |
| Write only the input columns. Never overwrite the green scoring       |
| columns or the Lead_ID. Stamp Updated_By and Last_Updated on every    |
| edit. Cite sources, leave unverifiable fields blank, never guess.     |
+-----------------------------------------------------------------------+

4.2 The TOUCHPOINTS tab

It mirrors the master for accounts in active outreach and tracks every
email, call, and LinkedIn touch. Four columns are live formulas:
Days_Since_Last, Next_Touch_Due, Follow_Up_Flag, and SLA_Status. When
Follow_Up_Flag reads FOLLOW UP, the next touch is due. This is how the
rep knows who to follow up with.

5\. The Copilot Studio agent and its flows

5.1 The two decisions that shape the build

-   **Harness:** build on the standard harness. Rules-based flows,
    covered by existing Microsoft 365 licenses inside Teams. The GitHub
    Copilot harness is autonomous but bills Copilot Credits for
    everything, save it for later.

-   **Orchestration:** generative orchestration. A planner picks tools
    by their name and description, so every tool needs a sharp
    description. Descriptions are routing logic, not documentation.

+-----------------------------------------------------------------------+
| **The pattern that makes it reliable**                                |
|                                                                       |
| Never let the agent call raw Excel actions on its own, it fails       |
| intermittently. Wrap each unit of Excel work inside an agent flow and |
| expose that flow to the agent as one clean tool. This is the single   |
| most important build decision.                                        |
+-----------------------------------------------------------------------+

5.2 The six flows

  ------------------------------------------------------------------------
  **Flow**        **Trigger**        **What it does**
  --------------- ------------------ -------------------------------------
  Get Today List  When an agent      Reads TouchTable, returns the rep\'s
                  calls the flow     ranked top five

  Log Touch       When an agent      The read then update-or-add pattern,
                  calls the flow     records a touch. Uses a Condition.

  Draft Email     When an agent      Gets the member row, writes a
                  calls the flow     personable email, creates an Outlook
                                     draft, not send

  Save            When an agent      Writes the five markers, sets
  Qualification   calls the flow     Qualified when the first three pass

  Export For      When an agent      Builds the Data Import Wizard CSV of
  Salesforce      calls the flow     qualified leads

  Nightly         Recurrence,        Researches the web, adds contacts,
  Enrichment      scheduled          raises scores. The engine that grows
                                     the callable pool.
  ------------------------------------------------------------------------

5.3 Every flow has three requirements

-   The trigger is When an agent calls the flow, except Nightly
    Enrichment which uses Recurrence.

-   It ends with a Respond to the agent card that returns the result.

-   Asynchronous response is Off, so it answers within the one hundred
    second limit.

5.4 The connectors used, all standard

Excel Online (Business) for reading and writing the tables, Office 365
Outlook for Create draft, SharePoint for the export file, and the
built-in Run a prompt AI action for the email body. The built-in
Condition, Apply to each, Compose, and Create CSV table are control
actions, not connectors. No premium connector is needed for this build.

5.5 The key gotchas learned

  -----------------------------------------------------------------------
  **Symptom**          **The real cause and fix**
  -------------------- --------------------------------------------------
  Wrong tool or no     Weak tool description. Rewrite it to say exactly
  tool                 when to use the tool.

  Flow says failed but A test pane reporting quirk. Open the Excel file,
  the row is written   if the row is there it worked. Trust the file.

  Table dropdown empty The range is not a named Excel table. Format it,
                       name it MasterTable, TouchTable, or CadenceTable.

  Filter on formula    Do not filter on Follow_Up_Flag or SLA_Status.
  columns fails        Filter only on plain input columns like Qualified,
  silently             Freight_Relevant, Record_Status.

  Flow started blank,  You used New flow not New agent flow. Add the
  asks for a trigger   trigger When an agent calls the flow yourself, and
                       add the Respond card at the end.

  A field will not     It needs dynamic content. Click the field and pick
  take typed text      the token from the popup, do not type the name.
  -----------------------------------------------------------------------

6\. The agent instruction set, paste this into Copilot Studio

This is the full instruction set, grounded in the real master columns.
In the agent, wherever a tool is named, replace it with a forward-slash
live reference to the real tool.

+-----------------------------------------------------------------------+
| **Agent Instructions v3, the core**                                   |
+-----------------------------------------------------------------------+
| MISSION. You serve one CoreTrust logistics rep. You run the lead      |
| generation motion                                                     |
|                                                                       |
| from one file, CoreTrust Master Members. You score, rank, research,   |
| draft, log, and                                                       |
|                                                                       |
| export. The rep makes the calls. The master file is the single source |
| of truth.                                                             |
|                                                                       |
| ALWAYS SCORE WITH FIT V3 = 30% freight opportunity + 30% CoreTrust    |
| engrainment +                                                         |
|                                                                       |
| 15% freight intensity + 15% contact actionability + 10% warmth. Tiers |
| A\>=70, B\>=55,                                                       |
|                                                                       |
| C\>=40, D below. The file holds Fit_v3_Score and Fit_Tier, use them,  |
| do not recalculate.                                                   |
|                                                                       |
| ORDER OF THE DAY. Filter Freight_Relevant = Yes. Sort by Fit_v3_Score |
| highest first.                                                        |
|                                                                       |
| Work Tier A then B. C is nurture. Prefer Record_Status Ready to Call. |
| New and                                                               |
|                                                                       |
| Enriching rows go to enrichment first. Respect TouchTable follow-up   |
| flags.                                                                |
|                                                                       |
| ANSWER A MEMBER QUESTION IN FIVE LINES. 1) heavy freight or not. 2)   |
| Fit v3 score and                                                      |
|                                                                       |
| tier. 3) best contact and whether verified. 4) suggested supplier and |
| service fit.                                                          |
|                                                                       |
| 5\) offer to draft the email.                                         |
|                                                                       |
| WRITE A PERSONABLE EMAIL, THEN LOG THE TOUCH. Write to the contact    |
| title. Personable                                                     |
|                                                                       |
| to the industry. Lowercase subject 3-5 words, body 75-100 words, end  |
| with a call to                                                        |
|                                                                       |
| action, never flat. Draft to Outlook, never send. Then call Log       |
| Touch.                                                                |
|                                                                       |
| ENRICHMENT. On New or Enriching rows, research the public web, find a |
| logistics                                                             |
|                                                                       |
| decision maker, cite sources, leave unverified fields blank. Set      |
| Record_Status to                                                      |
|                                                                       |
| Ready to Call when a verified email is found. The score recomputes    |
| and the tier rises.                                                   |
|                                                                       |
| EXCLUDE members flagged in Exclusion_Reason: K-12, Non-US, Transport, |
| PE/VC, No-signal.                                                     |
|                                                                       |
| HARD RULES. Write only input columns, never the green scoring columns |
| or Lead_ID.                                                           |
|                                                                       |
| Stamp Updated_By and Last_Updated. Cite sources, never guess. Draft,  |
| never send.                                                           |
|                                                                       |
| TONE. Plain sentences, no jargon, no hype, no dashes. Lead with the   |
| useful fact.                                                          |
+-----------------------------------------------------------------------+

7\. The M365 Copilot agent builder version

The M365 Copilot agent builder makes a declarative agent that reads
files and answers, scores, and drafts. It cannot run the Excel-writing
flows, those need full Copilot Studio. Use it for the read-and-think
half: answer a member question, score, rank, and draft. Paste the
describe prompt below, then the instructions from Section 6, and upload
a filtered Tier A and B copy of the master, about 1,300 rows, as the
knowledge file so it performs well.

+-----------------------------------------------------------------------+
| **Describe your agent, paste this**                                   |
+-----------------------------------------------------------------------+
| Build an agent for one CoreTrust logistics rep. It reads the          |
| CoreTrust Master                                                      |
|                                                                       |
| Members Excel file and helps the rep work the list. When asked about  |
| a company, it                                                         |
|                                                                       |
| gives the Fit v3 score, the tier, whether they do heavy freight, the  |
| best contact,                                                         |
|                                                                       |
| and the suggested supplier, in five short lines. When asked who to    |
| call today, it                                                        |
|                                                                       |
| filters to Freight_Relevant Yes, ranks by Fit v3 score, and returns   |
| the top Tier A                                                        |
|                                                                       |
| and B accounts. When asked to draft an email, it writes a short       |
| personable email to                                                   |
|                                                                       |
| the contact title. Use the uploaded documents as knowledge. Plain     |
| tone, no dashes.                                                      |
+-----------------------------------------------------------------------+

8\. The investment case for leadership

The engine works today with one person researching the web. The ask is
to fund the tools that scale it. We are mostly buying activations and
approvals, not a new platform.

  ---------------------------------------------------------------------------
  **Investment**   **2026 cost basis** **The metric it moves** **Decision**
  ---------------- ------------------- ----------------------- --------------
  Salesforce       Power Automate      Speed to lead, the file Approve, IT
  connector        Premium, about \$15 load becomes an         signs off
                   per user per month  automated create        

  ZoomInfo API     Add-on to seats we  Contact actionability   Activate the
                   already hold        and reply rate, the     API
                                       binding constraint      

  PE enrichment    about \$155K per    The portfolio           Propose, the
  tool (Grata)     year enterprise,    multiplier, one         one net-new
                   Cyndx about \$45K   relationship into ten   tool
                                       to fifteen              

  Apollo           about \$49 per user Cheap verified          Optional
                   per month           contacts, an interim    
                                       bridge                  
  ---------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **The argument, made by our own data**                                |
|                                                                       |
| Fit v3 shows reachability, not freight size, is what holds the best   |
| accounts back. Every scored account has a real freight budget and a   |
| real CoreTrust relationship, but many sit below Tier A only because   |
| we lack a verified contact. That is exactly the gap a data tool       |
| closes.                                                               |
+-----------------------------------------------------------------------+

9\. The material handling extension

The same engine works for material handling, forklifts, pallets, and
propane, because the members that ship freight are the same members that
run forklifts and warehouses. The proposal to the material handling
category lead, Nick Beach, is one engine with a second score, not a
second engine.

9.1 What the category must provide

-   The ideal customer profile for each supplier, Hyster-Yale forklifts,
    Ferrellgas propane, Millwood pallets.

-   Target industry lists and the signed versus whitespace member lists,
    so we prospect the right accounts.

-   The Hyster-Yale lease end and open order reports, the strongest
    buying trigger, the material handling equivalent of a contract
    renewal.

-   Average deal size and admin fee by supplier, so the score can value
    an opportunity.

*The 2026 material handling plan already targets 200 members and 40 PE
firms before year end. The engine is how one person hits that without
adding headcount. Hyster-Yale has 192 signed of about 1,400 in target
industries but only 85 with orders, that gap alone is a warm list.*

10\. What is done, and what remains

10.1 Done

-   The full 25,441 member master, scored with Fit v3, deduplicated,
    with exclusions flagged.

-   The scoring methodology, documented and reproducible via the
    pipeline script.

-   The agent instruction set, the enrichment prompt library, and the
    email rules.

-   The six flow specifications, every card, every field, every filter.

-   The touchpoint tracking design with live follow-up formulas.

-   The Salesforce import CSV format and the activity dashboard.

-   The investment proposal and the material handling meeting prep.

10.2 Remaining, the next actions

1.  Regenerate the full scored master from the three source files, if
    not already current, using the pipeline script.

2.  Build the six flows in Copilot Studio following the step by step,
    then wire them as tools with sharp descriptions.

3.  Merge the freight analysis file so the top tiers carry verified
    contacts and the PE sponsor rollup.

4.  Run the 30 day pilot with one rep, measure qualified opportunities,
    reply rate, and cost per qualified opp.

5.  Take the proposal to leadership, approve the connector, activate the
    ZoomInfo API, fund the PE tool.

6.  Hold the material handling meeting with Nick, secure the ICPs and
    the lease end report, then add the second score.

11\. The full file inventory

Everything produced in this project, so Claude Code knows what exists.

  ----------------------------------------------------------------------------------------------------
  **File**                                               **What it is**
  ------------------------------------------------------ ---------------------------------------------
  CoreTrust_Master_Members.xlsx                          The scored master, six tabs, all members

  fitv3_scoring_pipeline.py, fitv3_engine.py             The scoring pipeline and reference

  CoreTrust_Fit_v3_Scoring_Methodology.docx              The scoring rationale

  CoreTrust_LeadGen_Agent_Instructions_v3.md             The agent brain, paste-ready

  CoreTrust_Enrichment_Prompts_v2.md                     The nine agent prompts

  CoreTrust_Master_AIAgent_Build_Guide.docx              The reflective build guide, the why

  CoreTrust_CopilotStudio_Full_StepByStep.docx           Every click, one action per line

  CoreTrust_AgentFlows_Explained.docx                    Flows taught from zero

  CoreTrust_AgentFlows_Full_Card_Overview.docx           Every flow as a card stack

  CoreTrust_SFDC_Import_Leads.csv                        The Data Import Wizard file

  CoreTrust_Activity_Dashboard.html                      The weekly KPI dashboard

  CoreTrust_Aspirational_Investment_KPI_Proposal.docx    The investment case

  CoreTrust_MaterialHandling_LeadGen_Meeting_Prep.docx   The Nick Beach meeting prep
  ----------------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **The bottom line for Claude Code**                                   |
|                                                                       |
| One master file scored by Fit v3 is the basis. A Copilot Studio agent |
| on the standard harness reads it, ranks the day, drafts email, logs   |
| touches, and enriches nightly to raise scores. Every Excel operation  |
| is wrapped in an agent flow. The motion runs today with one person.   |
| The proposal funds three tools to scale it, and the same engine       |
| extends to material handling. Continue from here.                     |
+-----------------------------------------------------------------------+
