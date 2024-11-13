import Link from "@docusaurus/Link";
import { DocSearch } from '@docsearch/react';
import '@docsearch/css';

import { useLocation } from "@docusaurus/router";
import { popularity } from "@site/src/utils/sort";
import { BookCopy, Flag, Github, HelpCircle, PlusCircle } from "lucide-react";
import React from "react";
import Module from "../Module";
import Modules from "../Modules";

const Page = (props) => {
  let location = useLocation();
  let matches = props.data.name ? [] : getMatches(props.data);
  return (
    <div className="container" key={"container"}>
      <div className="content" key={"content"}>
        <div className="header" key={"header"}>
          <Link to="/" className="logo">
            <div className="logo-the">THE</div>
            <div className="logo-build">BUILD</div>
            <div className="logo-registry">REGISTRY</div>
          </Link>
          <DocSearch
            appId="ZKJ8PC9OWF"
            indexName="crawler_registry.build"
            apiKey="9b295223ae28282aa0a17eefe8aace6a"
          />
        </div>
        <div className="main">
          {location.pathname == "/" ? (
            <Modules
              data={props.data}
              matches={matches}
            />
          ) : (
            <Module data={props.data} />
          )}
        </div>
      </div>
      <div className="floating">
        <Link to="/new">
          <PlusCircle />
        </Link>
        <Link to="/flag/bazel">
          <Flag />
        </Link>
        <Link to="/templates">
          <BookCopy />
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

function getMatches(data) {
  return data.name
    ? []
    : Object.values(data)
        .sort(popularity)
}

export default Page;
