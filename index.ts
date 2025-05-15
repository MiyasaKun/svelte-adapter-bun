import type { ServerOptions } from "./build";
import type { Adapter } from '@sveltejs/kit';

/** @param {AdapterSpecificOptions} options */
export default function (options:ServerOptions): Adapter {
	/** @type {import('@sveltejs/kit').Adapter} */
	const adapter = {
        options,
		name: 'svelte-adapter-bun',
		async adapt(builder) {
            const client_path = join(options.out, 'client');
            const server_path = join(options.out, 'server');

            utils
		}
	};

	return adapter;
}