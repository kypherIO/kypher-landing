**CORETRUST PURCHASING GROUP**

STEP BY STEP, ON THE MASTER FILE WITH FIT V3, TOUCHPOINTS, AND EMAIL

**Building the Lead Generation Agent**

How one employee and the AI agent work the full member base from a
single file

  -----------------------------------------------------------------------
  *This guide walks one employee and the AI agent through the whole
  motion on the tools we have today. It covers the master file and its
  Fit v3 score, building the agent in Copilot Studio, researching the web
  to enrich a member, answering a quick question, writing a personable
  email and logging the touch, following up from the touchpoint sheet,
  handling new registrations and private equity acquisitions, exporting
  to Salesforce, and reading the activity dashboard.*

  -----------------------------------------------------------------------

Contents

1\. The files, and how they fit together

Everything runs from one workbook, CoreTrust Master Members. It holds
every member on one row, deduplicated from the full Salesforce export
and enriched with the freight analysis. Each row carries a Fit v3 score,
so the rep can tell at a glance whether an account is worth qualifying.

  -----------------------------------------------------------------------
  **Tab**             **What it is**
  ------------------- ---------------------------------------------------
  MASTER MEMBERS      Every member, scored. The rep sorts by Fit v3 and
                      works the top.

  TOUCHPOINTS         The accounts in active outreach. Tracks every
                      email, call, and LinkedIn touch, and tells the rep
                      who is due for a follow up.

  CADENCE             A small lookup that sets the days until the next
                      touch at each step. The touchpoint formulas read
                      it.

  READ ME             How the file was built and how to use it.
  -----------------------------------------------------------------------

Two files sit beside the workbook. A Salesforce import CSV, ready for
the Data Import Wizard, and an activity dashboard, a single web page
that shows the week.

+-----------------------------------------------------------------------+
| **The Fit v3 score, in one line**                                     |
|                                                                       |
| Fit v3 is thirty percent freight opportunity, thirty percent          |
| CoreTrust engrainment, fifteen percent freight intensity, fifteen     |
| percent contact actionability, and ten percent warmth. Tier A is      |
| seventy and above. The full rationale is in the Scoring Methodology   |
| document. The agent runs it on every member.                          |
+-----------------------------------------------------------------------+

2\. Build the agent in Copilot Studio

1.  Open Copilot Studio, Create, New agent, Configure manually. Name it
    CoreTrust Lead Gen Copilot.

2.  Turn on generative orchestration and web search, set moderation to
    high. Web search is the enrichment engine in the current state.

3.  Paste Agent Instructions v3 into the Instructions field. It tells
    the agent to score with Fit v3, answer a member question, write an
    email and log the touch, and handle new registrations and
    acquisitions.

4.  Upload as Knowledge: this guide, the Scoring Methodology, the
    Enrichment Prompt Library v2, the tier and engagement documents, and
    the email templates. Publish once.

5.  Save the workbook to SharePoint or OneDrive. Format MASTER MEMBERS
    as MasterTable, TOUCHPOINTS as TouchTable, CADENCE as CadenceTable.
    Add the Excel Online action and point it at them.

3\. Score, and answer a quick question

The most common thing the rep will do is ask about a member. The agent
answers in five short lines, because the rep wants ammunition, not an
essay.

+-----------------------------------------------------------------------+
| **PROMPT, answer a member question**                                  |
+-----------------------------------------------------------------------+
| For {Company_Name}, answer in five short lines:                       |
|                                                                       |
| 1\. Do they do heavy freight or not, one sentence, using intensity    |
| and estimated spend.                                                  |
|                                                                       |
| 2\. The Fit v3 score and the tier.                                    |
|                                                                       |
| 3\. The best contact: name, title, email, and whether verified.       |
|                                                                       |
| 4\. The suggested supplier and the service fit tags.                  |
|                                                                       |
| 5\. Offer to draft the outreach email.                                |
+-----------------------------------------------------------------------+

If the member is excluded, non-US, a school, a private equity firm, or a
transportation company, the agent says so plainly rather than pretending
it is a prospect.

4\. Enrich a member from the web

For rows that are New or Enriching and freight relevant, the agent
researches the public web to add contacts and freight signals, then
rescores with Fit v3. It cites sources and leaves gaps blank.

