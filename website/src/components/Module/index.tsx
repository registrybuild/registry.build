import React from "react";
import { since } from "../../utils/time";
import {
  BookOpen,
  Box,
  CheckCircle2,
  Eye,
  GitCommit,
  GitFork,
  Github,
  History,
  Scale,
  Star,
  User,
} from "lucide-react";
import { useHistory, useLocation } from "@docusaurus/router";
import Link from "@docusaurus/Link";

const Module = (props) => {
  let history = useHistory();
  let location = useLocation();
  let release = getReleaseForTag(props.data.releases, getVersion(location));
  let tab = getTab(location);
  return (
    <div className="package-page">
      <div className="package">
        <div className="package-header">
          <div className="package-name">{props.data.name}</div>
          <img
            className="package-image"
            src={props.data.repo.owner.avatar_url}
            loading="lazy"
          />
        </div>{" "}
        <div className="package-stats">
          <div className="package-version">
            <GitCommit className="package-icon" />
            {(release && release.tag_name) || "unknown"}
          </div>
          <div className="package-age">
            <History className="package-icon" />
            {(release && since(release.published_at)) || "unknown"}
          </div>
          <div className="package-stars">
            <Star className="package-icon" />
            {props.data.repo.stargazers_count.toLocaleString()}
          </div>
          <div className="package-forks">
            <GitFork className="package-icon" />
            {props.data.repo.forks_count.toLocaleString()}
          </div>
          <div className="package-subscribers">
            <Eye className="package-icon" />
            {props.data.repo.subscribers_count.toLocaleString()}
          </div>
          {release && (
            <div className="package-assets">
              <Box className="package-icon" />
              {release.assets.length.toLocaleString()}
            </div>
          )}
        </div>
        <div className="package-stats">
          <div className="package-repo">
            <Github className="package-icon" />
            <a target="_blank" href={props.data.repo.html_url}>
              {props.data.repo.full_name}
            </a>
          </div>
          {props.data.module.versions && (
            <div className="package-registry">
              <CheckCircle2 className="package-icon" />
              <a
                target="_blank"
                href={`https://registry.bazel.build/modules/${props.data.name}`}
              >
                Bazel central registry
              </a>
            </div>
          )}
          <div className="package-license">
            <Scale className="package-icon" />
            {props.data.repo.license.name}
          </div>
          <div className="package-visibility">
            <BookOpen className="package-icon" />
            {props.data.repo.visibility}
          </div>
        </div>
        {props.data.module.maintainers && (
          <div className="package-stats">
            {props.data.module.maintainers.map((m) => (
              <div className="package-maintainer" key={m.github}>
                <User className="package-icon" />
                <a target="_blank" href={`https://github.com/${m.github}`}>
                  {m.name}
                </a>
              </div>
            ))}
          </div>
        )}
        <div className="package-description">{props.data.repo.description}</div>
      </div>
      <div className="tabs">
        {props.data.root.readme && (
          <div
            onClick={() => history.push("#overview")}
            className={`tab ${tab == "overview" || !tab ? "selected" : ""}`}
          >
            Overview
          </div>
        )}
        {props.data.releases.length > 0 && (
          <div
            onClick={() => history.push("#releases")}
            className={`tab ${tab == "releases" ? "selected" : ""}`}
          >
            Releases ({props.data.releases.length.toLocaleString()}
            {props.data.releases.length == 30 && "+"})
          </div>
        )}
        {false && (
          <div
            onClick={() => history.push("#docs")}
            className={`tab ${tab == "docs" ? "selected" : ""}`}
          >
            Docs
          </div>
        )}
        {props.data.root.module && (
          <div
            onClick={() => history.push("#deps")}
            className={`tab ${tab == "deps" ? "selected" : ""}`}
          >
            Deps
          </div>
        )}
      </div>
      {(!tab || tab == "overview") && (
        <div className="package">
          <div
            className="package-rendered"
            dangerouslySetInnerHTML={{ __html: props.data.root.readme }}
          />
        </div>
      )}
      {release &&
        (!tab || tab == "releases") &&
        props.data.releases.map((release) => (
          <div className="package" key={release.tag_name}>
            {false && (
              <select
                className="package-release-dropdown"
                onChange={(e) => history.push("#releases@" + e.target.value)}
                value={getVersion()}
              >
                {props.data.releases.map((r) => (
                  <option value={r.tag_name}>{r.tag_name}</option>
                ))}
              </select>
            )}
            <h1>
              {release.tag_name}{" "}
              <span className="package-time">
                published {since(release.published_at)}
              </span>
            </h1>
            <div
              className="package-rendered"
              dangerouslySetInnerHTML={{
                __html: release.body.replace(
                  new RegExp(
                    `<h1.*?>.*?${release.name.replace(
                      /[-[\]{}()*+?.,\\^$|#\s]/g,
                      "\\$&"
                    )}.*?</h1>`
                  ),
                  ""
                ),
              }}
            />
          </div>
        ))}
      {(!tab || tab == "deps") && props.data.root.module && (
        <div className="package-page">
          {[
            ...props.data.root.module.matchAll(
              /bazel_dep\(.*?name.*?=.*?\"(.*?)\".*?version.*?=.*?\"(.*?)\".*?\)/g
            ),
          ].map((m) => (
            <div className="package" key={m[1]}>
              <Link to={`/${m[1]}`}>
                {m[1]} {m[2]}
              </Link>
            </div>
          ))}
          <div className="package">
            <code className="package-module">{props.data.root.module}</code>
          </div>
        </div>
      )}
    </div>
  );
};

function getVersion(location) {
  let parts = location.hash.substring(1).split("@");
  if (parts.length < 2) return undefined;
  return parts[1];
}

function getTab(location) {
  return location.hash.substring(1).split("@")[0];
}

function getReleaseForTag(releases, tag) {
  for (let release of releases) {
    if (release.tag_name == tag) {
      return release;
    }
  }
  return releases[0];
}

export default Module;
