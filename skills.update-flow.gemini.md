---
name: Registry Update Flow
description: Describes the data update pipeline for the Bazel registry website, including inputs, outputs, and how the data is consumed.
---

# Registry Update Flow

This document outlines the data pipeline executed by the `tools/update.go` script. The script is responsible for fetching data from the Bazel Central Registry (BCR) and GitHub, processing it, and generating the data files used by the `registry.build` website.

## Update Pipeline

The update process is divided into five main phases:

### Phase 1: Fetching the Bazel Central Registry (BCR)

*   **Inputs**:
    *   The URL of the `bazelbuild/bazel-central-registry` repository (hardcoded).
*   **Outputs**:
    *   A local clone of the `bazel-central-registry` repository on the filesystem.

### Phase 2: Module Discovery

*   **Inputs**:
    *   The local clone of the `bazel-central-registry` from Phase 1.
*   **Outputs**:
    *   An in-memory list of all the modules found in the BCR, parsed from the metadata files within the registry.

### Phase 3: Fetching Raw Data from GitHub

*   **Inputs**:
    *   The list of modules from Phase 2.
    *   A hardcoded list of `additionalRepos`.
    *   A `GITHUB_TOKEN` for API authentication.
*   **Outputs**:
    *   A collection of files saved to the `registry/github/` directory for each repository:
        *   `releases.json`: Full API response for repository releases.
        *   `readme.html`: Rendered HTML of the repository's README.
        *   `metadata.json`: Repository metadata (stars, forks, etc.).

### Phase 4: Data Aggregation and Processing

*   **Inputs**:
    *   All the JSON and HTML files that were created in Phase 3.
    *   The in-memory list of modules from Phase 2.
*   **Outputs**:
    *   A single, large, in-memory data structure that aggregates all the information. During this phase, release notes are converted from Markdown to HTML.

### Phase 5: Final Output Generation

*   **Inputs**:
    *   The aggregated in-memory data structure from Phase 4.
*   **Outputs**:
    *   The final `data/data.js` file, which contains the aggregated data serialized as a JavaScript object.

## How the Outputs are Consumed

The `registry.build` website serves two distinct purposes, and it consumes the outputs of the pipeline in two different ways:

### 1. Human-Readable Web Interface

*   The primary web interface is a Docusaurus application that provides a searchable, human-friendly view of the Bazel registry.
*   **Consumption**: This interface is powered entirely by the **`data/data.js`** file. The React components load this file to get all the data they need to render the lists of modules, their versions, and their metadata.

### 2. Bazel Central Registry (BCR) Mirror

*   In addition to the web interface, `registry.build` also functions as a mirror of the Bazel Central Registry, which can be used directly by the Bazel build tool.
*   **Consumption**: This is made possible by the **`website/static/modules/`** directory. This directory, which is a copy of the `modules` directory from the official BCR, is served as static files. Bazel can be configured to use `https://registry.build` as a registry, and it will fetch module definitions from URLs like `https://registry.build/modules/<module_name>/<version>/source.json`.
