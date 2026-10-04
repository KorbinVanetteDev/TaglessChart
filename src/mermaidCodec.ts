import type { DiagramEdge, DiagramNode, DiagramProject, NodeKind } from "./flowTypes";

const nodeLinePattern = /^([A-Za-z][A-Za-z0-9_]*)\s*(.+)$/;
const edgeLinePattern = /^([A-Za-z][A-Za-z0-9_]*)\s*-->(?:\|"([^"]*)"\|)?\s*([A-Za-z][A-Za-z0-9_]*)$/;

function safeId(id: string) {
  const normalized = id.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[A-Za-z]/.test(normalized) ? normalized : `node_${normalized}`;
}

function safeLabel(label: string) {
  return label.replaceAll("\"", "'").replaceAll("\n", " ").trim() || "Untitled";
}

function nodeLine(node: DiagramNode) {
  const id = safeId(node.id);
  const label = safeLabel(node.label);

  if (node.kind === "startEnd") return `${id}(["${label}"])`;
  if (node.kind === "decision") return `${id}{"${label}"}`;
  if (node.kind === "note") return `${id}["${label}"]`;

  return `${id}["${label}"]`;
}

function edgeLine(edge: DiagramEdge) {
  const source = safeId(edge.source);
  const target = safeId(edge.target);
  const label = safeLabel(edge.label);

  if (!edge.label.trim()) return `${source} --> ${target}`;

  return `${source} -->|"${label}"| ${target}`;
}

export function projectToMermaid(project: DiagramProject) {
  const lines = ["flowchart TD"];

  for (const node of project.nodes) {
    lines.push(`  ${nodeLine(node)}`);
  }

  for (const edge of project.edges) {
    lines.push(`  ${edgeLine(edge)}`);
  }

  return lines.join("\n");
}

function unquote(value: string) {
  return value.replace(/^["']|["']$/g, "").trim();
}

function parseNodeBody(body: string): { kind: NodeKind; label: string } | null {
  const value = body.trim();

  if (value.startsWith("([") && value.endsWith("])")) {
    return { kind: "startEnd", label: unquote(value.slice(2, -2)) };
  }

  if (value.startsWith("{") && value.endsWith("}")) {
    return { kind: "decision", label: unquote(value.slice(1, -1)) };
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return { kind: "process", label: unquote(value.slice(1, -1)) };
  }

  return null;
}

export function mermaidToProject(source: string): DiagramProject {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("%%"));

  if (!/^flowchart\s+(TD|TB)$/i.test(lines[0] ?? "")) {
    throw new Error("Only flowchart TD/TB Mermaid diagrams are supported.");
  }

  const nodes = new Map();
  const edges: DiagramEdge[] = [];

  for (const line of lines.slice(1)) {
    const edgeMatch = line.match(edgeLinePattern);
    if (edgeMatch) {
      edges.push({
        id: `edge_${edgeMatch[1]}_${edgeMatch[3]}_${edges.length + 1}`,
        source: edgeMatch[1],
        target: edgeMatch[3],
        label: edgeMatch[2] ?? "",
      });
      continue;
    }

    const nodeMatch = line.match(nodeLinePattern);
    if (!nodeMatch) {
      throw new Error(`Unsupported Mermaid line: ${line}`);
    }

    const parsed = parseNodeBody(nodeMatch[2]);
    if (!parsed) {
      throw new Error(`Unsupported node shape: ${line}`);
    }

    nodes.set(nodeMatch[1], {
      id: nodeMatch[1],
      kind: parsed.kind,
      label: parsed.label,
      style: "classic",
      x: 120 + nodes.size * 28,
      y: 100 + nodes.size * 120,
    });
  }

  for (const edge of edges) {
    if (!nodes.has(edge.source)) {
      nodes.set(edge.source, {
        id: edge.source,
        kind: "process",
        label: edge.source,
        style: "classic",
        x: 120 + nodes.size * 28,
        y: 100 + nodes.size * 120,
      });
    }
    if (!nodes.has(edge.target)) {
      nodes.set(edge.target, {
        id: edge.target,
        kind: "process",
        label: edge.target,
        style: "classic",
        x: 120 + nodes.size * 28,
        y: 100 + nodes.size * 120,
      });
    }
  }

  return {
    version: 1,
    title: "Imported flow",
    nodes: Array.from(nodes.values()),
    edges,
  };
}

export function validateMermaid(source: string) {
  try {
    mermaidToProject(source);
    return {
      ok: true,
      message: "Supported Mermaid subset is valid.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Mermaid text is invalid.",
    };
  }
}