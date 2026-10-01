import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { starterProject } from "./flowTypes";
import { projectToMermaid, validateMermaid } from "./mermaidCodec";
import "@xyflow/react/dist/style.css";
import {
    Background,
    Controls,
    ReactFlow,
    type Edge,
    type Node,
} from "@xyflow/react";

const h = React.createElement;

function App() {
    const mermaidText = projectToMermaid(starterProject);

    const [validationMessage, setValidationMessage] =
        useState("Validating...");

    const [isValid, setIsValid] =
        useState<boolean | null>(null);

    useEffect(() => {
        async function validate() {
            const result = await validateMermaid(mermaidText);

            setValidationMessage(result.message);
            setIsValid(result.ok);
        }

        validate();
    }, [mermaidText]);

    const flowNodes: Node[] = starterProject.nodes.map((node) => ({
        id: node.id,
        position: { x: node.x, y: node.y },
        data: { label: node.label },
        type: "default",
    }));

    const flowEdges: Edge[] = starterProject.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || undefined,
    }));

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
                    border: "1px solid oklch(88% 0.018 255)",
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
                        border: "1px solid oklch(88% 0.018 255)",
                        borderRadius: "12px",
                        overflow: "hidden",
                    }
                },
                h(
                    ReactFlow,
                    {
                        nodes: flowNodes,
                        edges: flowEdges,
                        fitView: true
                    },
                    h(Background),
                    h(Controls)
                )
            ),
            h(
                "pre",
                {
                    style: {
                        margin: "24px 0 0",
                        padding: "16px",
                        borderRadius: "8px",
                        overflow: "auto",
                        background: "oklch(18% 0.02 258)",
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
                        color:
                            isValid === null ? "inherit" : isValid ? "oklch(45% 0.13 150)" : "oklch(52% 0.16 25)",
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