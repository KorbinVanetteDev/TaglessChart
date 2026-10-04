import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import {
  ArrowDownToLine,
  Braces,
  Copy,
  Diamond,
  Download,
  FileInput,
  FileJson,
  PanelRight,
  Play,
  RotateCcw,
  RotateCw,
  Square,
  StickyNote,
  Trash2,
} from "lucide-react";
import { FlowNode } from "./FlowNode";
import {
  nodeKinds,
  starterProject,
  type DiagramEdge,
  type DiagramNode,
  type DiagramProject,
  type FlowNodeData,
  type NodeKind,
} from "./flowTypes";
import { mermaidToProject, projectToMermaid } from "./mermaidCodec";
import "./styles.css";

const notATag = React.createElement;

function icon(iconType: any) {
  return notATag(iconType, { size: 16, strokeWidth: 2 });
}

function nodeLabel(kind: NodeKind) {
  if (kind === "startEnd") return "Start / End";
  if (kind === "decision") return "Decision";
  if (kind === "note") return "Note";
  return "Process";
}

function nodeToFlow(node: DiagramNode) {
  return {
    id: node.id,
    type: "flow",
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      kind: node.kind,
      style: node.style,
    },
  };
}

function decisionHandleForLabel(label: string, sourceIndex: number) {
  const normalized = label.trim().toLowerCase();
  const leftLabels = ["yes", "true", "then", "pass", "accept"];
  const rightLabels = ["no", "false", "else", "fail", "reject"];

  if (leftLabels.some((word) => normalized === word || normalized.startsWith(`${word} `))) {
    return "decision-left-source";
  }

  if (rightLabels.some((word) => normalized === word || normalized.startsWith(`${word} `))) {
    return "decision-right-source";
  }

  return sourceIndex % 2 === 0 ? "decision-left-source" : "decision-right-source";
}

function sourceHandleForEdge(edge: DiagramEdge, sourceNode: DiagramNode | undefined, sourceIndex: number) {
  if (sourceNode?.kind === "decision") {
    return decisionHandleForLabel(edge.label, sourceIndex);
  }

  return "bottom-source";
}

function edgeToFlow(edge: DiagramEdge, sourceNode: DiagramNode | undefined, sourceIndex: number) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: sourceHandleForEdge(edge, sourceNode, sourceIndex),
    targetHandle: "top-target",
    type: "straight",
    label: edge.label || undefined,
    style: {
      stroke: "#333333",
      strokeWidth: 1.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#333333",
    },
  };
}

function flowToProject(title: string, nodes: any[], edges: any[]): DiagramProject {
  return {
    version: 1,
    title,
    nodes: nodes.map((node) => {
      const data = node.data as FlowNodeData;
      return {
        id: node.id,
        kind: data.kind,
        label: data.label,
        style: data.style,
        x: node.position.x,
        y: node.position.y,
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === "string" ? edge.label : "",
    })),
  };
}

function projectToFlow(project: DiagramProject) {
  const sourceNodes: { [id: string]: DiagramNode } = {};
  const sourceIndexes: { [id: string]: number } = {};

  for (const node of project.nodes) {
    sourceNodes[node.id] = node;
  }

  return {
    nodes: project.nodes.map(nodeToFlow),
    edges: project.edges.map((edge) => {
      const sourceIndex = sourceIndexes[edge.source] ?? 0;
      sourceIndexes[edge.source] = sourceIndex + 1;
      return edgeToFlow(edge, sourceNodes[edge.source], sourceIndex);
    }),
  };
}

function layoutNodeWidth(node: DiagramNode) {
  if (node.kind === "decision") return 164;
  return 150;
}

function layoutNodeHeight(node: DiagramNode) {
  if (node.kind === "decision") return 104;
  return 48;
}

function edgeStartPoint(node: DiagramNode, sourceHandle: string) {
  if (node.kind === "decision" && sourceHandle === "decision-left-source") {
    return { x: node.x + 41, y: node.y + 78 };
  }

  if (node.kind === "decision" && sourceHandle === "decision-right-source") {
    return { x: node.x + 123, y: node.y + 78 };
  }

  return { x: node.x + layoutNodeWidth(node) / 2, y: node.y + layoutNodeHeight(node) };
}

function edgeEndPoint(node: DiagramNode) {
  return { x: node.x + layoutNodeWidth(node) / 2, y: node.y };
}

