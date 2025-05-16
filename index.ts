import { type Adapter } from "@sveltejs/kit";
import { AdapterOptions, BuildOptions } from "./types";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const files = fileURLToPath(new URL("./files",import.meta.url).href);


export default function ({
  out = "build",
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
            builder.prerendered.paths
          )});\n`
      );
      builder.copy(files,out,{
        replace: {
          __SERVER: "./server/index.js",
          __MANIFEST: "./manifest.js",
          __ADAPTER_OPTIONS: JSON.stringify({}),
        }
      })
    },

  };
}
