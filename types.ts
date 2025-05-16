import { type TLSOptions as BunTLSOptions } from "bun";

export interface AdapterOptions {
  envPrefix?: string;
  tls?: TLSOptions | TLSOptions[];
}

export interface BuildOptions {
  out?: string;
}

interface TLSOptions extends BunTLSOptions {
  ca?: string | Array<string> | undefined;
  cert?: string | Array<string> | undefined;
  key?: string | Array<string> | undefined;
}
