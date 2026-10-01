import React from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { NodeKind, NodeStyle } from "./flowTypes";

const h = React.createElement;

export type FlowNodeData = {
    label:string;
    kind: NodeKind;
    style: NodeStyle;
};

type FlowNodeType = Node<FlowNodeData, "flow">;

function presetStyle(style: NodeStyle): React.CSSProperties {
    if(style == "compact") {
        return {
            padding: "8px 12px",
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid oklch(76% 0.03 255)",
            background: "oklch(99% 0.004 250)"
        };
    }

    if(style == "soft") {
        return {
            padding: "14px 18px",
            fontSize: "14px",
            borderRadius: "18px",
            border: "1px solid oklch(86% 0.06 230)",
            background: "oklch(96% 0.035 230)"
        };
    }

    if(style == "technical") {
        return {
            padding: "12px 16px",
            fontSize: "12px",
            borderRadius: "4px",
            border: "1px solid oklch(58% 0.2 256)",
            background: "oklch(20% 0.02 258)",
            color: "white",
            fontFamily: "monospace",
            letterSpacing: "0.02em"
        };
    }

    return {
        padding: "12px 16px",
        fontSize: "13px",
        borderRadius: "10px",
        border: "1px solid oklch(82% 0.025 255)", 
        background: "white"
    }
}

function kindStyle(kind: NodeKind): React.CSSProperties {
    if(kind == "startEnd") {
        return {
            borderRadius: "999px",
            minWidth: "110px",
            textAlign: "center"
        };
    }

    if(kind == "decision") {
        return {
            width: "120px",
            height: "120px",
            transform: "rotate(45deg)",
            display: "grid",
            placeItems: "center",
            textAlign: "center"
        };
    }

    if(kind == "note") {
        return {
            borderStyle: "dashed",
            background: "oklch(98% 0.025 95)"
        };
    }

    return {};
}

export function FlowNode(props: NodeProps<FlowNodeType>) {
    const style = {
        ...presetStyle(props.data.style),
        ...kindStyle(props.data.kind)
    };

    const labelStyle: React.CSSProperties = props.data.kind === "decision" ? {
        transform: "rotate(-45deg)",
        maxWidth: "84px",
        lineHeight: 1.2
    } : {
        lineHeight: 1.25
    };

    return h(
        "div",
        { style },
        h(Handle, { type: "target", position: Position.Top }),
        h("span", { style: labelStyle}, props.data.label),
        h(Handle, { type: "source", position: Position.Bottom })
    );
}