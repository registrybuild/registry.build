let data = require("../../data/data");
let path = require("path");
let fs = require("fs-extra");
let puppeteer = require("puppeteer");
const { readFileSync } = require("fs");

let dataMap = {};
let disambiguation = {};
let repos = Object.values(data);

module.exports = async function modules(context, options) {
  return {
    name: "modules",
    async contentLoaded({ content, actions }) {
      let index = [];

      for (let r of repos) {
        for (let release of r.releases) {
          let matches = [
            ...release.body.matchAll(/<code[^>]*?>(.*?)<\/code>/gms),
          ];
          for (let match of matches) {
            if (
              !release.workspace_snippet &&
              match[1].includes("http_archive(")
            ) {
              release.workspace_snippet = match[1].replaceAll("&quot;", `"`);
            }
            if (!release.module_snippet && match[1].includes("bazel_dep(")) {
              release.module_snippet = match[1].replaceAll("&quot;", `"`);
            }
          }
          let moduleVersion = release.tag_name.replace(/^v/, "");
          if (
            !release.module_snippet &&
            r.modules.length > 0 &&
            r.modules[0].version_data &&
            r.modules[0].version_data[moduleVersion]
          ) {
            release.module_snippet = `bazel_dep(name = "${r.modules[0].name}", version = "${moduleVersion}")`;
          }

          if (r.workspace_snippet) {
            let path = `/github/${r.repo.full_name}`;
            let match = r.workspace_snippet.match(/name = "(.+?)"/);
            if (match) {
              addDisambiguation(
                match[1],
                { path: path.substr(1), stars: r.repo.stargazers_count },
                r.repo.full_name
              );
            }
          }

          if (!r.workspace_snippet && release.workspace_snippet) {
            r.workspace_snippet = release.workspace_snippet;
            r.latest_release_with_workspace_snippet = release.tag_name;
          }
          if (!r.module_snippet && release.module_snippet) {
            r.module_snippet = release.module_snippet;
            r.latest_release_with_module_snippet = release.tag_name;
          }
        }

        const jsonPath = await actions.createData(
          `${r.owner}/${r.name}.json`,
          JSON.stringify(r)
        );

        for (let module of r.modules) {
          let path = `/bazel/${module.name}`;
          dataMap[`${path}/data.json`] = r;
          addDisambiguation(
            module.name,
            { path: path.substr(1), stars: r.repo.stargazers_count },
            r.repo.full_name
          );
          actions.addRoute({
            path: path,
            component: "@site/src/components/Page",
            modules: {
              data: jsonPath,
            },
            exact: true,
          });
        }

        let path = `/github/${r.repo.full_name}`;
        dataMap[`${path}/data.json`] = r;

        if (r.registry && r.registry.language) {
          addDisambiguation(
            r.repo.full_name.replaceAll("/", "_"),
            { path: path.substr(1), stars: r.repo.stargazers_count },
            r.repo.full_name
          );
          addDisambiguation(
            `com_github_${r.repo.full_name.replaceAll("/", "_")}`,
            { path: path.substr(1), stars: r.repo.stargazers_count },
            r.repo.full_name
          );
          addDisambiguation(
            r.registry.language,
            { path: path.substr(1), stars: r.repo.stargazers_count },
            r.repo.full_name
          );
        }

        addDisambiguation(
          r.repo.name,
          { path: path.substr(1), stars: r.repo.stargazers_count },
          r.repo.full_name
        );
        actions.addRoute({
          path: `/github/${r.repo.full_name}`,
          component: "@site/src/components/Page",
          modules: {
            data: jsonPath,
          },
          exact: true,
        });

        // Filter out duplicate release names
        let releases = releases.filter(function (item, pos) {
          return (
            a.indexOf(item).tag_name.replace(/^v/, "") ==
            pos.tag_name.replace(/^v/, "")
          );
        });

        for (let release of releases) {
          let v = release.tag_name.replace(/^v/, "");
          actions.addRoute({
            path: `/github/${r.repo.full_name}@${v}`,
            component: "@site/src/components/Page",
            modules: {
              data: jsonPath,
            },
            exact: true,
          });
        }

        let module = {
          name: r.name,
          modules: r.modules.map((m) => {
            return { name: m.name };
          }),
          repo: {
            full_name: r.repo.full_name,
            description: r.repo.description,
            owner: { avatar_url: r.repo.owner.avatar_url },
            stargazers_count: r.repo.stargazers_count,
          },
          registry: r.registry,
          releases:
            r.releases.length > 0
              ? [
                  {
                    tag_name: r.releases[0].tag_name,
                    published_at: r.releases[0].published_at,
                  },
                ]
              : [],
          workspace_snippet: r.workspace_snippet,
          module_snippet: r.module_snippet,
        };

        index.push(module);
      }

      const jsonPath = await actions.createData(
        `index.json`,
        JSON.stringify(index)
      );

      actions.addRoute({
        path: `/`,
        component: "@site/src/components/Page",
        modules: {
          data: jsonPath,
        },
        exact: true,
      });

      actions.addRoute({
        path: `/new`,
        component: "@site/src/components/New",
        modules: {
          data: jsonPath,
        },
        exact: true,
      });
    },

    async postBuild({ siteConfig, routesPaths, outDir, head }) {
      for (let k in dataMap) {
        const p = path.join(outDir, k);
        try {
          let contents = dataMap[k];
          for (let r in contents.releases) {
            contents.releases[r].body = "";
          }
          contents.root.readme = "";
          await fs.outputFile(p, JSON.stringify(contents));
        } catch (err) {
          console.log(`Writing ${p} failed.`);
          throw err;
        }
      }

      for (let k in disambiguation) {
        const p = path.join(outDir, k, "/data.json");
        try {
          let contents = { disambiguation: Object.values(disambiguation[k]) };
          await fs.outputFile(p, JSON.stringify(contents));
        } catch (err) {
          console.log(`Writing ${p} failed.`);
          throw err;
        }
      }

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      let tempate = readFileSync("generatemodules/template.html", "utf8");
      for (let r of repos) {
        let first = true;
        for (let release of r.releases) {
          let rendered = tempate
            .replaceAll("{{REPO_NAME}}", r.repo.name)
            .replaceAll("{{IMG_SRC}}", r.repo.owner.avatar_url)
            .replaceAll("{{VERSION}}", release.tag_name)
            .replaceAll("{{FORKS}}", r.repo.forks_count.toLocaleString())
            .replaceAll("{{STARS}}", r.repo.stargazers_count.toLocaleString())
            .replaceAll(
              "{{WATCHERS}}",
              r.repo.subscribers_count.toLocaleString()
            )
            .replaceAll("{{FULL_NAME}}", r.repo.full_name)
            .replaceAll("{{LICENSE}}", r.repo.license.name)
            .replaceAll("{{ASSETS}}", release.assets.length.toLocaleString())
            .replaceAll(
              "{{DOWNLOADS}}",
              r.releases
                .flatMap((r) => r.assets)
                .map((a) => a.download_count)
                .reduce((a, b) => a + b, 0)
                .toLocaleString()
            )
            .replaceAll(
              "{{SIZE}}",
              size(
                release.assets
                  .map((a) => a.size)
                  .reduce((a, b) => Math.max(a, b), 0)
              )
            )
            .replaceAll("{{DESCRIPTION}}", r.repo.description)
            .replaceAll(
              "{{TIME}}",
              new Date(release.published_at).toLocaleDateString("en-us", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            );
          await page.setContent(rendered);

          const p = path.join(
            outDir,
            "github",
            r.repo.full_name + "@" + release.tag_name.replace(/^v/, ""),
            "/image.png"
          );
          await page.screenshot({
            path: p,
          });
          console.log(`Generated screenshot for ${p}`);

          if (first) {
            const p = path.join(
              outDir,
              "github",
              r.repo.full_name,
              "/image.png"
            );
            await page.screenshot({
              path: p,
            });
            first = false;
          }
        }
      }
    },
  };
};

function addDisambiguation(key, value, hash) {
  if (!disambiguation[key]) {
    disambiguation[key] = {};
  }
  disambiguation[key][hash] = value;
}

function size(bytes) {
  if (bytes < 1000) return `${bytes.toLocaleString()} bytes`;
  if (bytes < 1000000) return `${Math.floor(bytes / 1000).toLocaleString()} KB`;
  if (bytes < 1000000000)
    return `${Math.floor(bytes / 1000000).toLocaleString()} MB`;
  if (bytes < 1000000000000)
    return `${Math.floor(bytes / 1000000000).toLocaleString()} GB`;
}
