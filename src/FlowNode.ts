import React from "react";
import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData, NodeKind } from "./flowTypes";

const notATag = React.createElement;

function kindClass(kind: NodeKind) {
  return `flow-node--${kind}`;
}

function handlePair(position: any, name: string) {
  return [
    notATag(Handle, {
      key: `target-${name}`,
      className: `flow-handle flow-handle--${name} flow-handle--target`,
      id: `${name}-target`,
      type: "target",
      position,
    }),
    notATag(Handle, {
      key: `source-${name}`,
      className: `flow-handle flow-handle--${name} flow-handle--source`,
      id: `${name}-source`,
      type: "source",
      position,
    }),
  ];
}

function decisionConditionHandles(kind: NodeKind) {
  if (kind !== "decision") return [];

  return [
    notATag(Handle, {
      key: "source-decision-left",
      className: "flow-handle flow-handle--decision-left flow-handle--source",
      id: "decision-left-source",
      type: "source",
      position: Position.Bottom,
    }),
    notATag(Handle, {
      key: "source-decision-right",
      className: "flow-handle flow-handle--decision-right flow-handle--source",
      id: "decision-right-source",
      type: "source",
      position: Position.Bottom,
    }),
  ];
}

export function FlowNode(props: any) {
  const data = props.data as FlowNodeData;
  const className = `flow-node ${kindClass(data.kind)}`;

  return notATag(
    "div",
    { className },
    ...handlePair(Position.Top, "top"),
    ...handlePair(Position.Right, "right"),
    ...handlePair(Position.Bottom, "bottom"),
    ...handlePair(Position.Left, "left"),
    ...decisionConditionHandles(data.kind),
    notATag("span", { className: "flow-node__label" }, data.label),
  );
}