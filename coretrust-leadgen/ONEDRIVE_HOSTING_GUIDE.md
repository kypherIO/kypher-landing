# CoreTrust Lead Gen: OneDrive Hosting Guide

## What "hosting on OneDrive" means here, and the one distinction that
## matters more than any other

Everything in this deliverable that needs to be *live* -- the workbook
Copilot Studio reads and writes, the dashboard (open it locally or via
the VPS mirror -- see Part 5's callout on why a plain OneDrive link
doesn't render it), the CSV exports -- lives in one OneDrive folder.
Everything that's *code* --
the pipeline script, the local helper scripts, the agent instructions, the
docs -- lives in this git repo and only needs to exist on whatever machine
you run Python from. This guide is entirely about the first category.

**Before anything else, resolve this:** "OneDrive, not SharePoint" does
**not** mean "personal/consumer OneDrive." It means "my own OneDrive
folder, not a shared SharePoint team site." Those are different axes, and
mixing them up is the single most common way this setup silently breaks:

| | Personal/consumer OneDrive (a `@outlook.com`, `@hotmail.com`, `@live.com`, or similar free Microsoft account) | **OneDrive for Business** (your CoreTrust work account) | SharePoint team site |
|---|---|---|---|
| Who has it | Anyone with a free Microsoft account | Anyone with an M365 work/school license (this is you, as a CoreTrust employee) | A shared site provisioned for a team, separate from any one person's OneDrive |
| Works with Copilot Studio's **Excel Online (Business)** connector | **No** | **Yes** | Yes |
| Works with Power Automate flows in a Copilot Studio agent at all | Not for a Copilot Studio agent built in a Power Platform environment tied to your work tenant | Yes | Yes |
| Is this what "OneDrive, no SharePoint" means in this project | No | **Yes -- this is the one** | No -- explicitly avoided per the requirement that set this up |

If you're not sure which one you're looking at: go to `onedrive.com` (or
`office.com` and click the OneDrive tile) signed in with your CoreTrust
email. If the top-left shows your organization's name/logo and the URL
after signing in contains `-my.sharepoint.com`, that's OneDrive for
Business -- the right one. If it's just `onedrive.live.com` with no
organization branding, that's personal OneDrive, and the setup below needs
a different account before Copilot Studio's flows will work -- it's
specifically the automated flows that require OneDrive for Business.

**Fallback if you genuinely only have personal OneDrive and no CoreTrust
M365 work account with Copilot Studio access:** the workbook and dashboard
still work perfectly as files you download and open by hand, and you can
run the `scripts/*.py` helpers against your local copy -- see
`README.md`'s weekly cadence for what that looks like without the six
Copilot Studio flows. You lose
the agent, not the tracking.

Everything past this point assumes OneDrive for Business.

---

## Part 1 -- Designing the folder

One top-level folder, a small number of purpose-built subfolders. Don't
mirror this git repo's structure inside OneDrive -- OneDrive holds the
*live working files*, not the code, docs, and source data that only ever
need to exist on your own machine.

```
OneDrive (CoreTrust)/
└── CoreTrust Lead Gen/
    ├── CoreTrust_Master_Members.xlsx      <- the one file everything reads/writes
    ├── CoreTrust_Activity_Dashboard.html  <- download and open locally, or
    │                                        use the VPS mirror for a real
    │                                        clickable link (Part 5)
    ├── Exports/                            <- Flow 5 (Export For Salesforce) writes here
    │   └── (CoreTrust_SFDC_Import_*.csv, one per export, dated)
    └── Archive/                            <- your own periodic backups, see Part 6
        └── (CoreTrust_Master_Members_YYYY-MM-DD.xlsx)
```

Why this shape:

- **The workbook and dashboard sit at the top level**, not nested, so the
  share links you generate in Part 5 are short and the flows in
  `agent/Copilot_Studio_Flow_Build_Guide.md` (which reference
  `/CoreTrust Lead Gen/Exports` directly) work without editing paths.
- **`Exports/` exists before you build Flow 5**, not after -- the OneDrive
  for Business connector's "Create file" action can create a file in an
  existing folder, but won't reliably create the *folder itself* on first
  run in every tenant configuration. Create it up front, once, and skip
  the debugging.
- **`Archive/` is yours, not a flow's.** Nothing writes here
  automatically; it exists because a workbook this many things write to
  (six flows, two local scripts, and you editing it by hand) benefits from
  periodic manual snapshots on top of OneDrive's own version history (Part
  6 covers both).

