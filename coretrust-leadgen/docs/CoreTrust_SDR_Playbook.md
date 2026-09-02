# CoreTrust SDR Playbook

*This is the canonical operating playbook -- cadence, KPI targets, phase
timeline, and nurture/recycle rules elsewhere in this repo are built to
match it. Where an earlier doc (the master handoff, the investment
proposal) states a number that conflicts with this one, this playbook
wins; see each corrected doc's own note on what changed and why.*

## Current Challenge

CoreTrust has demonstrated demand across logistics and material
handling, but it lacks a deliberate, repeatable engine for capturing
that demand and converting strong leads into qualified opportunities.

## Process Gaps

-   Leads are sourced manually with no consistent enrichment process.

-   Lead data is not systematically entered into Salesforce.

-   Qualification standards vary by sales representative.

-   The realization gap between committed and actual member spend
    continues to rebuild.

## Commercial Impact

The pipeline often favors the supplier or category that is easiest to
sell rather than the solution that best fits the member's needs. This
reinforces a bias toward simpler, more transactional opportunities.

As a result, CoreTrust risks prioritizing short-term GTV over strategic
GTV from more sophisticated categories. Capturing these opportunities
would create deeper member relationships, strengthen supplier
partnerships, and provide more durable value for CoreTrust.

## Proposed Operating Model

Establish a small, focused team dedicated to enriching and qualifying
complex opportunities. The team would convert existing member demand
into well-developed logistics opportunities that subject matter experts
can advance quickly.

### Proof of Concept

Begin with one employee managing the process during the pilot stage. AI
agents would support the work by:

-   Researching and enriching leads

-   Scoring and ranking opportunities

-   Drafting outreach and follow-up communications

-   Logging activity and maintaining records

-   Tracking KPIs to indicate throughput rate and proving the success
    backed by sound data points.

This structure allows the employee to spend more time speaking with
high-potential members instead of completing repetitive administrative
tasks.

### Strategic Outcome

The model is designed to generate larger, more sophisticated
opportunities that secure strategic GTV rather than relying primarily on
transactional GTV.

### Investment Approach

Prove the model manually using existing tools, measure the results, and
invest in additional capabilities only when the performance justifies
the cost.

## Eight-Step Lead Generation Model

The model creates a structured path from lead intake through
qualification, Salesforce handoff, and performance measurement. Each
step builds on the previous one to ensure opportunities are consistently
enriched, prioritized, engaged, and routed.

  -----------------------------------------------------------------------
  **Step**      **What happens**
  ------------- ---------------------------------------------------------
  1\. Ingest    Members come from the Salesforce export and the freight
                analysis.

  2\. Enrich    The agent researches the web to add contacts and freight
                signals.

  3\. Tier      Follows scoring methodology, where each member and sorts
                them into tiers respective to propensity to certain
                category.

  4\. Engage    The rep works an eight touch cadence with templatized
                email.

  5\. Qualify   Five markers plus a discipline gate decide who is real.

  6\. Route     Each qualified lead goes to the right supplier by spend
                tier.

  7\. Load      Qualified leads export to Salesforce by file.

  8\. Measure   A dashboard tracks the week against benchmarks.
  -----------------------------------------------------------------------

## Initial Logistics Pilot

Logistics was selected as the initial feasibility test because CoreTrust
can readily evaluate which members align with the category's available
solutions. The pilot provides a practical way to test the scoring,
enrichment, and qualification process using a defined set of member and
category criteria.

## Scalable Category Model

The approach is designed to be repeatable across categories. Each
category can apply the same core framework while adjusting its scoring
criteria, demand signals, and solution requirements.

The model follows a consistent process:

1.  Define the category's ideal member profile.

2.  Evaluate members against relevant fit and demand signals.

3.  Prioritize the strongest opportunities for enrichment and outreach.

4.  Qualify and route validated leads to the appropriate category expert
    or supplier.

## Weighted Scoring Methodology

Each member receives a weighted score based on opportunity size,
existing engagement, freight intensity, contact availability, and
relationship strength. The combined score helps prioritize members with
the strongest fit and the clearest path to action.

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

## Tiered Rankings

