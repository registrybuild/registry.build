---
name: Understanding Update Flow
description: Explains the registry.build update pipeline data flow, from BCR cloning through GitHub API fetching to website deployment. Use when modifying the update process, debugging data issues, or understanding how registry data is collected and published.
---

# Update Pipeline Data Flow

This document maps the complete update pipeline: what data flows in, how it's transformed, where it's stored, and how the website consumes it.

## Pipeline Overview

The update pipeline runs every 4 hours via `.github/workflows/update.yml` and processes data in seven sequential phases:

```
BCR Clone → Parse Modules → Add Repos → Shuffle → Fetch GitHub → Aggregate → Write Output
```

Each phase has specific inputs/outputs and side effects. The final outputs feed the website build.

## Phase-by-Phase Flow

### Phase 1: Clone BCR

**Entry point**: `tools/update.go:39-42` calls `clone()`

**Inputs**:
- Flag: `--clone` (forces fresh clone)
- Network: `https://github.com/bazelbuild/bazel-central-registry.git`

**Outputs**:
- Directory: `registry/github/bazelbuild/bazel-central-registry/clone/`
- Contains: Full git repository with `modules/` directory

**Side effects**:
- Git clone (or skip if exists and `--clone=false`)
- ~100MB+ disk space

**Key behavior**: Only clones once unless forced. This directory is the source of truth for BCR module metadata.

---

### Phase 2: Walk BCR

**Entry point**: `tools/update.go:44-47` calls `walk()`

**Inputs**:
- Directory: `registry/github/bazelbuild/bazel-central-registry/clone/modules/`
- Files read per module:
  - `modules/MODULE_NAME/metadata.json` (maintainers, homepage, repository URLs)
  - `modules/MODULE_NAME/VERSION/source.json` (source URL, integrity hash)
  - `modules/MODULE_NAME/VERSION/MODULE.bazel` (module definition)
  - `modules/MODULE_NAME/VERSION/presubmit.yml` (build config)
  - `modules/MODULE_NAME/VERSION/patches/*` (patch files)

**Outputs**:
- In-memory: `[]Module` structs with fields:
  - `Name`: Module name (e.g., "rules_go")
  - `Repository`: GitHub repos (e.g., ["github:bazelbuild/rules_go"])
  - `Versions`: Version list (e.g., ["0.42.0", "0.41.0"])
  - `VersionData`: Map of version → source/module/patches data

**Side effects**: None (pure read operation)

**Key behavior**: Extracts all BCR modules and their versions. This is the authoritative module list that maps modules to GitHub repositories.

---

### Phase 3: Add Additional Repos

**Entry point**: `tools/update.go:49-220` (inline code)

**Inputs**:
- In-memory: `[]Module` from Phase 2
- Hardcoded: `additionalRepos` array (150+ repos like "bazelbuild/bazel", "Vertexwahn/rules_ispc")
- Hardcoded: Special-case modules (lines 208-219)

**Outputs**:
- In-memory: Updated `[]Module` array (BCR modules + additional repos)

**Side effects**: None

**Key behavior**:
- Appends repos not yet in BCR but relevant to Bazel community
- These repos have minimal Module structure (just Repository field)
- Some repos appear in BOTH BCR and additionalRepos (creates duplicates)

**Important**: Lines 69 and 106 contain the hardcoded additional repos that must use correct GitHub username casing.

---

### Phase 4: Shuffle and Limit

**Entry point**: `tools/update.go:221-223`

**Inputs**:
- In-memory: `[]Module` (all modules)

**Outputs**:
- In-memory: `[]Module[:200]` (randomized, first 200)

**Side effects**: None

**Key behavior**:
- Rate limiting: Only 200 repos get fresh GitHub data per run
- Random selection: Different repos each run
- **Critical limitation**: Remaining repos get stale data in final output

---

### Phase 5: Fetch GitHub Data

**Entry point**: `tools/update.go:224-245` calls `getReadme()`, `getMetadata()`, `getReleases()`

**Inputs**:
- In-memory: `[]Module[:200]` (limited list)
- Flag: `--fetch` (forces re-fetch)
- Network: GitHub API
  - `https://api.github.com/repos/OWNER/REPO/readme` (HTML)
  - `https://api.github.com/repos/OWNER/REPO` (metadata)
  - `https://api.github.com/repos/OWNER/REPO/releases` (releases)

**Outputs** (per repo):
- File: `registry/github/OWNER/REPO/readme.html`
  - Rendered HTML from GitHub README
