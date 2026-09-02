**CORETRUST PURCHASING GROUP**

HOW WE WEIGHT A LEAD BEFORE WE SPEND TIME ON IT

**Fit v3 Scoring Methodology**

The scoring the agent runs on every member, every time

  -----------------------------------------------------------------------
  *This document explains the Fit v3 score, the number that tells a rep
  whether a member is worth qualifying before a single call is made. It
  is a way to spend a scarce resource, the one employee\'s time, on the
  accounts most likely to become real freight opportunities. The agent
  runs this method on every member, and it runs it the same way every
  time.*

  -----------------------------------------------------------------------

Contents

1\. Why we score at all

We have one employee and a base of 25,461 members. Reading that list top
to bottom is not a plan. Most of those members do not ship meaningful
freight. Some do, and among those, some already buy heavily through
CoreTrust, which makes the logistics conversation far easier to open.
The score exists to find those accounts fast and to keep the rep from
burning a morning on a company that was never going to convert.

The score answers a practical question in a single number. Is this
member worth qualifying now. A high score means a real freight budget
and a real path to reach the buyer. A low score means either they do not
ship much, or we cannot get to them yet. The rep works the top of the
list and lets the bottom wait.

+-----------------------------------------------------------------------+
| **The one line version**                                              |
|                                                                       |
| Fit v3 tells the rep, before any outreach, whether an account is      |
| worth the call. High score, call today. Low score, leave it alone.    |
+-----------------------------------------------------------------------+

2\. The formula, and why it is weighted this way

**Fit v3 = 30 percent freight opportunity, plus 30 percent CoreTrust
engrainment, plus 15 percent freight intensity, plus 15 percent contact
actionability, plus 10 percent relationship warmth.**

  -----------------------------------------------------------------------------
  **Component**   **Weight**   **What it measures**      **Why it carries this
                                                         weight**
  --------------- ------------ ------------------------- ----------------------
  Freight         30%          The size of the estimated A logistics program is
  opportunity                  annual freight spend      only worth running if
                                                         there is real freight
                                                         to move. This is the
                                                         prize.

  CoreTrust       30%          How much the member       A member who already
  engrainment                  already buys through      trusts us and buys
                               CoreTrust                 through us is the
                                                         easiest cross sell.
                                                         Weighted heavily on
                                                         purpose.

  Freight         15%          How much physical product A distributor ships
  intensity                    the industry moves        constantly, a software
                                                         firm does not.

  Contact         15%          Whether we can actually   A perfect prospect we
  actionability                reach the account         cannot contact is not
                                                         a prospect yet.

  Relationship    10%          A PE sponsor path and a   A warm door is worth
  warmth                       named account owner       more than a cold one.
  -----------------------------------------------------------------------------

3\. How each component is built

Freight opportunity, thirty percent

This starts from an estimated annual freight spend. Where we have
revenue, we multiply it by a transportation spend percentage that fits
the vertical. A distributor or wholesaler spends about seven and a half
percent of revenue on transportation, a manufacturer about six, consumer
goods about five and a half, retail about four and a half, and a
services firm under one percent. Where revenue is missing, we estimate
it from the employee count and an industry average, so a good account is
not penalized for a blank cell. The spend is then log scaled, because
the difference between a ten million dollar freight budget and a fifty
million dollar one matters more than the difference between five hundred
million and a billion. On that scale a ten million dollar budget scores
sixty and a one billion dollar budget scores one hundred.

+-----------------------------------------------------------------------+
| **Freight opportunity**                                               |
+-----------------------------------------------------------------------+
| freight_opportunity = log-scaled(est_freight_spend)                   |
|                                                                       |
| est_freight_spend = revenue x transport_pct\[vertical\]               |
|                                                                       |
| transport_pct = distribution 7.5%, manufacturing 6%, consumer 5.5%,   |
|                                                                       |
| retail 4.5%, services under 1%                                        |
|                                                                       |
| scale = \$10M -\> 60, \$1B -\> 100                                    |
|                                                                       |
| no size data -\> fall back to freight intensity                       |
+-----------------------------------------------------------------------+

CoreTrust engrainment, thirty percent

This is the member\'s existing relationship with CoreTrust, as a
percentile against the scored pool. Total reported spend through
CoreTrust carries eighty five percent, opportunities won this year and
recent activity carry the rest. A member who already runs a meaningful
share of their indirect spend through us has proven they trust the
model, so opening a logistics conversation is a warm continuation, not a
cold pitch. This is why engrainment is weighted as heavily as the
freight opportunity itself.

