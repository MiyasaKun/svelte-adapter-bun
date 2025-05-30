// filepath: c:\Users\TSc\Desktop\Aurigalis\svelte-adapter-bun\src\index.ts
import { readFileSync } from "node:fs";
import { createSecureServer, constants as http2constants } from "node:http2";
import { streamHandler } from "./handler"; // Assuming handler is in a separate file

// @ts-ignore - This placeholder is replaced by the adapter
const ADAPTER_OPTIONS_PLACEHOLDER = "__ADAPTER_OPTIONS__";
const adapterOptions = JSON.parse(ADAPTER_OPTIONS_PLACEHOLDER);

const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const development = adapterOptions.development;

// TLS options (ensure cert paths are correct for the deployed app)
// These paths should be relative to where the server runs (e.g., the 'build' directory)
// or use absolute paths / environment variables for certs.
const tlsOptions = {
  key: readFileSync(process.env.TLS_KEY_PATH || "./cert/localhost-key.pem"),
  cert: readFileSync(process.env.TLS_CERT_PATH || "./cert/localhost.pem"),
};

const serverOptions = {
  ...tlsOptions,
  allowHTTP1: false, // HTTP/2 only
};

const server = createSecureServer(serverOptions);

server.on("stream", (stream, headers) => {
  // Pass adapterOptions to streamHandler if it needs them directly,
  // or handler can import and parse __ADAPTER_OPTIONS__ itself.
  // For simplicity, handler.ts will also parse it.
  streamHandler(stream, headers);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

if (development) {
  server.on("session", (session) => {
    console.log("HTTP/2 Session connected");
    session.on("close", () => console.log("HTTP/2 Session closed"));
    session.on("error", (err) => console.error("HTTP/2 Session error:", err));
  });
}

server.listen(port, hostname, () => {
  console.info(`Listening on https://${hostname}:${port} (HTTP/2)`);
  if (development) {
    console.log("Development mode: ON");
    console.log("Adapter Options:", adapterOptions);
  }
});

export { server };