- File: `registry/github/OWNER/REPO/metadata.json`
  - Full GitHub repo metadata (stars, description, language, license, etc.)
- File: `registry/github/OWNER/REPO/releases.json`
  - Array of GitHub releases with tag, body, assets, timestamps

**Side effects**:
- Network requests (3 per repo = 600 API calls)
- Disk writes
- Skips if files exist and `--fetch=false`

**Key behavior**:
- Uses GitHub API token from `GITHUB_TOKEN` env var
- Rate limited by GitHub (5000/hour)
- Only 200 repos get fresh data (Phase 4 limit)

---

### Phase 6: Aggregate Data

**Entry point**: `tools/update.go:247-341` (inline code)

**Inputs**:
- In-memory: `[]Module` (ALL modules, not just 200)
- Files: `registry/github/OWNER/REPO/*.json` (from Phase 5)
- Files: `registry/github/OWNER/REPO/readme.html` (from Phase 5)

**Processing**:
1. Iterate through ALL modules (not just 200)
2. For each module's repository:
   - Read `releases.json`, filter out drafts/prereleases
   - Convert release markdown bodies to HTML
   - Read `metadata.json` for repo details
   - Read `readme.html` for README content
   - Read `registry.json` if exists (optional)
3. Build `Data` struct combining:
   - BCR module data (from Phase 2)
   - GitHub repo metadata
   - Releases (filtered and converted)
   - README content

**Outputs**:
- In-memory: `map[string]Data` keyed by "owner/repo"

**Data structure**:
```go
Data{
    Owner: "bazelbuild",
    Name: "rules_go",
    Modules: []Module{...},           // From Phase 2 BCR walk
    Releases: []Release{...},         // From releases.json, filtered
    Repo: Repo{...},                  // From metadata.json
    Registry: Registry{...},          // From registry.json (optional)
    Root: {
        Readme: "<html>...</html>",   // From readme.html
    }
}
```

**Side effects**: Reads files from disk (written in Phase 5)

**Key behavior**:
- ALL modules appear in output, but only 200 have fresh GitHub data
- Modules not in lucky 200 have stale/missing GitHub data
- Merges BCR authoritative data with GitHub community data

---

### Phase 7: Write Output

**Entry point**: `tools/update.go:327-338`

**Inputs**:
- In-memory: `map[string]Data`

**Outputs**:
- File: `data/data.js`

**Format**:
```javascript
let data = {
  "bazelbuild/rules_go": {
    "name": "rules_go",
    "owner": "bazelbuild",
    "modules": [...],
    "releases": [...],
    "repo": {...},
    "registry": {...},
    "root": {...}
  },
  ...
};
module.exports=data;
```

**Side effects**: Writes ~10MB+ JSON wrapped in JavaScript

**Key behavior**:
- Single file containing all aggregated data
- Used by website for dynamic content
- Committed to git (triggers deploy workflow)

---

## Workflow Phases (in CI)

After `tools/update.go` completes, `.github/workflows/update.yml` continues:

### Generate Diff

**Entry point**: `.github/workflows/update.yml:60-66`

**Inputs**:
- File: `data/data.js` (previous version from git)
- File: `data/data.js` (newly written)
- Tool: `gron` (flattens JSON to greppable lines)
- Tool: `diff` (compares flattened versions)

**Outputs**:
- File: `data/diff.txt` (unified diff)

**Example output**:
```diff
+json["bazelbuild/rules_go"].releases[0].html_url = "https://github.com/bazelbuild/rules_go/releases/tag/v0.42.0"
-json["bazelbuild/rules_go"].releases[0].html_url = "https://github.com/bazelbuild/rules_go/releases/tag/v0.41.0"
```

**Key behavior**: Shows what changed since last update run (not committed to git)

---

### Tweet About Updates

**Entry point**: `.github/workflows/update.yml:84-87` calls `tweet/tweet.go`

**Inputs**:
- File: `data/diff.txt`
- Files: `registry/github/OWNER/REPO/releases.json` (for validation)
- Secrets: Twitter API credentials

**Processing**:
1. Parse diff with regex: `\+    html_url: "https://github.com/(.+?)/(.+?)/releases/tag/(.+?)"`
2. For each new release found:
   - Validate it's the latest non-draft/prerelease
   - Check release was published today
   - Skip if validation fails
3. Tweet: "Version X.Y.Z of Bazel REPO is now live on The Build Registry. https://registry.build/github/OWNER/REPO/"

**Outputs**:
- Network: Tweets to Twitter API

**Key behavior**: Automatic announcements for new releases detected in diff

---

### Copy BCR Modules