function layoutProject(project: DiagramProject): DiagramProject {
  const nodeIds = new Set(project.nodes.map((node) => node.id));
  const incoming: { [id: string]: number } = {};
  const children: { [id: string]: string[] } = {};
  const ranks: { [id: string]: number } = {};

  for (const node of project.nodes) {
    incoming[node.id] = 0;
    children[node.id] = [];
    ranks[node.id] = 0;
  }

  for (const edge of project.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    incoming[edge.target] += 1;
    children[edge.source].push(edge.target);
  }

  const queue = project.nodes.filter((node) => incoming[node.id] === 0).map((node) => node.id);
  const walk = queue.length ? [...queue] : project.nodes.map((node) => node.id);
  let cursor = 0;

  while (cursor < walk.length) {
    const id = walk[cursor];
    cursor += 1;

    for (const childId of children[id]) {
      ranks[childId] = Math.max(ranks[childId], ranks[id] + 1);
      incoming[childId] -= 1;
      if (incoming[childId] <= 0) {
        walk.push(childId);
      }
    }
  }

  const placed = new Set();
  const layers: { [rank: string]: DiagramNode[] } = {};

  for (const node of project.nodes) {
    const rank = ranks[node.id] ?? 0;
    const key = String(rank);
    layers[key] = layers[key] ?? [];
    layers[key].push(node);
    placed.add(node.id);
  }

  for (const node of project.nodes) {
    if (placed.has(node.id)) continue;
    layers["0"] = layers["0"] ?? [];
    layers["0"].push(node);
  }

  const rankKeys = Object.keys(layers)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  const positionedNodes: DiagramNode[] = [];

  for (const rank of rankKeys) {
    const row = layers[String(rank)];
    const rowWidth = (row.length - 1) * 240;
    row.forEach((node, index) => {
      const centerX = 420 - rowWidth / 2 + index * 240;
      positionedNodes.push({
        ...node,
        x: centerX - layoutNodeWidth(node) / 2,
        y: 88 + rank * 150,
      });
    });
  }

  return {
    ...project,
    nodes: positionedNodes,
  };
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function tokenValue(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function assertProject(value: any): DiagramProject {
  if (!value || value.version !== 1 || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error("That file is not a version 1 flow project.");
  }

  return value as DiagramProject;
}

function App() {
  const initial = useMemo(() => projectToFlow(layoutProject(starterProject)), []);
  const nodeTypes = useMemo(() => ({ flow: FlowNode }), []);
  const fileInputRef = useRef(null as any);
  const mermaidInputRef = useRef(null as any);
  const flowInstanceRef = useRef(null as any);

  const [title, setTitle] = useState(starterProject.title);
  const [nodes, setNodes] = useState(initial.nodes);
  const [edges, setEdges] = useState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null as string | null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null as string | null);
  const [notice, setNotice] = useState("Ready.");
  const [past, setPast] = useState([] as DiagramProject[]);
  const [future, setFuture] = useState([] as DiagramProject[]);
  const [mermaidDraft, setMermaidDraft] = useState("");

  const liveProject = useMemo(() => flowToProject(title, nodes, edges), [title, nodes, edges]);
  const mermaidText = useMemo(() => projectToMermaid(liveProject), [liveProject]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  function snapshot() {
    setPast((current) => [...current.slice(-29), liveProject]);
    setFuture([]);
  }

  function applyProject(project: DiagramProject) {
    const next = projectToFlow(project);
    setTitle(project.title);
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast((current) => current.slice(0, -1));
    setFuture((current) => [liveProject, ...current.slice(0, 29)]);
    applyProject(previous);
    setNotice("Undid last project action.");
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture((current) => current.slice(1));
    setPast((current) => [...current.slice(-29), liveProject]);
    applyProject(next);
    setNotice("Redid project action.");
  }

  function addNode(kind: NodeKind) {
    snapshot();
    const id = `${kind}_${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        type: "flow",
        position: {
          x: 160 + current.length * 28,
          y: 120 + current.length * 34,
        },
        data: {
          kind,
          style: "classic",
          label:
            kind === "startEnd"
              ? "Start / End"
              : kind === "decision"
                ? "Decision?"
                : kind === "note"
                  ? "Note"
                  : "Process step",
        },
      },
    ]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setNotice(`Added ${nodeLabel(kind).toLowerCase()} node.`);
  }

  function duplicateSelectedNode() {
    if (!selectedNode) return;
    snapshot();
    const id = `${selectedNode.id}_copy_${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        ...selectedNode,
        id,
        selected: false,
        position: {
          x: selectedNode.position.x + 48,
          y: selectedNode.position.y + 48,
        },
      },
    ]);
    setSelectedNodeId(id);
    setNotice("Duplicated selected node.");
  }

  function deleteSelection() {
    if (!selectedNode && !selectedEdge) return;
    snapshot();
    if (selectedNode) {
      setNodes((current) => current.filter((node) => node.id !== selectedNode.id));
      setEdges((current) => current.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNodeId(null);
      setNotice("Deleted selected node.");
      return;
    }
    if (selectedEdge) {
      const edgeId = selectedEdge.id;
      setEdges((current) => current.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId(null);
      setNotice("Deleted selected edge.");
    }
  }

  function updateSelectedNode(patch: any) {
    if (!selectedNodeId) return;
    snapshot();
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...(node.data as FlowNodeData),
                ...patch,
              },
            }
          : node,
      ),
    );
  }

  function updateSelectedEdgeLabel(label: string) {
    if (!selectedEdgeId) return;
    snapshot();
    setEdges((current) =>
      current.map((edge) => {
        if (edge.id !== selectedEdgeId) return edge;
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const sourceData = sourceNode?.data as FlowNodeData | undefined;
        const nextEdge = {
          ...edge,
          label: label || undefined,
        };

        if (sourceData?.kind === "decision") {
          return {
            ...nextEdge,
            sourceHandle: decisionHandleForLabel(label, current.filter((item) => item.source === edge.source).indexOf(edge)),
          };
        }

        return nextEdge;
      }),
    );
  }

  function onNodesChange(changes: any[]) {
    setNodes((current) => applyNodeChanges(changes, current));
  }

  function onEdgesChange(changes: any[]) {
    setEdges((current) => applyEdgeChanges(changes, current));
  }

  function onConnect(connection: any) {
    snapshot();
    setEdges((current) =>
      {
        const sourceNode = nodes.find((node) => node.id === connection.source);
        const sourceData = sourceNode?.data as FlowNodeData | undefined;
        const sourceIndex = current.filter((edge) => edge.source === connection.source).length;
        const sourceHandle =
          connection.sourceHandle ??
          (sourceData?.kind === "decision" ? decisionHandleForLabel("", sourceIndex) : "bottom-source");

        return addEdge(
          {
            ...connection,
            id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
            sourceHandle,
            targetHandle: connection.targetHandle ?? "top-target",
            type: "straight",
            style: {
              stroke: "#333333",
              strokeWidth: 1.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#333333",
            },
          },
          current,
        );
      },
    );
    setNotice("Connected nodes.");
  }

  function exportProjectFile() {
    downloadText("flowchart.json", JSON.stringify(liveProject, null, 2), "application/json");
    setNotice("Project JSON exported.");
  }

  function exportMermaidFile() {
    downloadText("flowchart.mmd", mermaidText, "text/plain");
    setNotice("Mermaid file exported.");
  }

  function exportSvgFile() {
    const lineColor = "#333333";
    const nodeFill = "#ffffff";
    const paper = "#ffffff";
    const ink = "#111111";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "900");
    svg.setAttribute("height", "620");
    svg.setAttribute("viewBox", "0 0 900 620");

    const background = document.createElementNS(svg.namespaceURI, "rect");
    background.setAttribute("width", "900");
    background.setAttribute("height", "620");
    background.setAttribute("fill", paper);
    svg.appendChild(background);

    const sourceIndexes: { [id: string]: number } = {};

    for (const edge of liveProject.edges) {
      const source = liveProject.nodes.find((node) => node.id === edge.source);
      const target = liveProject.nodes.find((node) => node.id === edge.target);
      if (!source || !target) continue;
      const sourceIndex = sourceIndexes[edge.source] ?? 0;
      sourceIndexes[edge.source] = sourceIndex + 1;
      const sourceHandle = sourceHandleForEdge(edge, source, sourceIndex);
      const start = edgeStartPoint(source, sourceHandle);
      const end = edgeEndPoint(target);
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("stroke", lineColor);
      line.setAttribute("stroke-width", "1.5");
      svg.appendChild(line);
    }

    for (const node of liveProject.nodes) {
      if (node.kind === "decision") {
        const diamond = document.createElementNS(svg.namespaceURI, "polygon");
        diamond.setAttribute(
          "points",
          `${node.x + 82},${node.y} ${node.x + 164},${node.y + 52} ${node.x + 82},${node.y + 104} ${node.x},${node.y + 52}`,
        );
        diamond.setAttribute("fill", nodeFill);
        diamond.setAttribute("stroke", lineColor);
        svg.appendChild(diamond);
      } else {
        const rect = document.createElementNS(svg.namespaceURI, "rect");
        rect.setAttribute("x", String(node.x));
        rect.setAttribute("y", String(node.y));
        rect.setAttribute("width", "140");
        rect.setAttribute("height", "52");
        rect.setAttribute("rx", node.kind === "startEnd" ? "26" : "6");
        rect.setAttribute("fill", nodeFill);
        rect.setAttribute("stroke", lineColor);
        if (node.kind === "note") {
          rect.setAttribute("stroke-dasharray", "6 4");
        }
        svg.appendChild(rect);
      }

      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", String(node.x + (node.kind === "decision" ? 82 : 70)));
      text.setAttribute("y", String(node.y + (node.kind === "decision" ? 57 : 31)));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Inter, system-ui");
      text.setAttribute("font-size", "13");
      text.setAttribute("fill", ink);
      text.textContent = node.label;
      svg.appendChild(text);
    }

    const svgText = new XMLSerializer().serializeToString(svg);
    downloadText("flowchart.svg", svgText, "image/svg+xml");
    setNotice("SVG exported.");
  }

  async function importProjectFile(file: File) {
    try {
      const text = await file.text();
      const project = assertProject(JSON.parse(text));
      snapshot();
      applyProject(project);
      setNotice("Project JSON imported.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import project.");
    }
  }

  async function importMermaidFile(file: File) {
    try {
      const text = await file.text();
      snapshot();
      applyProject(layoutProject(mermaidToProject(text)));
      setNotice("Mermaid subset imported and rendered.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import Mermaid.");
    }
  }

  function applyMermaidDraft() {
    try {
      snapshot();
      applyProject(layoutProject(mermaidToProject(mermaidDraft)));
      setNotice("Mermaid text imported and rendered.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import Mermaid text.");
    }
  }

  function resetProject() {
    snapshot();
    applyProject(layoutProject(starterProject));
    setMermaidDraft("");
    setNotice("Starter flow restored.");
  }

  function renderMermaidLayout() {
    snapshot();
    applyProject(layoutProject(liveProject));
    setNotice("Rendered the flow in a Mermaid-style top-down layout.");
  }

  function controlButton(label: string, action: () => void, iconType: any, disabled = false) {
    return notATag(
      "button",
      { type: "button", onClick: action, disabled },
      icon(iconType),
      label,
    );
  }

  function renderNodeInspector() {
    if (!selectedNode) return null;
    const data = selectedNode.data as FlowNodeData;

    return notATag(
      React.Fragment,
      null,
      notATag(
        "div",
        { className: "field" },
        notATag("label", null, "Label"),
        notATag("input", {
          value: data.label,
          onChange: (event: any) => updateSelectedNode({ label: event.target.value }),
        }),
      ),
      notATag(
        "div",
        { className: "field" },
        notATag("label", null, "Node type"),
        notATag(
          "select",
          {
            value: data.kind,
            onChange: (event: any) => updateSelectedNode({ kind: event.target.value as NodeKind }),
          },
          ...nodeKinds.map((kind) => notATag("option", { key: kind, value: kind }, nodeLabel(kind))),
        ),
      ),
      notATag("div", { className: "tool-group" }, controlButton("Duplicate", duplicateSelectedNode, Copy), controlButton("Delete", deleteSelection, Trash2)),
    );
  }

  function renderEdgeInspector() {
    if (!selectedEdge) return null;
    return notATag(
      React.Fragment,
      null,
      notATag(
        "div",
        { className: "field" },
        notATag("label", null, "Edge label"),
        notATag("input", {
          value: typeof selectedEdge.label === "string" ? selectedEdge.label : "",
          placeholder: "Yes, No, Then",
          onChange: (event: any) => updateSelectedEdgeLabel(event.target.value),
        }),
      ),
      notATag("div", { className: "tool-group" }, controlButton("Delete edge", deleteSelection, Trash2)),
    );
  }

  return notATag(
    "main",
    { className: "app" },
    notATag(
      "section",
      { className: "shell" },
      notATag(
        "aside",
        { className: "rail" },
        notATag("p", { className: "panel-title" }, "Add nodes"),
        notATag(
          "div",
          { className: "tool-group" },
          notATag("button", { className: "tool-button", type: "button", onClick: () => addNode("startEnd") }, icon(Play), "Start / End"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => addNode("process") }, icon(Square), "Process"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => addNode("decision") }, icon(Diamond), "Decision"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => addNode("note") }, icon(StickyNote), "Note"),
        ),
        notATag("p", { className: "panel-title" }, "Project"),
        notATag(
          "div",
          { className: "tool-group" },
          notATag("button", { className: "tool-button", type: "button", onClick: undo, disabled: !past.length }, icon(RotateCcw), "Undo"),
          notATag("button", { className: "tool-button", type: "button", onClick: redo, disabled: !future.length }, icon(RotateCw), "Redo"),
          notATag("button", { className: "tool-button", type: "button", onClick: renderMermaidLayout }, icon(ArrowDownToLine), "Mermaid layout"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => flowInstanceRef.current?.fitView({ padding: 0.2 }) }, icon(PanelRight), "Fit view"),
          notATag("button", { className: "tool-button", type: "button", onClick: resetProject }, icon(Trash2), "Reset"),
        ),
        notATag("p", { className: "panel-title" }, "Files"),
        notATag(
          "div",
          { className: "tool-group" },
          notATag("button", { className: "tool-button", type: "button", onClick: exportProjectFile }, icon(FileJson), "Export JSON"),
          notATag("button", { className: "tool-button", type: "button", onClick: exportMermaidFile }, icon(Braces), "Export Mermaid"),
          notATag("button", { className: "tool-button", type: "button", onClick: exportSvgFile }, icon(Download), "Export SVG"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => fileInputRef.current?.click() }, icon(FileInput), "Import JSON"),
          notATag("button", { className: "tool-button", type: "button", onClick: () => mermaidInputRef.current?.click() }, icon(ArrowDownToLine), "Import Mermaid"),
          notATag("input", {
            ref: fileInputRef,
            className: "file-input",
            type: "file",
            accept: ".json,application/json",
            onChange: (event: any) => {
              const file = event.currentTarget.files?.[0];
              if (file) importProjectFile(file);
              event.currentTarget.value = "";
            },
          }),
          notATag("input", {
            ref: mermaidInputRef,
            className: "file-input",
            type: "file",
            accept: ".mmd,.txt,text/plain",
            onChange: (event: any) => {
              const file = event.currentTarget.files?.[0];
              if (file) importMermaidFile(file);
              event.currentTarget.value = "";
            },
          }),
        ),
      ),
      notATag(
        "div",
        { className: "stage" },
        notATag(
          "div",
          { className: "canvas-wrap" },
          notATag(
            ReactFlow,
            {
              nodes,
              edges,
              nodeTypes,
              onInit: (instance: any) => {
                flowInstanceRef.current = instance;
              },
              onNodesChange,
              onEdgesChange,
              onConnect,
              onNodeDragStop: snapshot,
              onNodeClick: (_event: any, node: any) => {
                setSelectedNodeId(node.id);
                setSelectedEdgeId(null);
              },
              onEdgeClick: (_event: any, edge: any) => {
                setSelectedEdgeId(edge.id);
                setSelectedNodeId(null);
              },
              onPaneClick: () => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              },
              fitView: true,
              fitViewOptions: {
                padding: 0.08,
              },
              connectionLineType: ConnectionLineType.Straight,
              connectionLineStyle: {
                    stroke: "#333333",
                    strokeWidth: 1.5,
              },
              connectionMode: ConnectionMode.Loose,
              defaultEdgeOptions: {
                type: "straight",
                style: {
                  stroke: "#333333",
                  strokeWidth: 1.5,
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#333333",
                },
              },
            },
            notATag(Controls),
          ),
        ),
      ),
      notATag(
        "aside",
        { className: "inspector" },
        notATag(
          "div",
          { className: "inspector__main" },
          notATag("p", { className: "panel-title" }, "Inspector"),
          notATag(
            "div",
            { className: "field" },
            notATag("label", null, "Title"),
            notATag("input", { value: title, onChange: (event: any) => setTitle(event.target.value) }),
          ),
          selectedNode ? renderNodeInspector() : null,
          selectedEdge ? renderEdgeInspector() : null,
          !selectedNode && !selectedEdge ? notATag("p", { className: "empty-state" }, "Select a node or edge to edit its label or type.") : null,
          notATag("p", { className: "panel-title" }, "Status"),
          notATag("p", { className: "empty-state" }, notice),
        ),
        notATag(
          "div",
          { className: "inspector__bottom" },
          notATag("p", { className: "panel-title" }, "Import Mermaid text"),
          notATag(
            "div",
            { className: "field" },
            notATag("textarea", {
              value: mermaidDraft,
              placeholder: "flowchart TD",
              onChange: (event: any) => setMermaidDraft(event.target.value),
            }),
          ),
          notATag("button", { className: "tool-button", type: "button", onClick: applyMermaidDraft }, icon(ArrowDownToLine), "Import text"),
        ),
      ),
    ),
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not created by the dev server.");
}

createRoot(root).render(notATag(App));