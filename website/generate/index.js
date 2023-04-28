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

        index.push({
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
          releases:
            r.releases.length > 0
              ? [
                  {
                    tag_name: r.releases[0].tag_name,
                    published_at: r.releases[0].published_at,
                  },
                ]
              : [],
        });
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
    },
  };
};