The resulting score assigns each member to a priority tier based on its
alignment with the category offering. These tiers guide outreach
sequencing, enrichment effort, and qualification focus.

  ----------------------------------------------------------------------------
  **Tier**   **Score**    **Meaning**
  ---------- ------------ ----------------------------------------------------
  A          70 and above Real freight budget and a proven CoreTrust buying
                          habit. Call today.

  B          55 and above Strong on freight and reachable. Work next.

  C          40 and above Some signal, thinner. Nurture and enrich.

  D          below 40     Not worth qualifying yet.
  ----------------------------------------------------------------------------

After a member is assigned to a priority tier, additional
category-specific enrichment can further assess its fit for a particular
offering. In logistics, estimated freight spend is used to route each
qualified opportunity to the solution and supplier best suited to its
scale and complexity. This allows SMEs to easily navigate, which
supplier might align with the respective member spend category.

Spend-Tier Routing

  -------------------------------------------------------------------------
  Estimated Annual Routing Tier    Recommended Solution or Supplier
  Freight Spend                    
  ---------------- --------------- ----------------------------------------
  Less than \$700K Transactional   CoreTrust Connect

  \$700K to less   Conditional     CoreTrust Connect; consider managed
  than \$1M        Review          transportation only if lane analysis
                                   confirms meaningful savings

  \$1M to less     Strategic S1    Redwood
  than \$2M                        

  \$2M to less     Strategic S2    Redwood or GEODIS, based on solution fit
  than \$5M                        

  \$5M to less     Strategic S3    GEODIS
  than \$10M                       

  \$10M or more    Strategic S4    GEODIS enterprise solution
  -------------------------------------------------------------------------

## Investment Case for Scale

### Proof of Concept

The model can operate today with one employee using existing tools to
research, enrich, and qualify leads. The pilot should validate the
underlying data, demonstrate improvements in opportunity quality, and
establish measurable performance benchmarks.

### Funding Request

If the pilot produces credible results, CoreTrust should invest in
targeted automation to scale lead enrichment and accelerate handoff. The
request is primarily for tool activation, integration, and security
approval rather than the purchase of a new enterprise platform.

### Investment Priorities

The following investments should be evaluated based on their ability to
improve contact reachability, speed to lead, portfolio coverage, and
qualified opportunity conversion.

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

KPI Measurement Framework

Sales development should be measured by outcomes, not activity alone.
Sending a high volume of emails has little value if those efforts do not
create engagement, qualified opportunities, or revenue.

The KPI framework separates measures into three levels:

1.  **Success metrics:** Primary outcomes used to evaluate whether the
    model is working.

2.  **Leading indicators:** Early signals that show whether performance
    is moving in the right direction.

3.  **Coaching metrics:** Activity measures used to identify process
    gaps and improve individual execution.

This structure keeps the team focused on conversion and commercial
impact while still providing enough detail to manage and improve the
process.

  --------------------------------------------------------------------------
  Measurement   Key Question                 How It Should Be Used
  Level                                      
  ------------- ---------------------------- -------------------------------
  Level 1:      Did the team create          Use for leadership reporting,
  Outcomes      qualified pipeline and       performance evaluation, and
                measurable commercial value? incentive decisions.

  Level 2:      How effectively is activity  Use to identify funnel gaps,
  Conversion    converting into engagement   improve execution, and focus
                and qualified opportunities? coaching.

  Level 3:      Is the representative        Use for coaching and process
  Activity      completing enough of the     management. Do not treat
                right actions consistently?  activity alone as a measure of
                                             success.
  --------------------------------------------------------------------------

Outreach Performance Metrics

Each KPI compares a 2026 industry benchmark with the target for one
employee managing outreach to CoreTrust members.

Targets are intentionally conservative for the current manual process,
which requires the employee to research and enrich leads through
web-based sources. Expectations should increase as automation, data
enrichment, and workflow tools are introduced through the roadmap.

