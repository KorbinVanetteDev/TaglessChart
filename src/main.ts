import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { starterProject } from "./flowTypes";
import { projectToMermaid, validateMermaid } from "./mermaidCodec";
import type { NodeKind, NodeStyle } from "./flowTypes";
import "@xyflow/react/dist/style.css";

import {
    Background,
    Controls,
    ReactFlow,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    MarkerType,
    type Connection,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
} from "@xyflow/react";

const h = React.createElement;

type FlowNodeData = {
    label: string;
    kind: NodeKind;
    style: NodeStyle;
};

function App() {
    const initialNodes = useMemo<Node<FlowNodeData>[]>(
        () =>
            starterProject.nodes.map((node) => ({
                id: node.id,
                position: {
                    x: node.x,
                    y: node.y,
                },
                data: {
                    label: node.label,
                    kind: node.kind,
                    style: node.style
                },
                type: "default",
            })),
        []
    );

    const initialEdges = useMemo<Edge[]>(
        () =>
            starterProject.edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label || undefined,
                markerEnd: {
                    type: MarkerType.ArrowClosed
                }
            })),
            []
        );

    const [nodes, setNodes] = useState<Node<FlowNodeData>[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId);

    function updateSelectedNode(patch: Partial<FlowNodeData>) {
        setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...patch } } : node));
    }

    const liveProject = useMemo(
        () => ({
            version: 1 as const,
            title: "Untitled Chart",

            nodes: nodes.map((node) => ({
                id: node.id,
                style: node.data.style,
                kind: node.data.kind,
                label: String(
                    node.data.label ?? "Untitled"
                ),

                x: node.position.x,
                y: node.position.y,
            })),

            edges: edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,

                label:
                    typeof edge.label === "string"
                        ? edge.label
                        : "",
            })),
        }),
        [nodes, edges]
    );

    const mermaidText = useMemo(
        () => projectToMermaid(liveProject),
        [liveProject]
    );

    const [validationMessage, setValidationMessage] =
        useState("Validating...");

    const [isValid, setIsValid] =
        useState<boolean | null>(null);

    function onNodesChange(changes: NodeChange<Node<FlowNodeData>>[]) {
        setNodes((current) =>
            applyNodeChanges(changes, current)
        );
    }

    function onEdgesChange(changes: EdgeChange<Edge>[]) {
        setEdges((current) =>
            applyEdgeChanges(changes, current)
        );
    }

    function onConnect(connection: Connection) {
        setEdges((current) =>
            addEdge(
                {
                    ...connection,
                    id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
                    markerEnd: {
                        type: MarkerType.ArrowClosed
                    }
                },
                current
            )
        );
    }

    function addNode(kind: NodeKind) {
        const id = `${kind}_${Date.now()}`;

        setNodes((current) => [
            ...current,
            {
                id,
                type: "default",
                position: {
                    x: 120 + current.length * 24,
                    y: 120 + current.length * 24
                },
                data: {
                    kind,
                    style: "classic",
                    label: kind === "startEnd" ? "Start/End" : kind === "decision" ? "Decision?" : kind === "note" ? "Note" : "Process",
                }
            }
        ]);
    }

    useEffect(() => {
        async function validate() {
            const result =
                await validateMermaid(mermaidText);

            setValidationMessage(result.message);
            setIsValid(result.ok);
        }

        validate();
    }, [mermaidText]);

    return h(
        "main",
        {
            style: {
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                fontFamily: "system-ui, sans-serif",
                background: "oklch(98% 0.02 258)",
                color: "oklch(24% 0.02 258)",
            },
        },

        h(
            "section",
            {
                style: {
                    width: "min(720px, calc(100vw - 23px))",
                    border:
                        "1px solid oklch(88% 0.018 255)",
                    borderRadius: "12px",
                    padding: "32px",
                    background: "oklch(100% 0)",
                },
            },

            h(
                "p",
                {
                    style: {
                        margin: 0,
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                    },
                },
                "Hello, World!"
            ),

            h(
                "h1",
                {
                    style: {
                        margin: "12px 0",
                        fontSize: "32px",
                    },
                },
                "Welcome to Tagless!"
            ),

            h(
                "p",
                {
                    style: {
                        margin: 0,
                        lineHeight: 1.6,
                    },
                },
                "Make a flowchart!"
            ),

            h(
                "div",
                {
                    style: {
                        height: "360px",
                        margin: "24px 0 0",
                        border:
                            "1px solid oklch(88% 0.018 255)",
                        borderRadius: "12px",
                        overflow: "hidden",
                    },
                },
                h(
                    "div",
                    {
                        style: {
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            margin: "24px 0 0"
                        }
                    },
                    h("button", { onClick: () => addNode("startEnd") }, "Add Start/End Node"),
                    h("button", { onClick: () => addNode("process") }, "Add Process Node"),
                    h("button", { onClick: () => addNode("decision") }, "Add Decision Node"),
                    h("button", { onClick: () => addNode("note") }, "Add Note Node")
                ),
                h(
                    ReactFlow,
                    {
                        nodes,
                        edges,
                        onNodesChange,
                        onEdgesChange,
                        onConnect,
                        fitView: true,
                        onNodeClick: (_event, node) => setSelectedNodeId(node.id),
                        onPaneClick: () => setSelectedNodeId(null)
                    },

                    h(Background),
                    h(Controls)
                )
            ),

            h(
                "aside",
                {
                    style: {
                        margin: "16px 0 0",
                        padding: "16px",
                        border: "1px solid oklch(88% 0.018 255)",
                        borderRadius: "12px",
                        display: "grid",
                        gap: "12px"
                    }
                },
                h(
                    "strong",
                    null,
                    selectedNode ? "Selected Node" : "No Selected Node"
                ),
                selectedNode
                    ? h(
                        React.Fragment,
                        null,
                        h(
                            "select",
                            {
                                value: selectedNode.data.kind,
                                onChange: (event: React.ChangeEvent<HTMLSelectElement>) => updateSelectedNode({ kind: event.target.value as NodeKind }),
                                style: {
                                    padding: "10px 12px",
                                    border: "1px solid oklch(82% 0.02 255)",
                                    borderRadius: "8px"
                                }
                            },
                            h("option", { value: "startEnd" }, "Start / End"),
                            h("option", { value: "process" }, "Process"),
                            h("option", { value: "decision" }, "Decision"),
                            h("option", { value: "note" }, "Note")
                        ),
                        h(
                            "select",
                            {
                                value: selectedNode.data.style,
                                onChange: (event: React.ChangeEvent<HTMLSelectElement>) => updateSelectedNode({ style: event.target.value as NodeStyle }),
                                style: {
                                    padding: "10px 12px",
                                    border: "1px solid oklch(82% 0.02 255)",
                                    borderRadius: "8px"
                                }
                            },
                            h("option", { value: "classic" }, "Classic"),
                            h("option", { value: "compact" }, "Compact"),
                            h("option", { value: "soft" }, "Soft"),
                            h("option", { value: "technical" }, "Technical")
                        )

                    ) : h("p", { style: { margin: 0 } }, "Select a node to edit it." )
            ),

            h(
                "pre",
                {
                    style: {
                        margin: "24px 0 0",
                        padding: "16px",
                        borderRadius: "8px",
                        overflow: "auto",
                        background:
                            "oklch(18% 0.02 258)",
                        color: "white",
                        fontSize: "14px",
                        lineHeight: 1.4,
                        whiteSpace: "pre-wrap",
                    },
                },

                mermaidText
            ),

            h(
                "p",
                {
                    style: {
                        margin: "12px 0 0",
                        color: isValid === null ? "inherit" : isValid ? "oklch(45% 0.13 150)" : "oklch(52% 0.16 25)",
                    },
                },

                validationMessage
            )
        )
    );
}

const root = document.getElementById("root");

if (!root) {
    throw new Error("Root element not found");
}

createRoot(root).render(h(App));