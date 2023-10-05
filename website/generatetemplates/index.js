let fs = require("fs-extra");
const { readFileSync } = require("fs");

module.exports = async function modules(context, options) {
  return {
    name: "templates",
    async contentLoaded({ content, actions }) {
      actions.addRoute({
        path: `/templates`,
        component: "@site/src/components/Templates",
        exact: true,
      });
    },

    async postBuild({ siteConfig, routesPaths, outDir, head }) {},
  };
};
