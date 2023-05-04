import Link from "@docusaurus/Link";
import { useLocation, useHistory } from "@docusaurus/router";
import { popularity } from "@site/src/utils/sort";
import React, { useState } from "react";
import Module from "../Module";
import Modules from "../Modules";

const Page = (props) => {
  let history = useHistory();
  let location = useLocation();
  let query = new URLSearchParams(location.search).get("search") || "";
  let [selected, setSelected] = useState(-1);

  let matches = props.data.name ? [] : getMatches(props.data, query);
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
              value={query}
              autoComplete="off"
              onKeyUp={(e) => {
                if (e.keyCode == 13) {
                  history.push(
                    `/github/${
                      matches[Math.min(selected, matches.length - 1)].repo
                        .full_name
                    }`
                  );
                }
                if (e.keyCode == 39 || e.keyCode == 40) {
                  // right or down
                  setSelected(Math.min(selected + 1, matches.length - 1));
                }
                if (e.keyCode == 37 || e.keyCode == 38) {
                  // left or up
                  setSelected(Math.max(selected - 1, 0));
                }
              }}
              onChange={(e) => {
                history.push(
                  e.target.value ? `/?search=${e.target.value}` : ""
                );
                if (e.target.value) {
                  setSelected(0);
                } else {
                  setSelected(-1);
                }
                setTimeout(() => document.getElementById("search").focus(), 0);
              }}
              placeholder="Search the registry"
              key={"search-input"}
            />
            <button
              onClick={() => {
                history.push(
                  `/github/${
                    matches[Math.min(selected, matches.length - 1)].repo
                      .full_name
                  }`
                );
              }}
            >
              Go
            </button>
          </div>
        </div>
        <div className="main">
          {location.pathname == "/" ? (
            <Modules
              data={props.data}
              query={query}
              matches={matches}
              selected={selected}
            />
          ) : (
            <Module data={props.data} />
          )}
        </div>
      </div>
    </div>
  );
};

function getMatches(data, query) {
  return data.name
    ? []
    : Object.values(data)
        .sort(popularity)
        .filter(
          (p) => p.name.includes(query) || p.repo.full_name.includes(query)
        );
}

// window.onload = () => {
//   document.getElementById("search").focus();
// };

export default Page;
