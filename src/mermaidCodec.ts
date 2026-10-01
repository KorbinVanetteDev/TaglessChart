import type {
    DiagramEdge,
    DiagramNode,
    DiagramProject,
} from "./flowTypes";

import mermaid from "mermaid";

function safeId(id: string) {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function safeLabel(label: string) {
    return (
        label
            .replaceAll("\"", "'")
            .replaceAll("\n", " ")
            .trim() || "Untitled"
    );
}

function nodeLine(node: DiagramNode) {
    const id = safeId(node.id);
    const label = safeLabel(node.label);

    if (node.kind === "startEnd") {
        return `${id}(["${label}"])`;
    }

    if (node.kind === "decision") {
        return `${id}{"${label}"}`;
    }

    if (node.kind === "note") {
        return `${id}["${label}"]`;
    }

    return `${id}["${label}"]`;
}

function edgeLine(edge: DiagramEdge) {
    const source = safeId(edge.source);
    const target = safeId(edge.target);

    if (!edge.label.trim()) {
        return `${source} --> ${target}`;
    }

    const label = safeLabel(edge.label);

    return `${source} -->|${label}| ${target}`;
}

export function projectToMermaid(project: DiagramProject) {
    const lines = ["flowchart TD"];

    for (const node of project.nodes) {
        lines.push(`   ${nodeLine(node)}`);
    }

    for (const edge of project.edges) {
        lines.push(`   ${edgeLine(edge)}`);
    }

    return lines.join("\n");
}

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
});

export async function validateMermaid(source: string) {
    try {
        await mermaid.parse(source);

        return {
            ok: true,
            message: "Valid Mermaid syntax.",
        };
    } catch (error) {
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Mermaid syntax error.",
        };
    }
}