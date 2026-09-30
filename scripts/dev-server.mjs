import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { bootDocument } from "./no-tags-document.mjs";

const server = await createServer({
    server: {
        host: "localhost",
        port: 8080,
    },
    plugins: [
        react(),
        {
            name: "no-authored-tags-entry",
            configureServer(vite) {
                vite.middlewares.use((req, res, next) => {
                    if(req.url !== "/") {
                        next();
                        return;
                    }

                    res.setHeader("Content-Type", "text/html; charset=UTF-8");
                    res.end(bootDocument("/src/main.ts"));
                })
            }
        }
    ]
})