Level 1: Leadership Outcome KPIs

  ------------------------------------------------------------------------
  **KPI**         **2026             **Our              **Why** 
                  benchmark**        current-state      
                                     target**           
  --------------- ------------------ ------------------ ------------------
  Qualified       8 to 15 (outbound  6 to 10            One person, manual
  opportunities   SDR)                                  research. This is
  per month                                             the number that
                                                        proves the POC. 

  Pipeline        \$150K to \$400K   \$1M+ influenced   A single strategic
  created per     per SDR per        per month          freight account
  month           quarter                               carries \$1M+ in
                                                        spend, so a few
                                                        land big. 

  Speed to lead   respond within 5   new lead under 24  The single most
                  minutes lifts      hours, replies     controllable
                  qualify odds 21x   under 1 hour       outcome driver. 

  Qualified to    30 to 50%, median  40% or better      The five-marker
  opportunity     40%                                   gate keeps this
  rate                                                  honest. 

  Cost per        derived, a few     a small fraction   The whole economic
  qualified       hundred dollars    of one \$1M        case in one
  opportunity                        account            number. 
  ------------------------------------------------------------------------

Level 2: Conversion KPIs and Performance Levers

  ---------------------------------------------------------------------------------
  **KPI**         **2026             **Our        **Diagnoses** 
                  benchmark**        target**     
  --------------- ------------------ ------------ ---------------------------------
  MQL to SQL,     15 to 30%, median  22% or       Targeting and scoring quality. 
  marker 1 to 3   22%                better       
  pass                                            

  Positive reply  2 to 5% cold, 8 to beat 5%, we  Message and list quality. 
  rate            15% trigger-based  work warm    
                                     members      

  Meetings per    1 to 4, good is 3  3 to 4       The output metric that matters
  100 emails      to 4                            most. 

  Meeting show    70 to 85%          80%+         Confirm 24 hours ahead, book
  rate                                            within a week. 

  Connect rate on 5 to 12%           8 to 12%     Data quality and call timing. 
  calls           mid-market                      

  SQL to          14%, top quartile  track, prove Overall qualification and fit. 
  closed-won,     22%                over time    
  outbound                                        
  ---------------------------------------------------------------------------------

Level 3: Activity KPIs for Coaching

  ----------------------------------------------------------------------------
  KPI           2026 Benchmark    Current-State   Coaching Guidance
                                  Target          
  ------------- ----------------- --------------- ----------------------------
  Touches per   8 to 12 across    8 touches over  Use a coordinated mix of
  sequence      multiple channels 14 days         email and phone rather than
                                                  relying on a single channel.

  Emails        Agent drafts;     10 to 20 with   Use drafting support to
  drafted and   representative    agent support   reduce preparation time
  sent per day  reviews and sends                 while preserving human
                                                  review.

  Calls per day 40 to 60 in a     15 to 30        Prioritize well-researched
                high-volume                       members and conversation
                outbound model                    quality over raw call
                                                  volume.

  Cadence       60% to 75%        70% or higher   Complete the full sequence
  completion                                      unless the member responds,
  rate                                            opts out, or is
                                                  disqualified.
  ----------------------------------------------------------------------------

How to Interpret the Targets

The pilot is not expected to match the call volume of a full-time sales
development representative because one employee will also manage
research, enrichment, and other responsibilities. Instead, agent support
should improve productivity on the measures that matter most: speed to
lead, positive reply rate, meetings created, and qualified
opportunities.

Activity targets are intentionally lower than high-volume industry
benchmarks. They should be used for coaching and process management,
while outcome and conversion KPIs remain the primary measures of
success.

Recommended Outreach Cadence

2026 research indicates that one or two touches are rarely enough to
generate a response. An effective cadence uses 8 to 12 touches over 14
to 21 days, with each touch spaced two to three business days apart.

#### Cadence Principles

-   **Use multiple channels:** Combine email, phone, and LinkedIn rather
    than relying on one channel.

-   **Maintain consistent spacing:** Allow two to three business days
    between touches.

-   **Change channels after repeated attempts:** Response rates
    typically level off after six touches through a single channel.

-   **Include a final closing message:** A well-written final touch can
    generate 10% to 15% of all responses.

