import fs from "node:fs";
import esbuild from "esbuild";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import combineDuplicatedSelectors from "postcss-combine-duplicated-selectors";
import sortMediaQueries from "postcss-sort-media-queries";
import tailwindcss from "tailwindcss";

const buildJS = async () => {
  return esbuild.build({
    entryPoints: {},
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: "static/js",
  });
};

const buildCSS = async () => {
  fs.readFile("common/css/input.css", { encoding: "utf8" }, (err, css) => {
    postcss([
      tailwindcss,
      sortMediaQueries(),
      combineDuplicatedSelectors({ removeDuplicatedProperties: true }),
      autoprefixer,
    ])
      .process(css, {
        from: "common/css/input.css",
        to: "static/css/styles.css",
      })
      .then((result) => {
        fs.writeFile("static/css/styles.css", result.css, () => true);
        if (result.map) {
          fs.writeFile(
            "static/css/styles.css.map",
            result.map.toString(),
            () => true,
          );
        }
      });
  });
};

Promise.all([buildJS(), buildCSS()])
  .then(() => {
    console.log("Build completed successfully.");
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
