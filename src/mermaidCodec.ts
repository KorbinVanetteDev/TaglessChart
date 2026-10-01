import type { DiagramEdge, DiagramNode, DiagramProject } from "./flowTypes";

function safeId(id: string) {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function safeLabel(label: string) {
    return label.replaceAll("\"","'").replaceAll("\n", " ").trim() || "Untitled";
}

function nodeLine(node: DiagramNode) {
    const id = safeId(node.id);
    const label = safeLabel(node.label);

    if (node.kind === "startEnd") return `${id}(["${label}"])`;
    if (node.kind === "decision") return `${id}{"${label}"}`;
    if (node.kind === "note") return `${id}["${label}"]`;

    return `${id}["${label}"]`;
}

function edgeLines(edge: DiagramEdge) {
    const source = safeId(edge.source);
    const target = safeId(edge.target);
    const label = safeLabel(edge.label);

    if (!edge.label.trim()) return `${source} --> ${target}`;

    return `${source} -->|${label}| ${target}`;
}