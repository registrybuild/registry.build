let data = require("../../data/data");
let path = require("path");
let fs = require("fs-extra");

let dataMap = {};
let disambiguation = {};

module.exports = async function modules(context, options) {
  return {
    name: "modules",
    async contentLoaded({ content, actions }) {
      let repos = Object.values(data);

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
          let moduleVersion = release.tag_name.replace("v", "");
          if (
            !release.module_snippet &&
            r.modules.length > 0 &&
            r.modules[0].version_data[moduleVersion]
          ) {
            release.module_snippet = `bazel_dep(name = "${r.modules[0].name}", version = "${moduleVersion}")`;
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
    },
  };
};

function addDisambiguation(key, value, hash) {
  if (!disambiguation[key]) {
    disambiguation[key] = {};
  }
  disambiguation[key][hash] = value;
}
