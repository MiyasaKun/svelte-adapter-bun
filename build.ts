export interface ServerOptions {
    out?: string;
    precompress: boolean;
    env?: {
        path?: string;
        dynamic?: boolean;
    }
    env_Prefix?:string;
    tls?:{
        key?: string;
        cert?: string;
        ca?: string;
    }
}