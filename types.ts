export interface BuildOptions {
    out?: string;
    origin?: string;
  }
export interface AdapterOptions {
    host?: string;
    port?: number;
    development?: boolean;
    envPrefix?: string;
    assets?: boolean;
}