---

## Part 2 -- Step-by-step setup

1. **Sign in to OneDrive for Business** at `onedrive.com` (or via
   `office.com`) with your CoreTrust work account. Confirm the
   `-my.sharepoint.com` URL per the table above.
2. **Create the folder.** In OneDrive's web interface: **+ New > Folder**,
   name it `CoreTrust Lead Gen`. Inside it, **+ New > Folder** again,
   named `Exports`, and once more named `Archive`.
3. **Upload the starting files.** From this repo, upload:
   - `data/CoreTrust_Master_Members.xlsx` -> the top level of `CoreTrust Lead Gen/`
   - `dashboard/CoreTrust_Activity_Dashboard.html` -> the top level
   - `data/CoreTrust_SFDC_Import_Leads_sample.csv` -> `Exports/` (as a
     reference example, not a real export -- delete it once you've run a
     real one, or leave it, it won't confuse the flow)
   Drag-and-drop in the browser works, or use the desktop sync client
   (next step) and just copy the files into the local synced folder.
4. **Install and sign in to the OneDrive desktop client**, if it isn't
   already running (Windows: usually pre-installed; Mac:
   `apps.microsoft.com` or the Mac App Store). Add your CoreTrust account
   under **Settings > Add an account** if it isn't there. This is what
   makes the folder appear as a normal directory on your own machine, and
   it's what the local Python scripts (`log_touch.py`,
   `save_qualification.py`, `weekly_kpi_snapshot.py`) point at.
5. **Confirm sync status.** In File Explorer (Windows) or Finder (Mac),
   navigate to your OneDrive folder, find `CoreTrust Lead Gen`, and check
   for a green checkmark icon on the folder and on
   `CoreTrust_Master_Members.xlsx` specifically -- that means it's fully
   synced and available offline, not just a cloud placeholder (a blue
   cloud icon means "online only," which matters a lot, see Part 4).

**Checkpoint:** the folder exists in the OneDrive web UI with the three
items from step 3 inside it, and the same folder appears on your local
machine with a green "synced" checkmark on the workbook.

---

## Part 3 -- Files On-Demand, and why it can silently break the scripts

OneDrive's **Files On-Demand** feature keeps a placeholder for every cloud
file on your local disk without actually downloading it, to save space --
you see the file, but it isn't really there until you open it (a blue
cloud icon becomes a green checkmark the moment it downloads). This is
fine for browsing files by hand, but it causes a specific, confusing
failure for the Python scripts:

**The failure:** `python3 scripts/log_touch.py --file "C:\...\CoreTrust_Master_Members.xlsx"`
errors with something like "file not found" or a corrupt-file error, even
though the file clearly shows up in File Explorer -- because openpyxl
tries to read the placeholder before OneDrive has finished actually
downloading the real bytes.

**The fix, pick one:**

- **Right-click the workbook (and the dashboard/CSV, if you want them
  available offline too) > "Always keep on this device."** This forces a
  permanent local copy that stays in sync but is never just a cloud
  placeholder. Do this once, for this one file, rather than disabling
  Files On-Demand tenant-wide.
- Or, before running a script, **open the file once in Excel** (which
  forces a full download) and close it again.

