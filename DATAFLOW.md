# Update Workflow Data Flow

This document summarizes how data moves through `.github/workflows/update.yml`, from the scheduled job trigger through to the GitHub Pages deployment and tweet.

## 1. Checkout and Setup
- **Checkout repository:** The workflow starts by pulling the latest repository contents so every subsequent step works off the current main branch.
- **Configure Pages:** GitHub Pages is set up early so artifacts can be deployed after the build.

## 2. Data Acquisition and Caching
- **Run `tools/update.go --fetch --clone`:**  
  - Clones a fresh copy of the Bazel Central Registry into `registry/github/bazelbuild/bazel-central-registry/clone`.  
  - Reads all modules from the registry and appends additional GitHub repositories that are tracked manually.  
  - Fetches GitHub metadata, release info, and rendered READMEs for a shuffled subset of repositories, caching the responses under `registry/github/<owner>/<repo>/`.  
  - Aggregates the cached data into a `map` of repositories and writes it to `data/data.js` (wrapped as a CommonJS module) for the website generator.

## 3. Persist Registry Snapshots
- **Copy registry modules:** The freshly cloned registry modules are copied into `website/static/modules/`, ensuring the website ships the up-to-date Bazel Central Registry snapshots.

## 4. Bazel Flag Extraction
- **Run `settings/settings.go`:**  
  - Uses the cached Bazel releases metadata to determine which versions need flag information.  
  - Invokes `bazelisk` to capture help output per command, serializing flags and command descriptions under `flag/bazel/<version>/`.  
  - Stores the raw CLI outputs under `data/settings/<version>/` to aid debugging (these files are ignored by Git).

## 5. Website Build
- **Build with Bazel:** `bazel build //website` consumes `data/data.js`, the copied registry modules, and the extracted flags to compile the static site into a tarball.
- **Prepare deployable site:** The tarball is unpacked into `website/build/`, and a `.nojekyll` marker is added so GitHub Pages serves files with leading underscores correctly.

## 6. Reporting and Diffing
- **Report API quota:** The workflow queries GitHub’s rate limit endpoint to log remaining quota after the data fetch.
- **Install diff tooling and compute JSON diff:** Helper tools (`gron`, `json-diff`, custom `git jdiff`) generate `data/diff.txt`, summarizing changes since the previous run.

## 7. Commit and Publish Artifacts
- **Auto-commit:** Any tracked changes (registry cache updates, module snapshots, flag dumps, diff summary) are committed back to the repository.
- **Upload website artifact:** The built site in `website/build/` is packaged for deployment.
- **Deploy to Pages:** GitHub Pages is updated with the new site content.

## 8. Post-Deployment Actions
- **Log final rate limit:** Another rate-limit check documents API usage after deployment.
- **Tweet notification:** A short delay allows the new Pages deployment to propagate, then `tweet/tweet.go` posts an update using configured Twitter credentials.

At the end of the workflow, the repository contains refreshed registry data, updated module and flag snapshots, a diff summary, and a freshly built static site ready to serve on GitHub Pages. Continuous runs compound the cached data, progressively enriching the public dataset and web experience.
