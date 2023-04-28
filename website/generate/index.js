let data = require("../../data/data");

module.exports = async function modules(context, options) {
  return {
    name: "modules",
    async loadContent() {
      /* ... */
    },
    async contentLoaded({ content, actions }) {
      let modules = Object.values(data);

      let index = [];

      for (let m of modules) {
        const jsonPath = await actions.createData(
          `${m.owner}/${m.name}.json`,
          JSON.stringify(m)
        );

        if (m.module.name) {
          actions.addRoute({
            path: `/${m.module.name}`,
            component: "@site/src/components/Page",
            modules: {
              data: jsonPath,
            },
            exact: true,
          });
        }

        actions.addRoute({
          path: `/${m.repo.full_name}`,
          component: "@site/src/components/Page",
          modules: {
            data: jsonPath,
          },
          exact: true,
        });

        index.push({
          name: m.name,
          module: { versions: m.module.versions },
          repo: {
            full_name: m.repo.full_name,
            description: m.repo.description,
            owner: { avatar_url: m.repo.owner.avatar_url },
            stargazers_count: m.repo.stargazers_count,
          },
          releases:
            m.releases.length > 0
              ? [
                  {
                    tag_name: m.releases[0].tag_name,
                    published_at: m.releases[0].published_at,
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
