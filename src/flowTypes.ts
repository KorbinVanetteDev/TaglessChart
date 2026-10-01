export type NodeKind = "startEnd" | "process" | "decision" | "note";
export type NodeStyle = "classic" | "compact" | "soft" | "technical";

export type DiagramNode = {
    id: string;
    kind: NodeKind;
    label: string;
    style: NodeStyle;
    x: number;
    y: number;
};

export type DiagramEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
};

export type DiagramProject = {
    version: 1;
    title: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
};

export const starterProject: DiagramProject = {
    version: 1,
    title: "Untitled Chart",
    nodes: [
        {
            id: "start",
            kind: "startEnd",
            label: "Start",
            style: "classic",
            x: 80,
            y: 80
        },
        {
            id: "step_1",
            kind: "process",
            label: "Draft the chart",
            style: "classic",
            x: 80,
            y: 210
        },
        {
            id: "decision_1",
            kind: "decision",
            label: "Ready to export?",
            style: "classic",
            x: 80,
            y: 350
        }
    ],
    edges: [
        {
            id: "edge_start_step_1",
            source: "start",
            target: "step_1",
            label: ""
        },
        {
            id: "edge_step_1_decision_1",
            source: "step_1",
            target: "decision_1",
            label: ""
        }
    ]
};