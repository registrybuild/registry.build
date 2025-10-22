---
name: Documenting update-flow
description: Summarizes the registry.build update pipeline, detailing inputs, outputs, and how generated artifacts feed the website.
---

# Update Flow Reference

Use this overview when modifying `.github/workflows/update.yml`, `.github/workflows/deploy.yml`, or `tools/update.go`. It traces what each phase consumes, what it writes, and how the React/Docusaurus site relies on the results.

## Trigger Points

- **Update workflow** (`update.yml`): runs every 4 hours or on manual dispatch. Performs a full refresh, builds the site, commits data changes, and optionally tweets newly detected releases.
- **Deploy workflow** (`deploy.yml`): runs on pushes to `main` or manual dispatch. Rebuilds and redeploys the site using existing cached data (`--fetch` default false) without producing diffs, auto-commits, or tweets.

## Phase Summary

| Phase | Command(s) | Primary inputs | Outputs | Downstream use |
| --- | --- | --- | --- | --- |
| Checkout & Pages setup | `actions/checkout`, `actions/configure-pages` | Git repository, workflow env | Working tree, Pages context | Prerequisite for all later steps |
| Fetch GitHub data | `go run tools/update.go --fetch=true --clone=true` (update) / `--clone=true` (deploy) | Bazel Central Registry git remote, GitHub REST API, `GITHUB_TOKEN` | `registry/github/<owner>/<repo>/{metadata.json,readme.html,releases.json,registry.json?}`, `registry/github/bazelbuild/bazel-central-registry/clone/**`, aggregated `data/data.js` | Static API cache for 1st-party data, site data source for modules, releases, maintainers |
| Copy modules | `cp -r registry/github/bazelbuild/bazel-central-registry/clone/modules website/static/modules` | Fresh BCR clone | `website/static/modules/**` (exact BCR module tree) | Served verbatim at `https://registry.build/modules/...`; keeps module artifacts downloadable |
| Update flags | `go run settings/settings.go` | `registry/github/bazelbuild/bazel/releases.json`, Bazelisk downloads | `data/settings/<bazel-version>/**` (command help, per-command flag dumps, `all.json`) | Website flag explorer (`/flag/bazel`) |
| Build website | `bazel build //website`, extract `bazel-bin/website/website.tar` | Website source, static modules, `data/data.js`, `data/settings/**` | `website/build/**`, `.nojekyll`, route JSON blobs (`outDir/**/data.json` generated in postBuild), social card PNGs | GitHub Pages artifact & deploy payload |
| Diff & tweet (update only) | `git jdiff > data/diff.txt`, `go run tweet/tweet.go ...` | Git working tree after refresh, Twitter secrets | `data/diff.txt`, optional tweets | Diff file used to detect and announce new releases |
| Auto-commit (update only) | `git-auto-commit-action` | Modified files from prior phases | Commit “Update data” | Pushes refreshed data to repo |
| Deploy | `actions/upload-pages-artifact`, `actions/deploy-pages` | `website/build/**` | Published static site | Makes new data visible |

## Data Produced by `tools/update.go`

`tools/update.go` orchestrates the heavy lifting:

- **BCR clone**: `registry/github/bazelbuild/bazel-central-registry/clone` is a shallow clone. With `--clone`, the existing directory is purged before recloning.
- **Per-repo caches**: For each processed GitHub repo the tool writes:
  - `metadata.json` – raw `GET /repos` payload.
  - `readme.html` – rendered README from `GET /repos/:repo/readme`.
  - `releases.json` – release list from `GET /repos/:repo/releases`.
  - Optional `registry.json` collected while walking the BCR clone.
- **Aggregated bundle**: `data/data.js` exports a JS object keyed by `<owner>/<repo>` combining repository metadata, releases (Markdown converted to HTML), module info, snippets, and optional registry data. The Docusaurus plugin loads this file (`require("../../data/data")` in `website/generatemodules/index.js`).

Only the first 200 repos (after shuffling the combined BCR + additional repo list) are refreshed per run, but `data/data.js` is rebuilt from disk for *all* known repos, so historical data persists. The diff step then captures every staged change, including new module copies and aggregated data tweaks.

## How the Website Consumes Outputs

- **Static archives**: Everything in `website/static` is published verbatim. After the copy step, users and tools can fetch BCR artifacts like `/modules/modules/rules_go/metadata.json` directly from the deployed site.
- **Dynamic routes**: The custom plugin under `website/generatemodules/index.js` ingests `data/data.js` during the build to:
  - Create per-module (`/bazel/<module>`), per-repo (`/github/<owner>/<repo>`), and per-release (`/github/<owner>/<repo>@<tag>`) routes.
  - Write slimmed JSON files (`outDir/.../data.json`) that power the React components without shipping large release bodies to the client.
  - Generate disambiguation data and module index summaries.
- **Flag explorer**: The plugin for `/flag/bazel` uses `data/settings/<version>/**` to render command/flag documentation. Those files originate from `settings/settings.go`.
- **Social previews**: During `postBuild`, Puppeteer renders social cards for each repo/release combination using the same aggregated data, saving PNGs inside the output tree.
- **Tweet discovery**: `tweet/tweet.go` scans `data/diff.txt` for added release URLs, verifies the matching `releases.json` entry is the latest non-prerelease, and posts announcements.

## Practical Notes

- Any refactor that changes directory layouts or file names must update both `tools/update.go` (data production) and the website plugins that load that data.
- Keep the BCR clone path stable (`registry/github/bazelbuild/bazel-central-registry/clone`) or adjust the copy step and `walk()` function accordingly.
- If you disable `--clone`, ensure the workflow fetches upstream changes and records the previous BCR commit so duplicates can be detected reliably.
