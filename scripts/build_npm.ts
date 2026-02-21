import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./main.ts"],
  outDir: "./npm",
  scriptModule: false,
  compilerOptions: {
    lib: ["ESNext"],
  },
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "gml-lsp",
    version: Deno.args[0],
    description: "GameMaker Studio Language Server",
    author: "Marcos Cevallos",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/LinkUpGames/gml-lsp.git",
    },
    bugs: {
      url: "https://github.com/LinkUpGames/gml-lsp/issues",
    },
  },
});
