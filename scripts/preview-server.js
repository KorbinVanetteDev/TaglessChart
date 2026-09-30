import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extName, join, normalize } from "node:path";
import { bootDocument } from "./no-tags-document.mjs";

const root = join(process.cwd(), "dist");

const types = new Map([
    [".css", "text/css"],
    [".js", "text/javascript"],
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
]);

const server = createServer((req, res) => {
    const url = normalize(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.end(bootDocument("/assets/index.js"));
        return;
    }

    const path = normalize(join(root, url.pathname));

    if(!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
    }

    res.setHeader("Content-Type", types.get(extName(path)) ?? "application/octet-stream");
    createReadStream(path).pipe(res);
});

server.listen(8080, "localhost", () => {
    console.log("Server listening on http://localhost:8080");
});