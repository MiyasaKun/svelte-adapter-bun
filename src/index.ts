import { Serve, serve, TLSOptions } from "bun"
import { readFileSync } from "node:fs";
import { createSecureServer, getDefaultSettings, Http2SecureServer, SecureServerOptions } from "node:http2";
import { env } from "./env";
import Stream from "node:stream";
import { TlsOptions } from "node:tls";

const hostname = "0.0.0.0";
const port = 3000;
const development: boolean = true;
const tls: TlsOptions = {
  key: readFileSync("/Users/tomschonborn/Desktop/dev/svelte-adapter-bun/certs/key.pem"),
  cert: readFileSync("/Users/tomschonborn/Desktop/dev/svelte-adapter-bun/certs/certificate.pem"),
}; 
const options: SecureServerOptions = {
  ...tls,
  allowHTTP1: false,
}

const Server: Http2SecureServer = createSecureServer(options)

Server.on("stream", (stream, headers) => {
  stream.respond({
    ":status": 200,
    "content-type": "text/html; charset=utf-8",
  });
  stream.end("<h1>Hello from Bun!</h1>");
});

console.info(`Listening on ${hostname + ":" + port}`);

if(development){
    Server.on("error", (err) => {
        console.error("Server error:", err);
    });
    Server.on("session",(session) => {
        console.log("Session connected");
    })
}

Server.listen(port,hostname)