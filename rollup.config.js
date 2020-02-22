import typescript from "@rollup/plugin-typescript";
import node from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import ignore from "rollup-plugin-ignore";


// You can have more root bundles by extending this array
const rootFiles = ["index.ts"];
import externalGlobals from "rollup-plugin-external-globals";

export default rootFiles.map(name => {
  /** @type { import("rollup").RollupOptions } */
  const options = {
    input: `src/${name}`,
    external: ['typescript', 'fs', 'path'],
    output: {
      paths: {
        "typescript":"typescript-sandbox/index",
        "fs":"typescript-sandbox/index",
        "path":"typescript-sandbox/index",
      },
      name,
      dir: "dist",
      format: "amd"
    },
    plugins: [typescript({ tsconfig: "tsconfig.json" }), externalGlobals({ typescript: "window.ts" }),  ignore(["path", "fs"]), commonjs(), node(), json()]
  };

  return options;
});