**Entry point**: `.github/workflows/update.yml:35-37` and `deploy.yml:35-37`

**Inputs**:
- Directory: `registry/github/bazelbuild/bazel-central-registry/clone/modules/`

**Outputs**:
- Directory: `website/static/modules/` (copied recursively)

**Structure copied**:
```
website/static/modules/
├── rules_go/
│   ├── metadata.json
│   ├── 0.42.0/
│   │   ├── MODULE.bazel
│   │   ├── source.json
│   │   └── presubmit.yml
│   ├── 0.41.0/
│   └── ...
├── rules_python/
└── ...
```

**Key behavior**: Entire BCR module tree copied to website static assets

---

### Build Website

**Entry point**: `.github/workflows/update.yml:38-48`

**Inputs**:
- File: `data/data.js` (loaded by `website/generatemodules/index.js:1`)
- Directory: `website/static/modules/` (copied from BCR)
- Source: `website/src/` (React components)

**Processing**:
1. Docusaurus plugin `generatemodules/index.js` runs:
   - Loads `data/data.js`
   - Generates routes for each repo: `/github/OWNER/REPO`
   - Generates routes for each module: `/bazel/MODULE_NAME`
   - Generates routes for each version: `/github/OWNER/REPO@VERSION`
   - Creates JSON data files for each route
   - Generates OpenGraph images via Puppeteer
   - Writes `static/v1/modules.json` (index for API)
2. Bazel builds website: `bazel build //website`
3. Extracts tarball to `website/build/`

**Outputs**:
- Directory: `website/build/` (static site)
- Contains:
  - HTML pages for each repo/module/version
  - `static/modules/` (BCR data for registry mirror)
  - `static/v1/modules.json` (API endpoint)
  - OpenGraph images for social sharing

**Key behavior**: Website consumes `data/data.js` to generate pages and serves BCR modules as static files

---

## How Website Uses the Data

### 1. Registry Mirror Functionality

**Purpose**: registry.build acts as a Bazel registry mirror

**Mechanism**:
- BCR `modules/` directory served at `https://registry.build/modules/`
- Users configure Bazel: `common --registry=https://registry.build`
- Bazel fetches:
  - `https://registry.build/modules/rules_go/metadata.json`
  - `https://registry.build/modules/rules_go/0.42.0/source.json`
  - `https://registry.build/modules/rules_go/0.42.0/MODULE.bazel`

**Files involved**:
- `website/static/bazel_registry.json` (registry config)
- `website/static/modules/*` (entire BCR tree)

---

### 2. Dynamic Page Generation

**Purpose**: Show repo details, releases, READMEs

**Mechanism**:
- `website/generatemodules/index.js` reads `data/data.js`
- Creates routes and JSON data for each repo
- `website/src/components/Module/index.tsx` renders pages

**Data consumed** (from `data/data.js`):
- `repo`: GitHub metadata (stars, description, license)
- `releases`: Release list with bodies, assets, timestamps
- `modules`: BCR module data (versions, dependencies, compatibility)
- `root.readme`: Rendered README HTML

**Example page**: `https://registry.build/github/bazelbuild/rules_go`

**Displays**:
- Stars, forks, watchers (from `metadata.json`)
- Latest release with notes (from `releases.json`)
- BCR version data (from BCR walk)
- README (from `readme.html`)

---

### 3. API Endpoints

**Purpose**: Programmatic access to registry data

**Files**:
- `website/static/v1/modules.json`: Index of all modules with summary data
- `website/build/github/OWNER/REPO/data.json`: Per-repo data (stripped down)
- `website/build/bazel/MODULE_NAME/data.json`: Per-module data

**Key behavior**: `postBuild` in `generatemodules/index.js` writes JSON files with bodies/readmes stripped to reduce size

---

## Key File Locations

### Input Files
```
registry/github/bazelbuild/bazel-central-registry/clone/
  └── modules/                        # BCR source data
      ├── rules_go/
      │   ├── metadata.json
      │   └── 0.42.0/
      │       ├── MODULE.bazel
      │       ├── source.json
      │       └── presubmit.yml
      └── ...
```

### Intermediate Files
```
registry/github/OWNER/REPO/
  ├── metadata.json                   # GitHub API response
  ├── releases.json                   # GitHub releases
  ├── readme.html                     # Rendered README
  └── registry.json                   # Optional, origin unclear
```

### Output Files
```
data/
  ├── data.js                         # Aggregated data (committed)
  └── diff.txt                        # Generated in CI (ephemeral)

website/
  ├── static/
  │   ├── modules/                    # BCR copy (committed)
  │   └── v1/modules.json             # Generated index
  └── build/                          # Generated site (ephemeral)
```

