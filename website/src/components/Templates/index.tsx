import React, { useState } from "react";
import Link from "@docusaurus/Link";
import { BookCopy, Folders, Github } from "lucide-react";

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
    to={`${host.dev}/repo/?${new URLSearchParams({
      template: props.data.url,
      dir: props.data.dir,
      secret: props.data.secret,
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
  return (
    <>
      <div className={`templates`}>
        {templates.map((t) => (
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
    </>
  );
};

export default Templates;