The recommended CoreTrust cadence follows these principles while
allowing representatives to adjust timing and channel mix based on
member engagement.

  ----------------------------------------------------------------------------
  Touch   Day   Channel     Purpose
  ------- ----- ----------- --------------------------------------------------
  1       0     Email       Introduce the opportunity and connect the value
                            proposition to the member's profile.

  2       0 to  Call and    Make the first live contact attempt and reinforce
          1     voicemail   the initial email.

  3       3     Reply email Follow up with a new angle, such as a relevant
                            member savings example.

  4       4     LinkedIn    Send a brief connection request that reinforces
                            familiarity.

  5       7     Call and    Make a second call at a different time of day to
                voicemail   improve reachability.

  6       8     Email       Share a relevant case study, proof point, or
                            member outcome.

  7       11    Call        Make the final live contact attempt and address
                            any likely objections.

  8       14    Email and   Close the loop, provide an easy response option,
                LinkedIn    and leave the door open for future follow-up.
  ----------------------------------------------------------------------------

Response Service-Level Agreements

  -----------------------------------------------------------------------
  Trigger               Required Response
  --------------------- -------------------------------------------------
  Hot or inbound lead   Respond the same business day, with a target of
                        two hours or less.

  New lead added to the Complete the first outreach within 24 hours.
  intake file           

  Member or prospect    Respond within one business hour.
  reply                 

  Lane or invoice data  Begin action within 48 hours and route same day
  received              when Redwood review is required.

  Outreach activity     Log every touch in the touchpoint tracker on the
  completed             same business day.
  -----------------------------------------------------------------------

Retry, Nurture, and Recycle Rules

-   **Move to nurture after no response:** After eight completed touches
    without a reply, move the member to Nurture. Do not delete the
    record. The opportunity may not be ready now, but it is not
    necessarily lost.

-   **Recycle when a new trigger appears:** Re-enter the member into the
    cadence after a contract renewal, private equity event, FedEx
    exposure, new intent signal, or another relevant change.

-   **Schedule a dated follow-up:** If the member indicates that the
    timing is not right this quarter, record the expected budget cycle
    and schedule the next touch accordingly.

-   **Apply a disposition reason:** Assign a reason code to every
    removed opportunity. Suppress members that are confirmed nonbuyers
    and recycle those that may be viable later.

Operating Rhythm

Consistency is essential to the model. The operating rhythm defines what
the representative and agent complete each day, how progress is reviewed
each week, and how information moves through the workflow.

Daily Rhythm: Representative and Agent Responsibilities

  -------------------------------------------------------------------------
  **Time**     **The rep**           **The agent, in the background** 
  ------------ --------------------- --------------------------------------
  Morning, 15  Asks the agent, who   Returns the ranked list, Tier A and B,
  min          do I call today       with the follow-ups that are due
                                     first 

  Morning      Works the calls and   Drafts each email to the title, logs
  block        the follow-ups        every touch, updates the sheet 

  Midday       Runs qualification    Captures the five markers, sets
               calls                 Qualified, names the supplier 

  Afternoon    Reviews and sends the Keeps the touchpoint clock current,
               drafted emails        flags who is due next 

  End of day   Reads the learning    Writes three lines, which sources,
               note                  titles, and angles worked 
  -------------------------------------------------------------------------

Weekly Operating Rhythm

  --------------------------------------------------------------------------
  **Cadence**    **What happens** 
  -------------- -----------------------------------------------------------
  Monday         Pull the week\'s working set, Tier A and B that are Ready
                 to Call, plus anyone the enrichment flow promoted over the
                 weekend. 

  Daily          Work the list, send the drafts, log the touches, keep speed
                 to lead inside SLA. 

  Wednesday      Mid-week check on the dashboard, are we on pace for
                 qualified opportunities, is anyone slipping past their
                 follow-up. 

  Friday         Weekly review, the dashboard against the KPI targets,
                 export qualified leads to Salesforce, note what to change. 

  Every Friday   Fifteen-minute review with the manager, one thing working,
                 one thing to fix. 
  --------------------------------------------------------------------------

How the Workflow Connects

The master file serves as the system of record for lead prioritization.
Each day, the agent reads the file, ranks the highest-priority members,
and produces the representative's working list.

The workflow then operates as a continuous loop:

1.  The representative completes calls and reviews agent-drafted emails.

