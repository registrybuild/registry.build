let fs = require("fs-extra");
const { readFileSync } = require("fs");

module.exports = async function modules(context, options) {
  return {
    name: "flags",
    async contentLoaded({ content, actions }) {
      let versions = fs.readdirSync("../flag/bazel");

      let i = 0;
      for (let version of versions) {
        let files = fs.readdirSync(`../flag/bazel/${version}`);
        let commands = JSON.parse(
          readFileSync(`../flag/bazel/${version}/commands.json`)
        );

        for (let file of files) {
          if (file == "commands.json") {
            continue;
          }
          let json = JSON.parse(
            readFileSync(`../flag/bazel/${version}/${file}`)
          );
          let jsonPath = await actions.createData(
            `flag/bazel/${version}/${file}`,
            JSON.stringify({
              flags: json,
              commands: commands,
              versions: versions,
            })
          );
          let path = `flag/bazel@${version}/${
            file == "all.json" ? "" : file.replace(".json", "")
          }`;
          actions.addRoute({
            path: `/${path}`,
            component: "@site/src/components/Flag",
            modules: {
              data: jsonPath,
            },
            exact: true,
          });

          if (i == versions.length - 1) {
            let path = `flag/bazel/${
              file == "all.json" ? "" : file.replace(".json", "")
            }`;
            actions.addRoute({
              path: `/${path}`,
              component: "@site/src/components/Flag",
              modules: {
                data: jsonPath,
              },
              exact: true,
            });
          }
        }
        i++;
      }
    },

    async postBuild({ siteConfig, routesPaths, outDir, head }) {},
  };
};
