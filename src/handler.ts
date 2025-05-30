import { fileURLToPath } from "bun";
import { constants, IncomingHttpHeaders, ServerHttp2Stream, OutgoingHttpHeaders } from "node:http2";
import path from "node:path";
import { Readable } from "node:stream";

// @ts-ignore - These are virtual modules replaced by the adapter
import { Server } from "__SERVER";
// @ts-ignore - These are virtual modules replaced by the adapter
import { manifest } from "__MANIFEST";

const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
} = constants;

// Initialize the SvelteKit server instance
// This server instance will be used by all stream handlers.
const svelteKitServer = new Server(manifest);

// Top-level await for one-time initialization of the SvelteKit server.
// This ensures server.init() is called once when the module is first loaded.
try {
  await svelteKitServer.init({ env: (globalThis.Bun?.env || process.env) as Record<string, string> });
} catch (e) {
  console.error("Failed to initialize SvelteKit server:", e);
  // Depending on the desired behavior, you might want to process.exit(1)
  // or let requests fail if initialization fails.
}

export async function streamHandler(
  stream: ServerHttp2Stream,
  http2Headers: IncomingHttpHeaders,
): Promise<void> {
  try {
    const method = (http2Headers[HTTP2_HEADER_METHOD] as string) || "GET";
    const requestPath = (http2Headers[HTTP2_HEADER_PATH] as string) || "/";
    
    const scheme = (http2Headers[':scheme'] as string) || 'http';
    const authority = (http2Headers[':authority'] as string) || 'localhost';
    const url = new URL(requestPath, `${scheme}://${authority}`);

    const requestHeaders = new Headers();
    for (const [key, value] of Object.entries(http2Headers)) {
      if (key.startsWith(':')) continue; // Skip HTTP/2 pseudo-headers
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => requestHeaders.append(key, v));
        } else {
          requestHeaders.set(key, value as string);
        }
      }
    }

    let body: BodyInit | null = null;
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "DELETE") {
      // The ServerHttp2Stream is a Node.js Duplex stream.
      // Its readable side is the request body.
      // Bun's Request constructor can handle Node.js Readable streams.
      body = stream as unknown as ReadableStream;
    }

    const svelteKitRequest = new Request(url.toString(), {
      method,
      headers: requestHeaders,
      body,
      // @ts-expect-error - Bun's Request supports duplex: 'half' for Node.js streams
      duplex: 'half',
    });

    const svelteKitResponse = await svelteKitServer.respond(svelteKitRequest, {
      getClientAddress: () => {
        return stream.session?.socket?.remoteAddress || "127.0.0.1";
      },
    });

    const responseHeaders: OutgoingHttpHeaders = {
      ':status': svelteKitResponse.status,
    };

    for (const key of svelteKitResponse.headers.keys()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'set-cookie') {
            // getAll returns an array for set-cookie
            responseHeaders[lowerKey] = svelteKitResponse.headers.getAll(key);
        } else {
            responseHeaders[lowerKey] = svelteKitResponse.headers.get(key)!;
        }
    }
    
    if (stream.closed || stream.destroyed) {
        console.warn(`Stream for ${requestPath} closed before response could be sent.`);
        return;
    }

    stream.respond(responseHeaders);

    if (svelteKitResponse.body) {
      const reader = svelteKitResponse.body.getReader();
      while (true) {
        if (stream.closed || stream.destroyed) {
          console.warn(`Stream for ${requestPath} closed during body write.`);
          await reader.cancel().catch(() => {}); // Suppress cancel error if already closed
          break;
        }
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const writableDidWrite = stream.write(value);
          if (!writableDidWrite) {
            await new Promise(resolve => stream.once('drain', resolve));
          }
        }
      }
    }
    
    if (!stream.closed && !stream.destroyed && stream.writable) {
        stream.end();
    }

  } catch (error) {
    console.error(`Error in streamHandler for ${http2Headers[HTTP2_HEADER_PATH]}:`, error);
    if (!stream.closed && !stream.destroyed && !stream.headersSent) {
      try {
        stream.respond({ ':status': 500, 'content-type': 'text/plain' });
        stream.end('Internal Server Error');
      } catch (e) {
        console.error("Error sending 500 response:", e);
        if (!stream.destroyed) stream.destroy();
      }
    } else if (!stream.closed && !stream.destroyed && stream.writable) {
        stream.end(); // Try to end the stream if possible
    } else if (!stream.destroyed) {
        stream.destroy(); // Ensure stream is cleaned up
    }
  }
}