**Checkpoint:** right-click `CoreTrust_Master_Members.xlsx` in File
Explorer/Finder -- the context menu should show "Free up space" as an
option (proving it's currently a full local copy, not a placeholder) and
"Always keep on this device" should show as already selected.

---

## Part 4 -- The local sync path, for the scripts

Every script in `scripts/` defaults to
`<repo>/coretrust-leadgen/data/CoreTrust_Master_Members.xlsx`, i.e. the
copy inside this git repo -- that's correct for testing changes to the
pipeline itself, but once you're operating for real, point every script
at the **OneDrive-synced copy** instead, with `--file`:

```bash
# Windows (adjust the org-specific path segment after \OneDrive - )
python3 scripts/log_touch.py --lead CT-00001 --channel Email \
  --file "C:\Users\rod\OneDrive - CoreTrust\CoreTrust Lead Gen\CoreTrust_Master_Members.xlsx"

# Mac
python3 scripts/log_touch.py --lead CT-00001 --channel Email \
  --file "$HOME/Library/CloudStorage/OneDrive-CoreTrust/CoreTrust Lead Gen/CoreTrust_Master_Members.xlsx"
```

The exact folder name after `OneDrive -` (Windows) or
`OneDrive-` (Mac, no space) is your organization's display name in your
tenant -- check File Explorer/Finder's sidebar for the literal name rather
than guessing. If you'll run these often, save yourself the retyping:

```bash
# once, in your shell profile (~/.bashrc, ~/.zshrc, or a Windows
# environment variable via System Properties > Environment Variables)
export CORETRUST_FILE="/path/to/your/OneDrive/CoreTrust Lead Gen/CoreTrust_Master_Members.xlsx"

# then every script call becomes:
python3 scripts/log_touch.py --lead CT-00001 --channel Email --file "$CORETRUST_FILE"
```

**Close the file in Excel before a script writes to it.** openpyxl can
usually still write while Excel has the file open for *reading*, but a
concurrent write from both sides is exactly the "file in use" conflict
Part 7 covers -- cheaper to just close it first.

---

## Part 5 -- Sharing by hyperlink (no SharePoint site, no email invite tour)

**This works reliably for the workbook. It does not work the same way for
the dashboard HTML file -- read the callout below before assuming a link
to the dashboard "just opens" for whoever you send it to.**

The workbook is straightforward: OneDrive natively previews and edits
`.xlsx` files in the browser (Excel Online), so a share link opens it as
a real, interactive spreadsheet. Steps:

1. In OneDrive (web or desktop), **right-click the file > Share.**
2. Click the link-type dropdown (default is usually "People in
   [Organization] with the link" or similar) and pick the right scope:
   - **"People in CoreTrust with the link"** -- recommended default for
     both the workbook and the dashboard. Anyone with a CoreTrust account
     who has the link can open it; nobody outside the org can, even with
     the link.
   - **"People with existing access"** -- if you've already shared it with
     specific people and just want the link they already have.
   - **Avoid "Anyone"** for the workbook -- it contains real company and
     contact records. The dashboard HTML is lower-risk (it's aggregated
     KPIs unless someone loads a raw export into it) but there's no reason
     to widen it past "People in CoreTrust" either.
3. Set permission: **"Can view"** for anyone who just needs to read it
   (most people); **"Can edit"** only for yourself and anyone who should
   be writing to it directly (a category SME updating `Meeting_Status` on
   `SME HANDOFF`, for instance).
4. Optional, for extra caution on the workbook specifically: click
   **"Set expiration date"** if this is meant to be a time-boxed pilot
   link, or add a **password** (OneDrive for Business supports both on
   view links, tenant policy permitting).
5. **Copy link**, and that's what you hand out -- no SharePoint site
   invite, no separate access request flow.

**Checkpoint:** open the link in a private/incognito browser window while
signed out (or from a different account) -- confirm it correctly prompts
for CoreTrust sign-in rather than opening for anyone.

**The dashboard HTML file is a different case, and the honest answer is
that a OneDrive share link to it will not reliably render as a live,
interactive page.** OneDrive's browser preview only renders a specific
set of file types (Office documents, PDFs, images, video). A raw `.html`
file isn't one of them -- sharing its link typically either shows the
**raw HTML source as text** or **prompts a download**, rather than
executing the page's JavaScript. This isn't a bug or a settings problem
to fix: Microsoft deliberately doesn't execute arbitrary uploaded
JavaScript under a trusted `onedrive.live.com`/`sharepoint.com` origin,
since doing so would let anyone who can upload a file run script under a
domain the browser (and any logged-in session) trusts. The dashboard's
canvas charts, CSV loader, and computed tiles all depend on that
JavaScript actually running, so a source-code view or a forced download
doesn't give the recipient a working dashboard.

Two ways to actually get "click a link, the dashboard renders":

1. **The VPS mirror** (`deploy/DEPLOY_CORETRUST.md`, repo root) -- a real
   web server (Caddy) serves the file with the correct content type and
   no sandboxing, so it renders exactly like any other website. This is
   the recommended path if you need a clickable link at all; it's
   password-gated and excluded from search indexing.
2. **Download and open locally.** The recipient downloads the `.html`
   file from OneDrive (not previews it) and double-clicks it -- opening a
   local file directly in a browser (a `file://` URL) does execute its
   JavaScript normally, since that trust boundary doesn't apply to files
   already on your own disk. This works, but it's "send the file," not
   "send a link that just opens."

The workbook doesn't have this problem -- Excel Online is a genuine
rendering surface for `.xlsx`, so its share link behaves the way you'd
expect.

---

## Part 6 -- Version history and recovering from a bad overwrite

A file this many things write to (six Copilot Studio flows, three local
scripts, and you editing it by hand) will eventually have a bad write --
someone runs an old pipeline output over the top of a day's worth of real
touches, a flow bug writes garbage into a cell, whatever it is. OneDrive
has your back here, in two layers:

1. **Automatic version history.** Right-click the workbook in OneDrive
   web (or **File > Info > Version History** in desktop Excel) -> **Version
   History**. Every save (by Excel, by a flow's Excel Online action, or by
   a Python script) creates a new version automatically, kept for a good
   while by default. Pick any prior version and **Restore** to roll the
   whole file back, or **Download a copy** if you just want to compare and
   manually pull a few cells forward.
2. **Your own `Archive/` snapshots**, because version history has a
   retention window and isn't infinite. Periodically -- weekly is
   reasonable during the pilot, per `docs/CoreTrust_POC_Implementation_Timeline.md`'s
   cadence -- copy the current workbook into `Archive/` with a dated
   filename: `CoreTrust_Master_Members_2026-09-09.xlsx`. This costs
   nothing (OneDrive storage, not a new tool) and gives you a hard,
   unambiguous backup independent of OneDrive's own retention settings.

**Checkpoint:** open Version History on the live workbook right now, while
nothing is wrong, so you know exactly what the restore flow looks like
before you ever need it under pressure.

---

## Part 7 -- Avoiding conflicts between writers

With six flows, three scripts, and manual editing all touching one file,
two failure modes show up eventually:

- **"File in use" / a `.tmp` conflicted copy appears** (e.g.
  `CoreTrust_Master_Members-rod's-PC.xlsx`). This happens when two
  processes save at nearly the same moment -- most often you editing in
  desktop Excel while a flow (or a script) also writes. OneDrive resolves
  it by keeping both and naming the second one a conflicted copy rather
  than silently discarding either.
  - **Fix:** open both, manually merge whatever changed (usually just a
    row or two), delete the conflicted copy, save the original.
  - **Prevention:** close the workbook in Excel before running a local
    script (Part 4), and prefer working the file through the agent
    (which goes through flows, serialized) over hand-editing rows the
    agent is also actively working, during business hours.
- **A flow errors with a locking/timeout message.** Excel Online
  (Business) briefly locks a workbook during a write; if two flows (or a
  flow and a script) hit it in the same second, one gets a transient
  error. This is usually not a data problem -- check the file (per the
  flow guide's own gotcha: "flow says failed but the row is actually
  written," trust the file over the error).

Neither of these is a sign anything is fundamentally broken -- they're the
normal cost of one file having several writers, and both are recoverable
in under a minute using what's already in Parts 6-7.

---

## Part 8 -- Confirming Copilot Studio sees this exact file

This is worth re-checking any time something in the folder structure
changes (a rename, a move, sharing settings), because it's the most common
reason a flow that worked yesterday stops finding "the" file today:

1. In the flow (Power Automate), open the **Excel Online (Business)**
   action, click the **Location/Document Library** and **File** fields.
2. The picker should show your OneDrive for Business root and let you
   browse into `CoreTrust Lead Gen/CoreTrust_Master_Members.xlsx`
   directly, or you can switch the field to "Enter custom value" and paste
   the file's ID (from its OneDrive URL) if the picker is slow with a
   large OneDrive.
3. **If the file doesn't appear in the picker at all:** the connection
   (Part "Prerequisites" in the workshop guide) is signed into a
   *different* account than the one that owns this OneDrive folder --
   Power Automate connections are per-account, and it's easy to have
   authenticated with a secondary or shared account by accident. Fix:
   remove and re-add the Excel Online (Business) connection, sign in with
   the exact account from Part 2 above.
4. **If you ever move or rename the file or the folder**, every flow that
   references it by picker (not by typed path) needs to be re-pointed --
   the picker stores an internal file ID, and a rename usually still
   resolves correctly, but a *move to a different folder* sometimes
   doesn't. Re-open each flow's Excel action and re-confirm the file after
   any folder restructuring.

---

## Part 9 -- Mobile and offline access

- **OneDrive mobile app** (iOS/Android): sign in with your CoreTrust
  account, navigate to `CoreTrust Lead Gen/`, tap the workbook to view it
  in the Excel mobile app (full editing works too, same conflict caveats
  as Part 7) or tap the dashboard HTML to open it in your phone's browser.
- **Make the workbook available offline on mobile** (tap the file, toggle
  "Available offline" / the pin icon) if you expect to check it somewhere
  without signal -- otherwise it needs a live connection to open.
- The **dashboard HTML works fully offline once downloaded** -- it has no
  server dependency, it just needs a CSV export loaded (or the demo data)
  to show anything, so it's a reasonable thing to keep a local copy of on
  a laptop that travels.

---

## Part 10 -- Backup and data governance, briefly

This workbook holds real company names, contact names, titles, emails,
and phone numbers. A few habits worth having beyond what's already
covered:

- **Don't widen the share link past "People in CoreTrust"** (Part 5) --
  there's essentially never a reason a lead-generation workbook needs to
  be reachable by someone outside the organization.
- **Prefer "Can view" over "Can edit"** for anyone who doesn't need to
  write to the file directly -- a category SME reviewing `SME HANDOFF`
  rarely needs edit access to the whole workbook.
- **`Archive/` snapshots (Part 6) are also real company data** -- they
  inherit the same sensitivity as the live file, not a lesser copy just
  because they're a backup. Don't relax sharing on the Archive folder
  "since it's just old copies."
- If your tenant has **Microsoft Purview sensitivity labels** available,
  apply one (e.g. "Confidential" or your org's equivalent for
  customer/prospect data) to the workbook -- ask your M365 admin if you're
  not sure what's configured. This is optional and tenant-dependent, not
  required for the setup above to work.

---

## Part 11 -- Troubleshooting reference

| Symptom | Cause | Fix |
|---|---|---|
| Script errors "file not found" even though it's visible in File Explorer/Finder | Files On-Demand placeholder, not a real local copy | Part 3 -- "Always keep on this device" |
| Flow's file picker shows an empty OneDrive, or the wrong one | Connection signed into the wrong account | Part 8, step 3 -- re-add the connection with the right account |
| A `-rod's-PC` or similarly renamed duplicate file appears | Two writers saved at the same moment | Part 7 -- merge and delete the duplicate; prevent by closing Excel before running scripts |
| Excel Online (Business) connector doesn't work at all / not available in your tenant | You're on personal/consumer OneDrive, not OneDrive for Business | Part 0's table -- confirm which OneDrive you actually have |
| A flow that worked yesterday now says it can't find the file | The file or its folder was moved or renamed | Part 8, step 4 -- re-point the flow's Excel action |
| Formulas (`SLA_Status`, KPI DASHBOARD tiles) show blank when read by a script, but look fine in Excel | The file was written by openpyxl (a script or the pipeline) and never opened in real Excel since, so there's no cached formula value | Open the file once in desktop Excel, let it recalculate, save (per the main `README.md`'s "First open" note) |
| You shared the link with someone and they can't open it | Link scope is "People in CoreTrust" but they're external, or they need to be signed into the right account | Confirm their account, or deliberately widen scope only if that's really intended (see Part 10 before doing this for the workbook) |
| Sync icon stuck on "processing changes" for a long time | Usually a large file mid-upload/download on a slow connection, or OneDrive needs a restart | Wait it out for the initial multi-MB workbook sync; if stuck past a few minutes, right-click the OneDrive tray/menu-bar icon and restart the app |

---

## Quick-copy setup checklist

- [ ] Confirmed OneDrive **for Business** (not personal), per Part 0's table
- [ ] Created `CoreTrust Lead Gen/`, `CoreTrust Lead Gen/Exports/`,
      `CoreTrust Lead Gen/Archive/`
- [ ] Uploaded `CoreTrust_Master_Members.xlsx` and
      `CoreTrust_Activity_Dashboard.html` to the top level
- [ ] Desktop OneDrive client installed and signed into the right account
- [ ] Workbook set to "Always keep on this device" (Part 3)
- [ ] Opened the workbook once in desktop Excel so formulas have cached
      values
- [ ] Generated a "People in CoreTrust, Can view" share link for the
      workbook and the dashboard (Part 5)
- [ ] Confirmed Copilot Studio's Excel Online (Business) connector can see
      the file in its picker (Part 8)
- [ ] Reviewed Version History once, so you know what it looks like before
      you need it (Part 6)