+-----------------------------------------------------------------------+
| **PROMPT, company and contact research**                              |
+-----------------------------------------------------------------------+
| Research {Company_Name} in {HQ_State}. Public sources only. Cite      |
| every field.                                                          |
|                                                                       |
| 1\. Logistics decision makers in order: VP Supply Chain, Director of  |
| Logistics, VP Ops, COO,                                               |
|                                                                       |
| VP Finance, CFO. Name, title, LinkedIn, work email only if published  |
| or from a clear pattern.                                              |
|                                                                       |
| 2\. Confirm firmographics. 3. Freight signals: private fleet with     |
| DOT, carriers, DCs, import/export.                                    |
|                                                                       |
| 4\. Ownership: PE portfolio company, name the sponsor, cite the       |
| source.                                                               |
|                                                                       |
| Rescore with Fit v3.                                                  |
+-----------------------------------------------------------------------+

5\. Write a personable email, and log the touch

This is the step that makes the rep\'s day easier. The agent builds the
email from the master row, writes to the person\'s title, makes it
personable to their business and industry, and always ends with a next
step. Then it updates the touchpoint tab so the follow up clock starts.

-   It pulls the name, company, industry, service fit, and supplier from
    the row, so nothing is typed twice.

-   It writes to the title. A VP of Supply Chain hears a different
    opening than a CFO.

-   It makes the email personable to the business, referencing what the
    company moves and how.

-   It keeps the rules: lowercase subject of three to five words, a body
    of seventy five to one hundred words.

-   It always ends with a call to action, a short meeting or an open
    ended question. It never ends flat.

+-----------------------------------------------------------------------+
| **PROMPT, write email and log touch**                                 |
+-----------------------------------------------------------------------+
| Write a first-touch email to {Contact_First} at {Company_Name}. Write |
| to {Contact_Title}; lead                                              |
|                                                                       |
| with what that role cares about. Personable to {Industry}, reference  |
| what they move using                                                  |
|                                                                       |
| {Service_Fit}. Mention pre-negotiated {Suggested_Supplier} pricing as |
| a CoreTrust member. Subject                                           |
|                                                                       |
| lowercase 3-5 words, company or savings in it. Body 75-100 words. End |
| with a clear next step:                                               |
|                                                                       |
| propose a short meeting or ask an open ended question. Never end      |
| flat. Place the draft in Outlook,                                     |
|                                                                       |
| do not send. Then update TOUCHPOINTS for this Lead_ID: append if new, |
| else increment Emails_Sent                                            |
|                                                                       |
| and Total_Touches, set Last_Touch_Date to today, channel Email.       |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **Why the touch log matters**                                         |
|                                                                       |
| The moment the agent drafts an email, it writes to the touchpoint     |
| tab. The rep never has to remember who they emailed on Tuesday, the   |
| sheet remembers for them.                                             |
+-----------------------------------------------------------------------+

6\. The touchpoint sheet, and who to follow up with

The touchpoint tab mirrors the master for accounts in active outreach.
Every email, call, and LinkedIn touch is a row update. Four columns are
live formulas that do the thinking.

  -----------------------------------------------------------------------
  **Column**             **What it does**
  ---------------------- ------------------------------------------------
  Days_Since_Last        Counts the days from the last touch to today,
                         automatically.

  Next_Touch_Due         Adds the cadence gap for the current step to the
                         last touch date, so the rep sees the exact day
                         the next touch is due.

  Follow_Up_Flag         Reads FOLLOW UP when the next touch is due or
                         overdue, otherwise ok.

  SLA_Status             Reads ON TRACK, DUE SOON, or OVERDUE against the
                         touchpoint SLAs.
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **PROMPT, who do I follow up with**                                   |
+-----------------------------------------------------------------------+
| Read TOUCHPOINTS. Return accounts where Follow_Up_Flag is FOLLOW UP   |
| or SLA_Status is OVERDUE                                              |
|                                                                       |
| or DUE SOON. Order by Fit_Tier then Spend_Bucket. Show company,       |
| contact, days since last touch,                                       |
|                                                                       |
| last channel, and the next step. Offer to draft the next touch.       |
+-----------------------------------------------------------------------+

The SLAs the sheet enforces: a hot lead gets a same day touch aiming
under two hours, a new lead within twenty four hours, any reply within
one hour. The cadence is eight touches over about fourteen days.

7\. New registrations, into the funnel the day they join

