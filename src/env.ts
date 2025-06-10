import { AdapterOptions } from "..";

const adapter_options: AdapterOptions =
  (globalThis as any).__ADAPTER_OPTIONS__ ?? {};

export function env(name: string, fallback: any): any {
  const prefixed = env_prefix + name;

  return prefixed in Bun.env ? Bun.env[prefixed] : fallback;
}

const env_prefix: string = (adapter_options.envPrefix ?? "").toString();

export const development: boolean = env("DEV", true)
