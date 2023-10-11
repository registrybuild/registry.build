import React, { useState } from "react";
import Link from "@docusaurus/Link";
import {
  BookCopy,
  Flag,
  Folders,
  Github,
  HelpCircle,
  Home,
  PlusCircle,
} from "lucide-react";

let host = {
  local: "http://localhost:8080",
  dev: "https://app.buildbuddy.dev",
  prod: "https://app.buildbuddy.io",
};

let templates = [
  {
    name: "Simple Go Server Starter",
    url: "https://github.com/monoreponew/template-go-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/go.svg",
  },
  {
    name: "Simple Rust Server Starter",
    url: "https://github.com/monoreponew/template-rust-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/rust.svg",
  },
  {
    name: "Simple Python Server Starter",
    url: "https://github.com/monoreponew/template-python-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/python.svg",
  },
  {
    name: "Simple Node.js Server Starter",
    url: "https://github.com/monoreponew/template-nodejs-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/node.svg",
  },
  {
    name: "Simple Java Server Starter",
    url: "https://github.com/monoreponew/template-java-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/java.svg",
  },
  {
    name: "Simple Scala Server Starter",
    url: "https://github.com/monoreponew/template-scala-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/scala.svg",
  },
  {
    name: "Simple C++ Server Starter",
    url: "https://github.com/monoreponew/template-cc-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,GCP_PROJECT",
    dir: "",
    image: "/img/templates/cpp.svg",
  },
];

const Template = (props) => (
  <Link
    className={"template"}
    to={`${host.local}/repo/?${new URLSearchParams({
      template: props.data.url,
      dir: props.data.dir,
      secret: props.data.secret,
      templatename: props.data.name,
      image: props.data.image.startsWith("http")
        ? props.data.image
        : window.origin + props.data.image,
    })}`}
  >
    <div className="template-metadata">
      <div className="template-name">{props.data.name}</div>
      <div className="template-props">
        <div className="template-repo">
          <Github />
          <div className="template-repo-name">
            {props.data.url.replaceAll("https://github.com/", "").split("/")[0]}
          </div>
        </div>
        <div className="template-repo">
          <BookCopy />
          <div className="template-repo-name">
            {props.data.url.replaceAll("https://github.com/", "").split("/")[1]}
          </div>
        </div>
        {props.data.dir && (
          <div className="template-repo">
            <Folders />
            <div className="template-repo-name">
              {props.data.dir.replaceAll("/", " / ")}
            </div>
          </div>
        )}
      </div>
    </div>
    {props.data.image && (
      <img className="template-image" src={props.data.image} />
    )}
  </Link>
);

const Templates = (props) => {
  let [count, setCount] = useState(24);
  let [query, setQuery] = useState(
    new URLSearchParams(window.location.search).get("query")
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
          <div className="search">
            <input
              placeholder="Search templates..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                window.history.pushState(
                  "",
                  "",
                  `${window.location.origin}${window.location.pathname}${
                    e.target.value ? `?query=${e.target.value}` : ""
                  }`
                );
              }}
            />
          </div>
        </div>
      </div>
      <div className={`templates`}>
        {templates
          .filter(
            (t) =>
              !query || t.name?.toLowerCase().includes(query?.toLowerCase())
          )
          .map((t) => (
            <Template data={t} />
          ))}
      </div>
      {count < templates.length && (
        <button
          className="packages-load-more"
          onClick={() => setCount(count + 24)}
        >
          Load more
        </button>
      )}
      <div className="floating">
        <Link to="/">
          <Home />
        </Link>{" "}
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

export default Templates;
