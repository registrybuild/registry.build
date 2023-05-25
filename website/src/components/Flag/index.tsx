import Link from "@docusaurus/Link";
import { useLocation, useHistory } from "@docusaurus/router";
import { popularity } from "@site/src/utils/sort";
import { Flag, Github, HelpCircle, PlusCircle } from "lucide-react";
import React, { useState } from "react";
import Module from "../Module";
import Modules from "../Modules";

const Page = (props) => {
  let history = useHistory();
  let location = useLocation();
  let selectedFlag = new URLSearchParams(location.search).get("flag") || "";
  let filter = new URLSearchParams(location.search).get("filter") || "";

  let onAllPage = !props.data.commands.some((c) =>
    location.pathname.endsWith(`/${c.name}`)
  );

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
            <select
              value={getSelectedVersion(location)}
              onChange={(e) => {
                history.push(
                  e.target.value
                    ? `/flag/bazel@${e.target.value}`
                    : location.pathname
                );
              }}
            >
              {props.data.versions.reverse().map((v) => (
                <option>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="main">
          <div className="flag-commands">
            <a
              className={onAllPage ? "selected" : ""}
              href={`/flag/bazel${versionOrNothing(location)}`}
            >
              all
            </a>
            {props.data.commands
              .filter((c) => c.name != "info-keys" && c.name != "target-syntax")
              .map((c) => (
                <a
                  key={c.name}
                  className={
                    location.pathname.endsWith(`/${c.name}`) ? "selected" : ""
                  }
                  href={`/flag/bazel${versionOrNothing(location)}/${c.name}`}
                >
                  {c.name}
                </a>
              ))}
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
                    {f.type == "boolean" && (
                      <a href={`?flag=${f.name}`} className="flag-name">
                        --{f.name}=
                        <span className="flag-type">{`<true or false>`}</span>
                      </a>
                    )}
                    {f.type != "boolean" && (
                      <a href={`?flag=${f.name}`} className="flag-name">
                        --{f.name}=
                        <span className="flag-type">{`<${f.type}>`}</span>
                      </a>
                    )}
                    {f.default && (
                      <div className="flag-default">{f.default}</div>
                    )}
                  </div>
                  <div className="flag-description">{f.description}</div>
                  <div className="flag-tags">
                    {f.tags.map((t, i) => (
                      <div key={`${f.name}-${i}`}>{t}</div>
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