Freight intensity, fifteen percent

Intensity is a zero to one hundred read on how much physical product an
industry moves, mapped from the sub industry first and the industry as a
fallback. Wholesale, distribution, food and beverage, and building
materials score highest. Manufacturing scores ninety five. Retail scores
eighty. Services and software score near zero.

Contact actionability, fifteen percent

This keeps the score practical. It asks whether we can reach the account
today. A verified email for a person with a logistics title scores one
hundred. A verified generic contact scores less. A hand researched name
with no email scores forty. Nothing scores zero. A member can have a
large freight budget and still score poorly here, and that is correct,
because until we can reach a buyer the opportunity is theoretical.

Relationship warmth, ten percent

Warmth rewards a path in. A private equity backed member gives us a
sponsor route through the client executive who covers that sponsor. A
named account owner means someone at CoreTrust already has a
relationship to lean on. Warmth is the smallest weight because it is an
accelerant, not a reason on its own, but it breaks ties between two
otherwise similar accounts.

4\. The tiers, and what they mean

  ----------------------------------------------------------------------------
  **Tier**   **Score**   **What it means**           **What the rep does**
  ---------- ----------- --------------------------- -------------------------
  A          70 and      A real freight budget and a Call today. The best
             above       proven CoreTrust buying     conversations in the
                         habit                       file.

  B          55 and      Strong on freight and       Work these next. Most
             above       reachable, or strong        will qualify.
                         engrainment                 

  C          40 and      Some freight signal, but    Nurture. A lighter touch
             above       thinner size, engagement,   and a re-score as data
                         or reach                    improves.

  D          below 40    Little freight, little      Not worth qualifying yet.
                         engagement, or no way to    Leave it.
                         reach them                  
  ----------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Why A is strict**                                                   |
|                                                                       |
| A tier A account is not just a big shipper. The engrainment weight    |
| means an A must also already buy through CoreTrust. That points the   |
| rep at the accounts where the freight is real and the door is already |
| open.                                                                 |
+-----------------------------------------------------------------------+

5\. Who we leave out, on purpose

  -----------------------------------------------------------------------
  **Excluded**              **Why**
  ------------------------- ---------------------------------------------
  Non-US members            The current motion targets US based companies
                            only.

  K-12 districts, about     Schools do not run the kind of freight
  9,700 rows                program this engine sells.

  PE firm and venture       These are investors, not shippers. The
  records                   portfolio companies beneath them are the
                            targets.

  No signal service         Members with no freight relevance and no
  accounts                  engagement.

  Transportation and        Set aside. They are potential carriers or
  logistics companies       competitors. A private fleet member is a
                            backhaul conversation, and a member holding
                            broker authority sells freight services
                            themselves.
  -----------------------------------------------------------------------

6\. Service fit, so the rep knows what to pitch

-   **LTL,** for any member with a real freight profile.

-   **FTL,** when heavy verticals or scale suggest full loads.

-   **Retail cross dock,** for consumer, food, and apparel companies
    selling into retail.

-   **Freight forwarding and cross border,** for import or export heavy
    verticals and Canadian members.

-   **Brokerage,** broadly, for engaged shippers.

7\. How the score is used, every day

The score runs the day. The agent sorts the file by Fit v3, the rep
works the tier A and B accounts that have a contact, and the tier C
accounts wait in nurture. When the rep asks the agent about any member,
the first thing it says is the score and the tier, then the contact and
the suggested service. A new member is scored the day they register.
When a sponsor we cover buys a company, the agent scores the target and
flags the warm door. Outcomes feed back in, a booked meeting raises an
account, a disqualification drops it, and the next rebuild reflects what
actually happened.

+-----------------------------------------------------------------------+
| **The honest caveat**                                                 |
|                                                                       |
| Revenue is present on about a quarter of the rows and employee counts |
| on about a third, so some genuinely good accounts under-score on size |
| until the agent enriches them. That is a reason to enrich, not a      |
| flaw. And CoreTrust spend is all-category GPO spend, an engagement    |
| signal, not a freight number. The score reads it as trust, which is   |
| what it is.                                                           |
+-----------------------------------------------------------------------+
