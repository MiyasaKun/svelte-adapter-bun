import { type Adapter } from "@sveltejs/kit";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const files = fileURLToPath(new URL("./files", import.meta.url).href);

export interface AdapterOptions {
  envPrefix?: string;
}
export interface BuildOptions {
  out?: string;
}

export default function ({
  out = "build",
  envPrefix = "",
}: AdapterOptions & BuildOptions = {}): Adapter {
  return {
    name: "bun-adapter",
    async adapt(builder) {
      builder.rimraf(out);
      builder.mkdirp(out);

      builder.log.minor("Copying assets");
      builder.writeClient(`${out}/client${builder.config.kit.paths.base}`);
      builder.writePrerendered(`${out}/client${builder.config.kit.paths.base}`);

      builder.log.minor("Copying server");
      builder.writeServer(`${out}/server`);

      writeFileSync(
        `${out}/manifest.js`,
        `export const manifest = ${builder.generateManifest({
          relativePath: "./server",
        })};\n\n` +
          `export const prerendered = new Set(${JSON.stringify(
            builder.prerendered.paths,
          )});\n`,
      );
      builder.copy(files, out, {
        replace: {
          SERVER: "./server/index.js",
          MANIFEST: "./manifest.js",
          ADAPTER_OPTIONS: JSON.stringify({
          }),
        },
      });

      const pkg = JSON.parse(readFileSync("package.json", "utf8"));

      let package_data = {
        name: "bun-sveltekit-app",
        version: "0.0.0",
        type: "module",
        private: true,
        main: "index.js",
        scripts: {
          start: "bun ./index.js",
        },
        dependencies: {
          cookie: "latest",
          devalue: "latest",
          "set-cookie-parser": "latest",
        },
      };

      try {
        pkg.name && (package_data.name = pkg.name);
        pkg.version && (package_data.version = pkg.version);
        pkg.dependencies &&
          (package_data.dependencies = {
            ...pkg.dependencies,
            ...package_data.dependencies,
          });
      } catch (error) {
        builder.log.warn(`Parse package.json error: ${error.message}`);
      }

      writeFileSync(
        `${out}/package.json`,
        JSON.stringify(package_data, null, "\t"),
      );

      builder.log.success(`Start server with: bun ./${out}/index.js`);
    },
  };
}
