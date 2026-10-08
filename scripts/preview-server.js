import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { bootDocument } from "./no-tags-document.mjs";

const root = join(process.cwd(), "dist");
const rootPrefix = root.endsWith(sep) ? root : root + sep;

const types = new Map([
    [".css", "text/css"],
    [".js", "text/javascript"],
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
]);

const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/") {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.end(bootDocument("./assets/index.js", "./assets/main.css"));
        return;
    }

    const requestPath = decodeURIComponent(url.pathname).replace(/^[/\\]+/, "");
    const path = resolve(root, requestPath);

    if(!path.startsWith(rootPrefix) || !existsSync(path) || !statSync(path).isFile()) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
    }

    res.setHeader("Content-Type", types.get(extname(path)) ?? "application/octet-stream");
    createReadStream(path).pipe(res);
});

const port = Number(process.env.PORT ?? 4173);

server.listen(port, "127.0.0.1", () => {
    console.log(`Server listening on http://127.0.0.1:${port}`);
});