A new member is a fresh opportunity nobody else has worked. The agent
treats new registrations as a standing job. When pointed at a new
registration or list, it scores with Fit v3, adds to the master,
researches the web, and if tier A or B drops it into the daily list.

+-----------------------------------------------------------------------+
| **PROMPT, new registration intake**                                   |
+-----------------------------------------------------------------------+
| A new member has registered: {Company_Name}. Research it, confirm     |
| firmographics and freight                                             |
|                                                                       |
| signals, find a logistics decision maker, and score with Fit v3. Add  |
| to the master as New or                                               |
|                                                                       |
| Enriching. If tier A or B and ships freight, put it in today\'s list. |
+-----------------------------------------------------------------------+

8\. Private equity acquisitions, getting in first

We cover 408 sponsors, and the master already holds 2,205 of their
portfolio companies. When a sponsor we cover announces a new
acquisition, that company is a warm door before anyone else calls,
because the client executive who owns that sponsor can make the
introduction.

+-----------------------------------------------------------------------+
| **PROMPT, PE acquisition watch**                                      |
+-----------------------------------------------------------------------+
| The sponsor {PE_Sponsor}, which we cover, has acquired                |
| {Target_Company}. Research the target,                                |
|                                                                       |
| confirm whether it ships freight, and score with Fit v3. If it ships  |
| freight, add it, flag it as                                           |
|                                                                       |
| a warm door through the CE who owns {PE_Sponsor}, and draft a short   |
| intro the CE can send.                                                |
+-----------------------------------------------------------------------+

9\. Export to Salesforce, the Data Import Wizard way

We do not have a Salesforce connector yet, so qualified leads move by
file. The agent produces a CSV in the exact column terminology the Data
Import Wizard expects.

6.  Filter the master to the leads you are ready to load, the qualified
    rows with a contact. The agent can produce this export.

7.  The CSV headers follow Salesforce Lead terminology: Company, First
    Name, Last Name, Title, Email, Phone, Website, Industry,
    State/Province, Country, Lead Source, No. of Employees, Annual
    Revenue, Rating, and Description, plus custom fields Freight Spend,
    Lead Tier, Fit Score, Preferred Partner, and PE Sponsor.

8.  Last Name is required, so blanks are filled with Unknown, and the
    Rating maps from the tier, A to Hot, B to Warm, C and D to Cold.

9.  In Salesforce, Setup, Data Import Wizard, Leads, add new records,
    upload, map, run. Note the load so a lead is never imported twice.

+-----------------------------------------------------------------------+
| **What the connector buys later**                                     |
|                                                                       |
| When information security approves the Salesforce connector, this     |
| file load becomes an automated create behind an approval, and         |
| touchpoint updates flow to the lead record. It is the first upgrade   |
| on the path.                                                          |
+-----------------------------------------------------------------------+

10\. The activity dashboard

The rep and the manager need to see the week at a glance. The activity
dashboard is a single web page that opens in any browser. It reads an
export of the touchpoint tab and shows the numbers that matter: total
touches, emails, calls and LinkedIn, meetings booked, and the reply rate
as headline tiles, activity by channel and the funnel outcomes as bar
charts, and a follow up list of the accounts where the SLA is breached
or the next touch is due. It needs nothing installed, and it matches the
CoreTrust portal pattern.

11\. Test, then run

10. Ask the agent about five members. Confirm it returns the Fit v3
    score, the tier, the contact, and the service fit, and flags
    excluded records correctly.

11. Have it enrich ten New rows. Confirm it adds contacts with sources,
    rescores, and does not touch the green columns.

12. Ask it to write three emails. Confirm each is written to the title,
    personable, ends with a call to action, lands in Outlook unsent, and
    appends a touchpoint row.

13. Ask who you need to follow up with. Confirm the touchpoint tab
    returns the right accounts, ordered by tier.

14. Produce the Salesforce CSV and run one import into a sandbox. Load
    the touchpoint export into the dashboard and confirm the tiles and
    charts.

+-----------------------------------------------------------------------+
| **The bottom line**                                                   |
|                                                                       |
| One file, every member scored by Fit v3, an agent that researches the |
| web, writes the email, and logs the touch, a touchpoint sheet that    |
| tells the rep who to follow up with, a clean Salesforce export, and a |
| dashboard for the week. The whole motion runs today with one person,  |
| and it gets smarter every day.                                        |
+-----------------------------------------------------------------------+
