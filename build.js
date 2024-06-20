import esbuild from "esbuild";

const buildJS = async () => {
  return esbuild.build({
    entryPoints: {
      editor: "code_challenge/js/editor.js",
    },
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: "static/js",
  });
};

buildJS()
  .then(() => {
    console.log("Build completed successfully.");
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
