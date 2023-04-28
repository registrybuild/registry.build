import React, { useState } from "react";
import Link from "@docusaurus/Link";
import { since } from "../../utils/time";
import { CheckCircle2, GitCommit, Github, History, Star } from "lucide-react";

const Module = (props) => (
  <Link
    className={props.selected ? "package selected" : "package"}
    to={`/${props.data.repo.full_name}`}
  >
    <div className="package-header">
      <div className="package-name">{props.data.name}</div>
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
    </div>
    <div className="package-stats">
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
  </Link>
);

const Modules = (props) => {
  let [count, setCount] = useState(21);
  let single = props.matches && props.matches.length == 1;
  let double = props.matches && props.matches.length == 2;
  return (
    <>
      <div
        className={`packages ${(single && "single") || ""} ${
          (double && "double") || ""
        }`}
      >
        {props.matches &&
          props.matches
            .slice(0, count)
            .map((p, i) => (
              <Module
                data={p}
                key={p.repo.full_name}
                selected={props.selected === i}
              />
            ))}
      </div>
      {count < props.matches.length && (
        <button
          className="packages-load-more"
          onClick={() => setCount(count + 21)}
        >
          Load more
        </button>
      )}
    </>
  );
};

export default Modules;
