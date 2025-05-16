import { Serve, serve } from "bun"
import { readFileSync } from "node:fs";
import { createSecureServer } from "node:http2";
import { env } from "./env";
import Stream from "node:stream";

const hostname = "0.0.0.0";
const port = 3000;
const development: boolean = true;
const tls = [];

const Server = createSecureServer({
    key: readFileSync(env("TLS_KEY", "./certs/key.pem")),
    cert: readFileSync(env("TLS_CERT", "./certs/key.pem")),
}, (req,res) => {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200,{ 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
});

console.info(`Listening on ${hostname + ":" + port}`);

Server.listen(port,hostname)