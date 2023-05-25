import Link from "@docusaurus/Link";
import { useLocation, useHistory } from "@docusaurus/router";
import {
  ChevronRight,
  Flag,
  Github,
  HelpCircle,
  LinkIcon,
  PlusCircle,
} from "lucide-react";
import React from "react";

const Page = (props) => {
  let history = useHistory();
  let location = useLocation();
  let selectedFlag = new URLSearchParams(location.search).get("flag") || "";
  let filter = new URLSearchParams(location.search).get("filter") || "";

  let onAllPage = !props.data.commands.some((c) =>
    location.pathname.endsWith(`/${c.name}`)
  );

  let importantCommands = ["build", "test", "run", "query", "startup_options"];

  let onOtherPage =
    !onAllPage &&
    !importantCommands.some((c) => location.pathname.endsWith(`/${c}`));

  return (
    <div className="container" key={"container"}>
      <div className="content" key={"content"}>
        <div className="header" key={"header"}>
          <Link to="/" className="logo">
            <div className="logo-the">THE</div>
            <div className="logo-build">BUILD</div>
            <div className="logo-registry">REGISTRY</div>
          </Link>
          <div className="search" key={"search"}>
            <input
              id="search"
              value={filter || selectedFlag}
              autoComplete="off"
              onChange={(e) => {
                history.push(
                  e.target.value
                    ? `${location.pathname}?filter=${e.target.value}`
                    : location.pathname
                );
              }}
              placeholder="Filter flags..."
              key={"search-input"}
            />
            <button>Go</button>
          </div>
        </div>
        <div className="main">
          <div className="flag-commands">
            <select
              className="selected"
              value={getSelectedVersion(location)}
              onChange={(e) => {
                history.push(
                  e.target.value
                    ? `/flag/bazel@${e.target.value}`
                    : location.pathname
                );
              }}
            >
              {props.data.versions
                .sort()
                .reverse()
                .map((v) => (
                  <option key={v} value={v}>
                    bazel {v}
                  </option>
                ))}
            </select>
            <div className="chevron">
              <ChevronRight />
            </div>
            <a
              className={onAllPage ? "selected" : ""}
              href={`/flag/bazel${versionOrNothing(location)}`}
            >
              all
            </a>
            {importantCommands.map((c) => (
              <a
                key={c}
                className={
                  location.pathname.endsWith(`/${c}`) ? "selected" : ""
                }
                href={`/flag/bazel${versionOrNothing(location)}/${c}`}
              >
                {c.replace("_", " ")}
              </a>
            ))}
            <select
              className={onOtherPage ? "selected" : ""}
              value={onOtherPage ? location.pathname.split("/").pop() : ""}
              style={{
                width: onOtherPage
                  ? 50 + location.pathname.split("/").pop().length * 8
                  : 80,
              }}
              onChange={(e) => {
                history.push(
                  `/flag/bazel${versionOrNothing(location)}/${e.target.value}`
                );
              }}
            >
              <option value="" disabled>
                other
              </option>
              {props.data.commands
                .filter(
                  (c) =>
                    c.name != "info-keys" &&
                    c.name != "target-syntax" &&
                    !importantCommands.includes(c.name)
                )

                .map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            {props.data.flags
              .filter(
                (f) =>
                  (filter &&
                    (`--${f.name}=`.includes(filter) ||
                      f.name.includes(filter) ||
                      f.description.includes(filter) ||
                      f.type.includes(filter) ||
                      f.default.includes(filter))) ||
                  (selectedFlag && f.name == selectedFlag) ||
                  (!selectedFlag && !filter)
              )
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((f) => (
                <div className="flag" key={f.name}>
                  <div className="flag-header">
                    <span
                      className="flag-name"
                      onClick={() => copyToClipboard(`--${f.name}=`)}
                    >
                      <span className="hover-links">
                        <a href={`?flag=${f.name}`}>
                          <LinkIcon />
                        </a>
                      </span>
                      --{f.name}
                      {f.type && (
                        <span>
                          =
                          <span className="flag-type">{`<${
                            f.type == "boolean" ? "true or false" : f.type
                          }>`}</span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flag-description">{f.description}</div>
                  <div className="flag-tags">
                    {f.default && (
                      <div className="flag-default" key={`default`}>
                        {f.default}
                      </div>
                    )}
                    {f.tags
                      .filter((t) => !!t)
                      .map((t, i) => (
                        <div key={`${f.name}-${i}`}>{t}</div>
                      ))}
                    {f.sources.length == 21 && (
                      <div className="flag-source" key="all">
                        applies to all commands
                      </div>
                    )}
                    {f.sources.length < 21 &&
                      f.sources
                        .filter((t) => !!t)
                        .map((t, i) => (
                          <a
                            key={t}
                            href={`/flag/bazel${versionOrNothing(
                              location
                            )}/${t}`}
                          >
                            <div className="flag-source">
                              {t.replace("startup_options", "startup option")}
                            </div>
                          </a>
                        ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="floating">
        <Link to="/new">
          <PlusCircle />
        </Link>
        <Link to="/flag/bazel">
          <Flag />
        </Link>
        <a
          href="https://github.com/registrybuild/registry.build/issues/new"
          target="_blank"
        >
          <HelpCircle />
        </a>
        <a
          href="https://github.com/registrybuild/registry.build"
          target="_blank"
        >
          <Github />
        </a>
      </div>
    </div>
  );
};

function copyToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  Object.assign(textArea.style, {
    top: "0",
    left: "0",
    position: "fixed",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const success = document.execCommand("copy");
  textArea.remove();
  if (!success) {
    throw new Error("Failed to copy to clipboard.");
  }

  const butterBar = document.createElement("div");
  butterBar.className = "copy-success";
  document.body.appendChild(butterBar);
  butterBar.innerText = "Copied!";
  setTimeout(() => {
    butterBar.remove();
  }, 2000);
}

function versionOrNothing(location) {
  let v = getSelectedVersion(location);
  return v ? "@" + v : "";
}

function getSelectedVersion(location) {
  let p = location.pathname;
  let parts = p.split("@");
  if (parts.length > 1) {
    return parts[1].split("/")[0];
  }
  return "";
}

export default Page;
