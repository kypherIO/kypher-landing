# CoreTrust Enrichment and Action Prompt Library v2

The prompts the agent uses to score, research, write, and track. Load as Knowledge and reference by name in your flow or topic. Every prompt uses Fit v3, cites sources, leaves unverifiable fields blank, and never guesses.

## Prompt 1. Score a member with Fit v3
```
Score {Company_Name} with Fit v3.
Fit v3 = 30% freight opportunity + 30% engrainment + 15% freight intensity
         + 15% contact actionability + 10% relationship warmth.
Freight opportunity: from est annual freight spend = revenue x transport pct by vertical
(distribution/wholesale 7.5%, manufacturing 6%, consumer 5.5%, retail 4.5%, services <1%),
log scaled so 10M=60 and 1B=100. No size, fall back to intensity.
Engrainment: percentile of CoreTrust reported spend (85%), opps won, recent activity.
Intensity 0-100 by industry: wholesale/distribution highest, manufacturing 95, retail 80,
services near zero.
Actionability: verified logistics-titled email 100, verified generic 75, email no title 60,
hand-researched name 40, nothing 0.
Warmth: PE backed 60, plus named AE/CE 40.
Return the five components, the total, and the tier (A>=70, B>=55, C>=40, D). If non-US, K-12,
a PE/VC entity, or a transport/logistics company, do not score. Say why excluded.
```

## Prompt 2. Answer a simple question about a member
```
For {Company_Name}, answer in five short lines:
1. Do they do heavy freight or not, one sentence, using intensity and estimated spend.
2. The Fit v3 score and the tier.
3. The best contact: name, title, email, and whether verified.
4. The suggested supplier and the service fit tags.
5. Offer to draft the outreach email.
```

## Prompt 3. Company and contact research
```
Research {Company_Name} in {HQ_State}. Public sources only. Cite every field.
1. Logistics decision makers in order: VP Supply Chain, Director of Logistics, VP Ops, COO,
   VP Finance, CFO. Name, title, LinkedIn, and a work email only if published or from a clear
   pattern, else blank and write pattern unknown.
2. Confirm firmographics.
3. Freight signals: private fleet with DOT and unit count, carriers, DCs, import or export,
   facility moves, FedEx usage.
4. Ownership: PE portfolio company, name the sponsor, cite the source.
Rescore with Fit v3 using the new information.
```

## Prompt 4. Write a personable email and log the touch
```
Write a first-touch email to {Contact_First} at {Company_Name}. Write to {Contact_Title}; lead
with what that role cares about. Make it personable to {Industry} and reference what they likely
move, using {Service_Fit}. Mention pre-negotiated {Suggested_Supplier} pricing as a CoreTrust
member. Subject lowercase, 3-5 words, company or savings in it. Body 75-100 words. No jargon.
End with a clear next step: propose a short meeting or ask an open ended question. Never end flat.
Place the draft in Outlook, do not send. Then update TOUCHPOINTS for this Lead_ID: append if new,
else increment Emails_Sent and Total_Touches, set Last_Touch_Date to today, channel Email.
```

## Prompt 5. Who do I follow up with
```
Read TOUCHPOINTS. Return accounts where Follow_Up_Flag is FOLLOW UP or SLA_Status is OVERDUE or
DUE SOON. Order by Fit_Tier then Spend_Bucket. Show company, contact, days since last touch, last
channel, and the next step. Offer to draft the next touch.
```

## Prompt 6. PE portfolio mapping, the multiplier
```
The member {Company_Name} is owned by {PE_Sponsor}. Search public sources, including the sponsor
portfolio page, for other portfolio companies under {PE_Sponsor} that ship physical freight:
manufacturing, distribution, retail, industrial, food, chemicals. Return name, website, industry,
and one line on likely freight spend. Flag the five most likely to have $1M+ freight. Score each
with Fit v3. Cite the source. Add them as candidate rows for the employee to review.
```

## Prompt 7. New registration intake
```
A new member has registered: {Company_Name}. Research it, confirm firmographics and freight
signals, find a logistics decision maker, and score it with Fit v3. Add it to the master with
status New or Enriching. If it is tier A or B and ships freight, put it in today's list.
```

## Prompt 8. PE acquisition watch
```
The sponsor {PE_Sponsor}, which we cover, has acquired {Target_Company}. Research the target,
confirm whether it ships freight, and score it with Fit v3. If it ships freight, add it to the
master, flag it as a warm door through the CE who owns {PE_Sponsor}, and draft a short intro the
CE can send. Getting in before they shop carriers is the whole point.
```

## Prompt 9. The learning note
```
Review the accounts you worked today. In three short lines, tell the employee which public
sources gave the most reliable freight and contact data, which titles turned out to be the real
decision makers, and which outreach angles earned replies. Write these to a running Learnings note.
```

## How the agent writes back
For each row, update only non green columns: contacts, est freight spend where evidenced, private
fleet and DOT, sponsor and portfolio flag, outreach angle, and marker answers from a call. Set
Record_Status, stamp Updated_By and Last_Updated, leave the Fit v3 score and the tier alone. The
score recomputes from the inputs. Update the touchpoint tab on every email, call, or LinkedIn touch.

## The guardrail
Research grade data is not verified data. Cite sources, leave gaps blank, the employee verifies
before the call. That honest difference is why the proposal asks for a paid private equity data
tool, and it is why the Fit v3 actionability component exists: it tells the employee, before they
spend time, whether we can actually reach the account.