### Configuration Files
```
tools/update.go                       # Main update script
.github/workflows/
  ├── update.yml                      # Scheduled update + deploy
  └── deploy.yml                      # Deploy only (on push to main)
tweet/tweet.go                        # Twitter announcements
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ INPUTS                                                       │
├─────────────────────────────────────────────────────────────┤
│ • BCR Git Repo (github.com/bazelbuild/bazel-central-registry)│
│ • Hardcoded additionalRepos list (tools/update.go:49-201)   │
│ • GitHub API (api.github.com/repos/*)                        │
│ • Existing files (for skip logic)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ TRANSFORMATION PIPELINE (tools/update.go)                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Clone BCR                                                │
│    → registry/.../clone/                                     │
│                                                              │
│ 2. Walk BCR modules                                          │
│    → []Module (in-memory)                                    │
│                                                              │
│ 3. Add additional repos                                      │
│    → []Module (expanded)                                     │
│                                                              │
│ 4. Shuffle + limit to 200                                   │
│    → []Module[:200]                                          │
│                                                              │
│ 5. Fetch GitHub data (200 repos only)                       │
│    → registry/github/OWNER/REPO/*.json                       │
│                                                              │
│ 6. Aggregate all data                                        │
│    → map[string]Data (in-memory)                            │
│                                                              │
│ 7. Write output                                              │
│    → data/data.js                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW PROCESSING (.github/workflows/update.yml)          │
├─────────────────────────────────────────────────────────────┤
│ • Generate diff (data/diff.txt)                             │
│ • Tweet new releases (tweet/tweet.go)                        │
│ • Copy BCR to website/static/modules/                        │
│ • Build website (Docusaurus + Bazel)                        │
│ • Git commit + push                                          │
│ • Deploy to GitHub Pages                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ OUTPUTS                                                      │
├─────────────────────────────────────────────────────────────┤
│ • registry/github/OWNER/REPO/*.json (per-repo GitHub data)  │
│ • data/data.js (aggregated data for website)                │
│ • website/static/modules/ (BCR copy for registry mirror)    │
│ • website/build/ (static site)                              │
│ • Tweets (new release announcements)                        │
│ • GitHub Pages deployment                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ CONSUMPTION                                                  │
├─────────────────────────────────────────────────────────────┤
│ • Bazel users: Fetch modules from registry.build            │
│ • Website visitors: Browse repos, releases, READMEs         │
│ • API consumers: Query static/v1/modules.json               │
│ • Twitter followers: See release announcements              │
└─────────────────────────────────────────────────────────────┘
```

## Critical Data Flow Issues

### 1. Stale Data Problem

**Issue**: Only 200 random repos get fresh data per run, but ALL repos appear in output.

**Impact**: Most repos have stale GitHub data (stars, releases, README) in `data/data.js`

**Location**: Phase 4 (shuffle and limit) + Phase 6 (aggregates ALL)

**Improvement path**: Prioritize popular repos, track staleness, or increase fetch count

---

### 2. Case Collision Problem

**Issue**: Hardcoded repos use incorrect casing (e.g., "vertexwahn" vs "Vertexwahn")

**Impact**: Creates duplicate directories on Linux (case-sensitive), collision warning on macOS (case-insensitive)

**Location**: `tools/update.go:69` and `:106` (now fixed)

**Root cause**: Hardcoded lowercase doesn't match GitHub's canonical casing

---

### 3. BCR Duplicate Repos

**Issue**: Some repos in `additionalRepos` are already in BCR

**Impact**: Wasted API calls, potential data inconsistency

**Location**: Phase 3 (add additional repos)

**Improvement path**: Filter out BCR repos before adding additional repos

---

## When to Modify This Flow

**Add new data sources**: Add new phases between 5 and 6 (fetch more data)

**Change output format**: Modify Phase 7 (consider JSONL for better git diffs)

**Improve staleness**: Modify Phase 4 (implement priority queue instead of random)

**Add validation**: Add feedback loops between phases (validate before write)

**Split concerns**: Break `tools/update.go` into separate scripts per phase

## References

- **Main script**: `tools/update.go`
- **Update workflow**: `.github/workflows/update.yml`
- **Deploy workflow**: `.github/workflows/deploy.yml`
- **Tweet script**: `tweet/tweet.go`
- **Website plugin**: `website/generatemodules/index.js`
- **Page component**: `website/src/components/Module/index.tsx`
