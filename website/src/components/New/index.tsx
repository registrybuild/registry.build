import React from "react";
import Link from "@docusaurus/Link";
import * as fflate from "fflate";
import { popularity } from "@site/src/utils/sort";
import {
  AlertOctagon,
  CheckCircle2,
  GitCommit,
  Github,
  History as HistoryIcon,
  Star,
  Trash2,
} from "lucide-react";
import { since } from "@site/src/utils/format";
import { History, Location } from "history";
import { withRouter, RouteComponentProps } from "react-router-dom";
import BrowserOnly from "@docusaurus/BrowserOnly";
interface Props {
  data: any;
  location: Location;
  history: History;
}
interface State {
  query: string;
  showModal: boolean;
  selectIndex: number;
  showFiles: boolean;
}

const Module = (props) => (
  <div className="package">
    <div className="package-header">
      <div className="package-name">
        {props.data.name}
        {props.selected && (
          <span
            onClick={(e) => {
              props.onRemove && props.onRemove.call();
              e.stopPropagation();
            }}
            className="package-remove"
          >
            <Trash2 />
          </span>
        )}
      </div>
      <img
        className="package-image"
        src={props.data.repo.owner.avatar_url}
        loading="lazy"
      />
    </div>
    <div className="package-stats">
      <div className="package-version">
        <GitCommit className="package-icon" />
        {(props.data.releases[0] && props.data.releases[0].tag_name) ||
          "unknown"}
      </div>
      <div className="package-age">
        <HistoryIcon className="package-icon" />
        {(props.data.releases[0] &&
          since(props.data.releases[0].published_at)) ||
          "unknown"}
      </div>
      <div className="package-stars">
        <Star className="package-icon" />
        {props.data.repo.stargazers_count.toLocaleString()}
      </div>
      <div className="package-repo">
        <Github className="package-icon" />
        {props.data.repo.full_name}
      </div>
      {props.data.modules.length > 0 && (
        <div className="package-registry">
          <CheckCircle2 className="package-icon" />
          BCR
        </div>
      )}
    </div>
    <div className="package-description">{props.data.repo.description}</div>
    {props.missing && (
      <div className="missing-alert">
        <AlertOctagon /> This dependency does not yet support {props.type}{" "}
        style.
      </div>
    )}
  </div>
);

class NewComponent extends React.Component<RouteComponentProps & Props, State> {
  props: RouteComponentProps & Props;
  state: State = {
    query: "",
    showModal: false,
    selectIndex: 0,
    showFiles: false,
  };

  componentDidMount() {
    document.onkeydown = (e) => {
      switch (e.keyCode) {
        case 27: // Esc
          this.setState({ showModal: false, showFiles: false });
          break;
        case 66: // Meta + B
          if (!e.metaKey) break;
          this.setState({ showModal: true }, () => {
            document.getElementById("dep-input").focus();
          });
          e.preventDefault();
          break;
        case 13: // Meta + Return
          if (!e.metaKey) break;
          this.handleDownloadZip(this.getFiles(this.getExpensiveDeps()).files);
          e.preventDefault();
          break;
        case 32: // Ctrl + Space
          if (!e.ctrlKey) break;
          this.setState({ showFiles: true });
          e.preventDefault();
          break;
      }
    };
  }

  getExpensiveDeps() {
    let selectedDepNames = this.getDepNames();
    return this.props.data.filter((d) =>
      selectedDepNames.some((s) => s == d.repo.full_name)
    );
  }

  getDepNames() {
    return (
      new URLSearchParams(this.props.location.search).get("deps")?.split(",") ||
      []
    );
  }

  remove(d) {
    let depNames = this.getDepNames();
    depNames.splice(depNames.indexOf(d.repo.full_name), 1);
    let params = new URLSearchParams(this.props.location.search);
    params.set("deps", depNames.join(","));
    this.props.history.push(`${location.pathname}?${params}`);
  }

  add(d) {
    let newDeps = this.getDepNames().concat([d.repo.full_name]);
    let params = new URLSearchParams(location.search);
    params.set("deps", newDeps.join(","));
    this.props.history.push(`${location.pathname}?${params}`);
  }

  getWorkspaceName() {
    return (
      new URLSearchParams(this.props.location.search).get("name") ??
      "myworkspace"
    );
  }

  setWorkspaceName(newName: string) {
    let params = new URLSearchParams(location.search);
    params.set("name", newName);
    this.props.history.push(`${location.pathname}?${params}`);
  }

