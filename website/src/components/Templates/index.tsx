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
import { useHistory, useLocation } from "@docusaurus/router";

let host = {
  local: "http://localhost:8080",
  dev: "https://app.buildbuddy.dev",
  prod: "https://app.buildbuddy.io",
};

let templates = [
  {
    name: "Simple Go Server Starter",
    url: "https://github.com/monoreponew/template-go-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/go.svg",
    tags: ["go", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Rust Server Starter",
    url: "https://github.com/monoreponew/template-rust-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/rust.svg",
    tags: ["rust", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Python Server Starter",
    url: "https://github.com/monoreponew/template-python-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/python.svg",
    tags: ["python", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Node.js Server Starter",
    url: "https://github.com/monoreponew/template-nodejs-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/node.svg",
    tags: ["nodejs", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Java Server Starter",
    url: "https://github.com/monoreponew/template-java-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/java.svg",
    tags: ["java", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Scala Server Starter",
    url: "https://github.com/monoreponew/template-scala-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/scala.svg",
    tags: ["scala", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple C++ Server Starter",
    url: "https://github.com/monoreponew/template-cc-simple-server",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    image: "/img/templates/cpp.svg",
    tags: ["cpp", "gcp", "google-cloud-run"],
  },
  {
    name: "Simple Static Website",
    url: "https://github.com/monoreponew/template-static",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    var: "BUCKET_NAME",
    image: "/img/templates/static.svg",
    tags: ["static", "gcp", "gcs", "genrules"],
  },
  {
    name: "Simple Docusaurus Starter",
    url: "https://github.com/monoreponew/template-docusaurus",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    var: "BUCKET_NAME",
    image: "/img/templates/docusaurus.svg",
    tags: ["static", "gcp", "gcs", "genrules", "docusaurus"],
  },
  {
    name: "Simple Terraform Starter",
    url: "https://github.com/monoreponew/template-terraform",
    secret: "AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY",
    dir: "",
    var: "BUCKET_NAME",
    image: "/img/templates/terraform.svg",
    tags: ["static", "aws", "genrules", "terraform"],
  },
  {
    name: "Simple React Starter",
    url: "https://github.com/monoreponew/template-react",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    var: "BUCKET_NAME",
    image: "/img/templates/react.svg",
    tags: ["static", "react", "gcs", "gcp", "genrules"],
  },
  {
    name: "Simple Next.js Static Starter",
    url: "https://github.com/monoreponew/template-nextjs-static",
    secret: "CLOUDSDK_AUTH_REFRESH_TOKEN,CLOUDSDK_CORE_PROJECT",
    dir: "",
    var: "BUCKET_NAME",
    image: "/img/templates/nextjs.svg",
    tags: ["static", "nextjs", "gcs", "gcp", "genrules"],
  },
];

const Template = (props) => (
  <Link
    className={"template"}
    to={`${host.dev}/repo/?${new URLSearchParams({
      template: props.data.url,
      dir: props.data.dir,
      secret: props.data.secret,
      var: props.data.var,
      templatename: props.data.name,
      image: props.data.image.startsWith("http")
        ? props.data.image
        : "https://registry.build" + props.data.image,
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
  let location = useLocation();
  let history = useHistory();

  let [count, setCount] = useState(24);
  let query = new URLSearchParams(location.search).get("search") || "";

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
                history.push(
                  `/templates/${
                    e.target.value ? `?search=${e.target.value}` : ""
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
