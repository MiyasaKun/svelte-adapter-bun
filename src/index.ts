import { Serve } from "bun";

const { serve } = require("bun");

const serverOptions: Serve = {
    fetch(req: Request): Response | Promise<Response> {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response("Hello from Bun!", { status: 200 });
        return new Response("Not Found", { status: 404 });
    },
    hostname: "0.0.0.0",
    port: 3000,
    
}
console.log("Server is running on ")
serve(serverOptions)