  getBazelVersion() {
    return (
      new URLSearchParams(this.props.location.search).get("version") ?? "6.1.1"
    );
  }

  setBazelVersion(newName: string) {
    let params = new URLSearchParams(location.search);
    params.set("version", newName);
    this.props.history.push(`${location.pathname}?${params}`);
  }

  getType() {
    return (
      new URLSearchParams(this.props.location.search).get("type") ?? "WORKSPACE"
    );
  }

  setType(newName: string) {
    let params = new URLSearchParams(location.search);
    params.set("type", newName);
    this.props.history.push(`${location.pathname}?${params}`);
  }

  getSettings() {
    return (
      new URLSearchParams(this.props.location.search)
        .get("settings")
        ?.split(",") || []
    );
  }

  addSetting(s) {
    let newSettings = this.getSettings().concat([s]);
    let params = new URLSearchParams(location.search);
    params.set("settings", newSettings.join(","));
    this.props.history.push(`${location.pathname}?${params}`);
  }

  removeSetting(s: string) {
    let settings = this.getSettings();
    settings.splice(settings.indexOf(s), 1);
    let params = new URLSearchParams(this.props.location.search);
    params.set("settings", settings.join(","));
    this.props.history.push(`${location.pathname}?${params}`);
  }

  render() {
    let selectedDeps = this.getExpensiveDeps();
    let filteredDeps = this.props.data
      .filter((d) => d.name.includes(this.state.query))
      .sort(popularity)
      .slice(0, 10);
    if (this.state.selectIndex > filteredDeps.length) {
      this.setState({ selectIndex: 0 });
    }

    let { files, missing } = this.getFiles(selectedDeps);

    return (
      <div className="new-container new">
        <div className="header">
          <div className="header-container">
            <div className="tbr">
              <Link to="/">
                THE
                <br />
                BUILD
                <br />
                REGISTRY
              </Link>
            </div>
            <div>
              <Link to="/new" className="logo">
                <div className="logo-new">NEW</div>
                <div className="logo-mono">MONO</div>
                <div className="logo-repo">REPO</div>
              </Link>
            </div>
            <div className="github">
              <a
                href="https://github.com/registrybuild/registry.build"
                target="_blank"
              >
                <Github />
              </a>
            </div>
          </div>
        </div>
        <div className="content">
          <BrowserOnly fallback={<div>Loading...</div>}>
            {() => (
              <div className="main new-builder-container">
                <div className="new-builder">
                  <div className="new-builder-half">
                    <div className="new-builder-section">
                      <div className="new-builder-title">Tool</div>
                      <div className="new-builder-config checkboxes">
                        <label>
                          <input type="radio" checked={true} readOnly={true} />{" "}
                          Bazel
                        </label>
                        <label>
                          <input type="radio" disabled={true} readOnly={true} />{" "}
                          Buck2 [coming soon]
                        </label>
                      </div>
                    </div>
                    <div className="new-builder-section">
                      <div className="new-builder-title">Configuration</div>
                      <div className="new-builder-config">
                        Project name:{" "}
                        <input
                          className="new-builder-project-name"
                          type="text"
                          value={this.getWorkspaceName()}
                          onChange={(e) =>
                            this.setWorkspaceName(e.target.value)
                          }
                        />
                      </div>
                      <div className="new-builder-config">
                        Bazel version:{" "}
                        <select
                          value={this.getBazelVersion()}
                          onChange={(e) => this.setBazelVersion(e.target.value)}
                        >
                          <option>6.3.0</option>
                          <option>6.2.1</option>
                          <option>6.2.0</option>
                          <option>6.1.2</option>
                          <option>6.1.1</option>
                          <option>6.1.0</option>
                          <option>5.4.1</option>
                        </select>
                      </div>
                      <div className="new-builder-config checkboxes">
                        Style:
                        <label>
                          <input
                            type="radio"
                            checked={this.getType() == "WORKSPACE"}
                            onChange={(e) => this.setType(e.target.value)}
                            value="WORKSPACE"
                            name="type"
                          />{" "}
                          Workspace
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={this.getType() == "MODULE"}
                            onChange={(e) => this.setType(e.target.value)}
                            value="MODULE"
                            name="type"
                          />{" "}
                          Module
                        </label>
                      </div>
                    </div>
                    <div className="new-builder-section">
                      <div className="new-builder-title">Languages</div>
                      <div className="new-builder-config checkboxes">
                        {this.props.data
                          .filter((d) => d.registry && d.registry.language)
                          .sort(popularity)
                          .map((d) => (
                            <label key={d.registry.language}>
                              <input
                                type="checkbox"
                                checked={selectedDeps.includes(d)}
                                onChange={(e) => {
                                  if (selectedDeps.includes(d)) {
                                    this.remove(d);
                                  } else {
                                    this.add(d);
                                  }
                                }}
                                value="WORKSPACE"
                                name="type"
                              />{" "}
                              {d.registry.language}
                            </label>
                          ))}
                      </div>
                    </div>
                    <div className="new-builder-section">
                      <div className="new-builder-title">Settings</div>
                      <div className="new-builder-config checkboxes">
                        {[
                          "results UI",
                          "remote cache",
                          "remote execution",
                          "BB CLI",
                          "workflows",
                          "strict environment",
                          "build without bytes",
                          "compression",
                        ].map((l) => (
                          <label key={l}>
                            <input
                              type="checkbox"
                              checked={this.getSettings().includes(l)}
                              onChange={(e) => {
                                if (this.getSettings().includes(l)) {
                                  this.removeSetting(l);
                                } else {
                                  this.addSetting(l);
                                }
                              }}
                            />{" "}
                            {l}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="new-builder-half">
                    <div className="new-builder-dependency-section">
                      <div className="new-builder-title">Dependencies</div>
                      <button
                        onClick={() => {
                          this.setState({ showModal: true }, () => {
                            document.getElementById("dep-input").focus();
                          });
                        }}
                      >
                        ADD <span className="hint">⌘ + B</span>
                      </button>
                    </div>
                    {this.state.showModal && (
                      <div
                        className="new-builder-modal-container"
                        onClick={() => this.setState({ showModal: false })}
                      >
                        <div
                          className="new-builder-modal"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            id="dep-input"
                            value={this.state.query}
                            onChange={(e) =>
                              this.setState({ query: e.target.value })
                            }
                            onKeyDown={(e) => {
                              switch (e.keyCode) {
                                case 13: //enter
                                  if (filteredDeps.length == 0) break;
                                  this.add(
                                    filteredDeps[this.state.selectIndex]
                                  );
                                  this.setState({
                                    query: "",
                                    showModal: false,
                                  });
                                  break;
                                case 38: //up
                                  let prev = Math.max(
                                    this.state.selectIndex - 1,
                                    0
                                  );
                                  this.setState({
                                    selectIndex: prev,
                                  });
                                  document
                                    .getElementById(`option-${prev}`)
                                    .scrollIntoView({ block: "nearest" });
                                  break;
                                case 40: //down
                                  let next = Math.min(
                                    this.state.selectIndex + 1,
                                    filteredDeps.length - 1
                                  );
                                  this.setState({
                                    selectIndex: next,
                                  });
                                  document
                                    .getElementById(`option-${next}`)
                                    .scrollIntoView({ block: "nearest" });
                                  break;
                              }
                            }}
                          />
                          <div className="dep-input-options">
                            {filteredDeps.sort(popularity).map((d, index) => (
                              <div
                                id={`option-${index}`}
                                key={d.repo.full_name}
                                className={`dep-input-option ${
                                  index == this.state.selectIndex
                                    ? "selected"
                                    : ""
                                }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  if (selectedDeps.includes(d)) {
                                    this.remove(d);
                                  } else {
                                    this.add(d);
                                  }
                                }}
                              >
                                <Module
                                  onRemove={() => this.remove(d)}
                                  selected={selectedDeps.includes(d)}
                                  data={d}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="dependency-list">
                      {selectedDeps.length == 0 && (
                        <div key="empty-state">
                          No dependencies added yet, click <b>ADD</b> above to
                          add some!
                        </div>
                      )}
                      <div>
                        {selectedDeps.map((d) => (
                          <Module
                            onRemove={() => {
                              this.remove(d);
                            }}
                            selected={true}
                            key={`${d.repo.full_name}@selected`}
                            data={d}
                            missing={missing.includes(d)}
                            type={this.getType()}
                          />
                        ))}
                      </div>
                    </div>

                    {/* {missing.length > 0 && (
                  <div className="new-builder-section">
                    <div className="new-builder-title">WARNING</div>
                    These dependencies don't yet support the {
                      this.state.type
                    }{" "}
                    import method: {missing.map((d) => d.name).join(", ")}
                  </div>
                )} */}
                  </div>
                </div>
                <div className="new-builder-footer">
                  <div className="new-builder-footer-container">
                    {/* <button
                  onClick={() => this.handleDownloadZip(this.state.name, files)}
                >
                  Create Github repo
                </button> */}
                    <button
                      onClick={() =>
                        this.setState({ showFiles: !this.state.showFiles })
                      }
                    >
                      EXPLORE <span className="hint">CTRL + SPACE</span>
                    </button>
                    <button
                      className="primary"
                      onClick={() => this.handleDownloadZip(files)}
                    >
                      GENERATE <span className="hint">⌘ + ↵</span>
                    </button>
                  </div>

                  {this.state.showFiles && (
                    <div
                      className="new-builder-modal-container"
                      onClick={() => this.setState({ showFiles: false })}
                    >
                      <div
                        className="new-builder-modal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="new-builder-files">
                          {Object.keys(files).map((f) => (
                            <div className="new-builder-section" key={f}>
                              <div className="new-builder-title">{f}</div>
                              <code style={{ whiteSpace: "pre" }}>
                                {fflate.strFromU8(files[f])}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </BrowserOnly>
        </div>
      </div>
    );
  }

  getFiles(deps) {
    let files = {} as any;

    let snippets = [];
    let missing = [];
    let metadata = "";
    if (this.getType() == "WORKSPACE") {
      metadata = `workspace(name = "${this.getWorkspaceName()}")`;
      snippets = deps
        .filter((d) => Boolean(d.workspace_snippet))
        .map((d) => d.workspace_snippet);
      missing = deps.filter((d) => !Boolean(d.workspace_snippet));
    } else {
      metadata = `module(name = "${this.getWorkspaceName()}", version = "1.0")`;
      snippets = deps
        .filter((d) => Boolean(d.module_snippet))
        .map((d) => d.module_snippet);
      missing = deps.filter((d) => !Boolean(d.module_snippet));
    }

    let snippetString = snippets.join("\n\n");

    files[this.getType()] = fflate.strToU8(
      `${metadata}\n${
        false && snippetString.includes("http_archive")
          ? `\nload("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")\n`
          : ""
      }\n${snippetString}`.trim()
    );

    let bazelRC = "";

    let settings = this.getSettings();
    if (settings.includes("strict environment")) {
      bazelRC += `# Use a static PATH variable to prevent unnecessary rebuilds of dependencies like protobuf. 
build --incompatible_strict_action_env\n\n`;
    }

    if (settings.includes("build without bytes")) {
      bazelRC += `# Don't download intermediate outputs from the remote cache
build --remote_download_minimal\n\n`;
    }

    if (settings.includes("compression")) {
      bazelRC += `# Enables compressed remote cache reads/writes
build --experimental_remote_cache_compression\n\n`;
    }

    if (settings.includes("results UI")) {
      bazelRC += `# Adds BES backend for results UI
build --bes_results_url=https://app.buildbuddy.io/invocation/
build --bes_backend=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (settings.includes("remote cache")) {
      bazelRC += `# Enable use of a remote cache when --config=cache is set
build:cache --remote_cache=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (settings.includes("remote execution")) {
      bazelRC += `# Enable remote execution when --config=remote is set
build:remote --remote_executor=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (
      settings.includes("results UI") ||
      settings.includes("remote cache") ||
      settings.includes("remote execution")
    ) {
      bazelRC += `# Grab an API key from https://app.buildbuddy.io/
# common --remote_header=x-buildbuddy-api-key=YOUR_API_KEY_GOES_HERE\n\n`;
    }

    files[".bazelrc"] = fflate.strToU8(bazelRC.trim());

    let bazelVersion = this.getBazelVersion();

    if (settings.includes("BB CLI")) {
      bazelVersion = `buildbuddy-io/5.0.7\n${bazelVersion}`;
    }

    files[".bazelversion"] = fflate.strToU8(`${bazelVersion}`.trim());

    if (settings.includes("workflows")) {
      files["buildbuddy.yaml"] = fflate.strToU8(
        `actions:
  - name: "Test all targets"
    triggers:
      push:
        branches:
          - "main" # <-- replace "main" with your main branch name
      pull_request:
        branches:
          - "*"
    bazel_commands:
      - "test //..."`.trim()
      );
    }

    files["BUILD"] = fflate.strToU8(``.trim());

    return { files, missing };
  }

  async handleDownloadZip(files: any) {
    let name = this.getWorkspaceName();
    const zipped = new Blob([
      fflate.zipSync(
        { [name]: files },
        {
          level: 1,
          mtime: new Date("1/1/1980"),
        }
      ),
    ]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipped);
    link.download = `${name}.zip`;
    link.click();
    link.remove();
  }
}

export default withRouter(NewComponent);
