let data = require("../../data/data");

module.exports = async function modules(context, options) {
  return {
    name: "modules",
    async loadContent() {
      /* ... */
    },
    async contentLoaded({ content, actions }) {
      let repos = Object.values(data);

      let index = [];

      for (let r of repos) {
        for (let release of r.releases) {
          let matches = [
            ...release.body.matchAll(/<code[^>]*?>(.*?)<\/code>/gms),
          ];
          for (let match of matches) {
            if (!r.workspaceSnippet && match[1].includes("http_archive(")) {
              r.workspaceSnippet = match[1].replaceAll("&quot;", `"`);
            }
            if (!r.moduleSnippet && match[1].includes("bazel_dep(")) {
              r.moduleSnippet = match[1].replaceAll("&quot;", `"`);
            }
          }
        }

        const jsonPath = await actions.createData(
          `${r.owner}/${r.name}.json`,
          JSON.stringify(r)
        );

        for (let module of r.modules) {
          actions.addRoute({
            path: `/bazel/${module.name}`,
            component: "@site/src/components/Page",
            modules: {
              data: jsonPath,
            },
            exact: true,
          });
        }

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
            name: m.name;
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
          workspaceSnippet: r.workspaceSnippet,
          moduleSnippet: r.moduleSnippet,
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
  };
};
