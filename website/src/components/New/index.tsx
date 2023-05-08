import React from "react";
import Link from "@docusaurus/Link";
import * as fflate from "fflate";
import { popularity } from "@site/src/utils/sort";
import {
  AlertOctagon,
  CheckCircle2,
  GitCommit,
  Github,
  History,
  Star,
  Trash2,
} from "lucide-react";
import { since } from "@site/src/utils/format";

interface Props {
  data: any;
}
interface State {
  query: string;
  name: string;
  dependencies: any[];
  tools: any[];
  settings: any[];
  showModal: boolean;
  type: string;
  selectIndex: number;
  bazelVersion: string;
  useBBCLI: boolean;
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
        <History className="package-icon" />
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

export default class NewComponent extends React.Component<Props, State> {
  props: Props;
  state: State = {
    query: "",
    name: "myworkspace",
    dependencies: [],
    tools: [],
    settings: [],
    showModal: false,
    type: "WORKSPACE",
    selectIndex: 0,
    bazelVersion: "6.1.1",
    useBBCLI: false,
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
          this.handleDownloadZip(this.state.name, this.getFiles().files);
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

  remove(d) {
    this.state.dependencies.splice(this.state.dependencies.indexOf(d), 1);
    this.setState({
      dependencies: this.state.dependencies,
    });
  }

  render() {
    let filteredDeps = this.props.data
      .filter((d) => d.name.includes(this.state.query))
      .sort(popularity)
      .slice(0, 10);
    if (this.state.selectIndex > filteredDeps.length) {
      this.setState({ selectIndex: 0 });
    }

    let { files, missing } = this.getFiles();

    console.log(this.props.data);

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
                      value={this.state.name}
                      onChange={(e) => this.setState({ name: e.target.value })}
                    />
                  </div>
                  <div className="new-builder-config">
                    Bazel version:{" "}
                    <select
                      value={this.state.bazelVersion}
                      onChange={(e) =>
                        this.setState({ bazelVersion: e.target.value })
                      }
                    >
                      <option>6.1.1</option>
                      <option>6.1.0</option>
                      <option>6.0.0</option>
                      <option>5.0.0</option>
                      <option>4.0.0</option>
                      <option>3.0.0</option>
                      <option>2.0.0</option>
                      <option>1.0.0</option>
                    </select>
                  </div>
                  <div className="new-builder-config checkboxes">
                    Style:
                    <label>
                      <input
                        type="radio"
                        checked={this.state.type == "WORKSPACE"}
                        onChange={(e) =>
                          this.setState({ type: e.target.value })
                        }
                        value="WORKSPACE"
                        name="type"
                      />{" "}
                      Workspace
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={this.state.type == "MODULE"}
                        onChange={(e) =>
                          this.setState({ type: e.target.value })
                        }
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
                            checked={this.state.dependencies.includes(d)}
                            onChange={(e) => {
                              if (this.state.dependencies.includes(d)) {
                                this.remove(d);
                              } else {
                                this.state.dependencies.push(d);
                                this.forceUpdate();
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
                  <div className="new-builder-title">Tools</div>
                  <div className="new-builder-config checkboxes">
                    {[
                      "results UI",
                      "remote cache",
                      "remote execution",
                      "BB CLI",
                      "workflows",
                    ].map((l) => (
                      <label key={l}>
                        <input
                          type="checkbox"
                          checked={this.state.tools.includes(l)}
                          onChange={(e) => {
                            if (this.state.tools.includes(l)) {
                              this.state.tools.splice(
                                this.state.tools.indexOf(l),
                                1
                              );
                            } else {
                              this.state.tools.push(l);
                            }
                            this.forceUpdate();
                          }}
                        />{" "}
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="new-builder-section">
                  <div className="new-builder-title">Settings</div>
                  <div className="new-builder-config checkboxes">
                    {[
                      "strict environment",
                      "build without bytes",
                      "compression",
                    ].map((l) => (
                      <label key={l}>
                        <input
                          type="checkbox"
                          checked={this.state.settings.includes(l)}
                          onChange={(e) => {
                            if (this.state.settings.includes(l)) {
                              this.state.settings.splice(
                                this.state.settings.indexOf(l),
                                1
                              );
                            } else {
                              this.state.settings.push(l);
                            }
                            this.forceUpdate();
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
                              this.state.dependencies.push(
                                filteredDeps[this.state.selectIndex]
                              );
                              this.setState({
                                dependencies: this.state.dependencies,
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
                              index == this.state.selectIndex ? "selected" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              if (this.state.dependencies.includes(d)) {
                                this.state.dependencies.splice(
                                  this.state.dependencies.indexOf(d),
                                  1
                                );
                              } else {
                                this.state.dependencies.push(d);
                              }
                              this.setState({
                                dependencies: this.state.dependencies,
                              });
                            }}
                          >
                            <Module
                              onRemove={() => this.remove(d)}
                              selected={this.state.dependencies.includes(d)}
                              data={d}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="dependency-list">
                  {this.state.dependencies.length == 0 && (
                    <div>
                      No dependencies added yet, click <b>ADD</b> above to add
                      some!
                    </div>
                  )}
                  {this.state.dependencies.map((d) => (
                    <Module
                      onRemove={() => {
                        this.remove(d);
                      }}
                      selected={true}
                      key={d.repo.full_name}
                      data={d}
                      missing={missing.includes(d)}
                      type={this.state.type}
                    />
                  ))}
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
                  onClick={() => this.handleDownloadZip(this.state.name, files)}
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
        </div>
      </div>
    );
  }

  getFiles() {
    let files = {} as any;

    let snippets = [];
    let missing = [];
    let metadata = "";
    if (this.state.type == "WORKSPACE") {
      metadata = `workspace(name = "${this.state.name}")`;
      snippets = this.state.dependencies
        .filter((d) => Boolean(d.workspaceSnippet))
        .map((d) => d.workspaceSnippet);
      missing = this.state.dependencies.filter(
        (d) => !Boolean(d.workspaceSnippet)
      );
    } else {
      metadata = `module(name = "${this.state.name}", version = "1.0")`;
      snippets = this.state.dependencies
        .filter((d) => Boolean(d.moduleSnippet))
        .map((d) => d.moduleSnippet);
      missing = this.state.dependencies.filter(
        (d) => !Boolean(d.moduleSnippet)
      );
    }

    let snippetString = snippets.join("\n\n");

    files[this.state.type] = fflate.strToU8(
      `${metadata}\n${
        false && snippetString.includes("http_archive")
          ? `\nload("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")\n`
          : ""
      }\n${snippetString}`.trim()
    );

    let bazelRC = "";

    if (this.state.settings.includes("strict environment")) {
      bazelRC += `# Use a static PATH variable to prevent unnecessary rebuilds of dependencies like protobuf. 
build --incompatible_strict_action_env\n\n`;
    }

    if (this.state.settings.includes("build without bytes")) {
      bazelRC += `# Don't download intermediate outputs from the remote cache
build --remote_download_minimal\n\n`;
    }

    if (this.state.settings.includes("compression")) {
      bazelRC += `# Enables compressed remote cache reads/writes
build --experimental_remote_cache_compression\n\n`;
    }

    if (this.state.tools.includes("results UI")) {
      bazelRC += `# Adds BES backend for results UI
build --bes_results_url=https://app.buildbuddy.io/invocation/
build --bes_backend=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (this.state.tools.includes("remote cache")) {
      bazelRC += `# Enable use of a remote cache when --config=cache is set
build:cache --remote_cache=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (this.state.tools.includes("remote execution")) {
      bazelRC += `# Enable remote execution when --config=remote is set
build:remote --remote_executor=grpcs://remote.buildbuddy.io\n\n`;
    }

    if (
      this.state.tools.includes("results UI") ||
      this.state.tools.includes("remote cache") ||
      this.state.tools.includes("remote execution")
    ) {
      bazelRC += `# Grab an API key from https://app.buildbuddy.io/
# common --remote_header=x-buildbuddy-api-key=YOUR_API_KEY_GOES_HERE\n\n`;
    }

    files[".bazelrc"] = fflate.strToU8(bazelRC.trim());

    let bazelVersion = this.state.bazelVersion;

    if (this.state.tools.includes("BB CLI")) {
      bazelVersion = `buildbuddy-io/5.0.7\n${bazelVersion}`;
    }

    files[".bazelversion"] = fflate.strToU8(`${bazelVersion}`.trim());

    if (this.state.tools.includes("workflows")) {
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

  async handleDownloadZip(name: string, files: any) {
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
