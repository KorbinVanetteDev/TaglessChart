import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bootDocument } from "./no-tags-document.mjs";

const outputPath = join(process.cwd(), "dist", "index.html");
const document = bootDocument("./assets/index.js", "./assets/main.css");

await writeFile(outputPath, document, "utf8");
console.log(`Generated ${outputPath}`);
