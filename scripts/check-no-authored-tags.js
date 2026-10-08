import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "scripts"];
const allowed = [
    /React\.createElement/g,
    /document\.createElement/g,
    /document\.createElementNS/g,
];

const tagPattern = /<[A-Za-z][^>]*>/g;
const offenders = [];

function walk(dir) {
    for(const name of readdirSync(dir)) {
        const path = join(dir, name);
        const stat = statSync(path);

        if(stat.isDirectory()) {
            walk(path);
            continue;
        }

        if(!/\.(ts|tsx|css|mjs)$/.test(path)) continue;

        const text = readFileSync(path, "utf-8");
        const stripped = allowed.reduce((next, pattern) => next.replace(pattern, ""), text);
        const matches = stripped.match(tagPattern);

        if (matches) {
            offenders.push(`${path}: ${matches.slice(0, 4).join(", ")}`);
        }
    }
}

roots.forEach(walk);

if(offenders.length) {
    console.error("Authored tags found in the following files:");
    console.error(offenders.join("\n"));
    process.exit(1);
}

console.log("No authored tags found.");