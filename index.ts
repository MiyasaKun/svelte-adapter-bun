import { type Adapter } from "@sveltejs/kit";
import { AdapterOptions, BuildOptions } from "./types";
import { writeFileSync } from 'fs'

export default function ({
	out = "build",
	host = "0.0.0.0",
	port = 3000
}: AdapterOptions & BuildOptions = {}): Adapter{
	return {
		 name: "svelte-adapter-bun-ifd",
		 async adapt( builder ){
			builder.rimraf(out)
			builder.mkdirp(out)

			builder.log.minor("Copying assets")
			builder.writeClient(`${out}/client${builder.config.kit.paths.base}`)
			builder.writePrerendered(`${out}/prerendered${builder.config.kit.paths.base}`)
			
			builder.log.minor("Building Server")
			builder.writeServer(`${out}/server`)
		
			writeFileSync(
				`${out}/manifest.js`,
				`export const manifest = ${builder.generateManifest({ relativePath: "./server" })};\n\n` +
				  `export const prerendered = new Set(${JSON.stringify(builder.prerendered.paths)});\n`,
			  );
		}
	}
}