2.  The agent records each touch in the touchpoint tracker.

3.  The tracker determines follow-up timing and feeds the next day's
    working list.

4.  Qualified leads are exported to Salesforce.

5.  The dashboard summarizes weekly activity, conversion, and follow-up
    needs.

6.  Nightly enrichment adds new information, updates scores, and expands
    the callable pool.

Each step provides the input for the next, creating a repeatable process
that improves as more data and activity are captured.

Weekly Leadership Dashboard

The activity dashboard provides a single-page view of weekly
performance. It reads the touchpoint tracker export and gives leadership
direct access to the current results without requiring a separate
report.

-   **Headline metrics:** Total touches by channel, meetings booked,
    positive reply rate, and members requiring follow-up.

-   A follow-up list, the accounts where the SLA is breached or the next
    touch is due, so nothing slips. 

-   **Funnel performance:** Lead movement from outreach through
    qualification, routing, and Salesforce handoff.

-   **Timing and compliance:** Speed to lead, overdue follow-ups, and
    SLA performance.

-   **Weekly management view:** Progress against KPI targets, notable
    wins, and the most important process issue to address next.

Roadmap: Crawl, Walk, Run

The model begins with existing tools and earns each additional
investment through measurable results. Each phase has a defined
operating model, expected benefit, and trigger for advancing to the next
stage.

Crawl: Prove the Model

  ------------------------------------------------------------------------
  Operating Model           Success Measures       Advance to Walk When
  ------------------------- ---------------------- -----------------------
  One employee uses the     Generate 6 to 10       Manual enrichment or
  agent, Excel, and a       qualified              CRM entry becomes the
  manual Salesforce upload. opportunities per      primary constraint on
  The agent enriches leads  month, meet            output, rather than
  through structured web    speed-to-lead SLAs,    lead quality or
  research.                 and exceed a 5%        available demand.
                            positive reply rate.   

  ------------------------------------------------------------------------

Walk: Automate the Constraints

  ------------------------------------------------------------------------
  Capabilities Added    Value Unlocked           Advance to Run When
  --------------------- ------------------------ -------------------------
  Connect Salesforce    Automate CRM creation,   The Tier A and Tier B
  through Power         eliminate manual file    pipeline consistently
  Automate and activate uploads, and improve     exceeds one employee's
  the ZoomInfo API      contact accuracy,        capacity and verified
  using existing        reachability, and        demand supports broader
  licenses.             response rates.          investment.

  ------------------------------------------------------------------------

Run: Scale Across Categories

  -----------------------------------------------------------------------
  Capabilities Added     Value Unlocked            Expected Outcome
  ---------------------- ------------------------- ----------------------
  Add a private equity   Convert one sponsor       Produce 15 or more
  enrichment platform,   relationship into         qualified
  expand Copilot Studio  multiple                  opportunities per
  automation, and hire a portfolio-company         representative each
  second representative  conversations, automate   month while supporting
  when justified by      enrichment at scale, and  multiple category
  demand.                apply the same engine     scores for the same
                         across logistics and      member base.
                         material handling.        

  -----------------------------------------------------------------------

Implementation Timeline

  -------------------------------------------------------------------------
  Phase        Timeframe   Primary Objective
  ------------ ----------- ------------------------------------------------
  Launch and   Days 1 to   Configure the agent and workflows, load the
  Baseline     30          master file, begin outreach to Tier A and Tier B
                           accounts, and establish baseline performance.

  Validate the Days 31 to  Generate 6 to 10 qualified opportunities,
  Pilot        60          validate speed to lead and reply rates, and
                           identify the first constraint that requires
                           investment.

  Automate and Days 61 to  Connect Salesforce, activate ZoomInfo, measure
  Present      90          the performance lift, and present the funded
                           recommendation to leadership.

  Expand the   Months 4 to Evaluate a private equity enrichment tool, add
  Model        6           material handling scoring, and determine whether
                           demand supports a second representative.

  Scale Across Month 7 and Build a small operating pod, expand automated
  Categories   Beyond      enrichment, and run logistics and material
                           handling through one shared lead-generation
                           engine.
  -------------------------------------------------------------------------
