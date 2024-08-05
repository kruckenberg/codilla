import esbuild from "esbuild";

const buildJS = async () => {
  return esbuild.build({
    entryPoints: {
      editor: "code_challenge/js/editor.ts",
      htmlEditor: "code_challenge/js/htmlEditor.ts",
      terminal: "code_challenge/js/terminal.ts",
      webContainer: "code_challenge/js/webContainer.ts",
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
