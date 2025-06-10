import { constants, IncomingHttpHeaders, ServerHttp2Stream } from "node:http2";

// @ts-ignore - These are virtual modules replaced by the adapter
import { Server } from "SERVER";
// @ts-ignore - These are virtual modules replaced by the adapter
import type { Server as SvServer } from "@sveltejs/kit";
import { manifest } from "MANIFEST";
import { NodeServer } from ".";
import { development } from "./env";

const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH } = constants;

const server: SvServer = new Server(manifest);
await server.init({ env: (Bun || process).env });

export const streamHandler = (
  stream: ServerHttp2Stream,
  headers: IncomingHttpHeaders
) => {
  const method = headers[HTTP2_HEADER_METHOD] as string;
  const path = headers[HTTP2_HEADER_PATH] as string;
  const scheme = headers[":scheme"] || "https";
  const authority = headers[":authority"] || headers["host"] || "localhost";
  const url = `${scheme}://${authority}${path}`;

  const request = new Request(url, {
    method,
    headers: Object.entries(headers)
      .filter(([k]) => !k.startsWith(":"))
      .flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((val) => [k, val]) : [[k, v]]
      ) as [string, string][],
    body:
      typeof stream.readable === "object" && stream.readable !== null
        ? stream.readable
        : undefined,
  });
  const clientIp = "192.168.0.0";

  server.respond(request, {
    getClientAddress() {
      if (development) {
        console.info("getClientAddress(", request.url, ")");
      }
      return clientIp;
    },
    platform: {
      get NodeServer() {
        return NodeServer;
      },
      get isBun() {
        return true;
      },
      get originalRequest() {
        return request;
      },
    },
  }).then((response) => {
    
  });
};
