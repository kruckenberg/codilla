import esbuild from "esbuild";

const buildJS = async () => {
  return esbuild.build({
    entryPoints: {
      editor: "code_challenge/js/editor.ts",
      pythonEditor: "code_challenge/js/python_challenges/editor.ts",
      htmlEditor: "code_challenge/js/html_challenges/htmlEditor.ts",
      terminal: "code_challenge/js/terminal_challenges/terminal.ts",
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
