"use client";

import { useMemo, useState, type FC } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useJudging } from "@/context/JudgingContext";
import { ProjectFeedback } from "@/types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 52;

function getLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 70 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

function scoreToColor(score: number): string {
  const r = Math.round(113 + (34 - 113) * (score / 100));
  const g = Math.round(113 + (197 - 113) * (score / 100));
  const b = Math.round(122 + (94 - 122) * (score / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

interface FeedbackNodeData {
  label: string;
  score: number;
  feedback: ProjectFeedback | null;
  hasFeedback: boolean;
  [key: string]: unknown;
}

const FeedbackNode: FC<NodeProps<Node<FeedbackNodeData>>> = ({ data }) => {
  const borderColor = scoreToColor(data.score);
  const fb = data.feedback;
  const [hovered, setHovered] = useState(false);
  const hasFb = fb && (fb.strengths.length > 0 || fb.weaknesses.length > 0);

  return (
    <div
      style={{
        position: "relative",
        background: "#0a0a0c",
        border: `1px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "8px 10px",
        width: NODE_WIDTH,
        boxShadow: `0 0 8px ${borderColor}22`,
        transition: "box-shadow 0.2s ease",
        ...(hovered ? { boxShadow: `0 0 16px ${borderColor}44` } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          color: "#fafafa",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {data.label}
      </div>
      <div
        style={{
          color: "#a1a1aa",
          fontSize: "10px",
          textAlign: "center",
          marginTop: "2px",
        }}
      >
        Score: {data.score}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Tooltip on hover */}
      {hovered && hasFb && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 10px)",
            transform: "translateX(-50%)",
            background: "#141418",
            border: "1px solid #2a2a30",
            borderRadius: "8px",
            padding: "10px 12px",
            width: "260px",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              color: "#fafafa",
              fontSize: "11px",
              fontWeight: 600,
              marginBottom: "6px",
              borderBottom: "1px solid #2a2a30",
              paddingBottom: "4px",
            }}
          >
            {data.label}
          </div>
          {fb!.strengths.length > 0 && (
            <div style={{ marginBottom: fb!.weaknesses.length > 0 ? "6px" : 0 }}>
              <div style={{ color: "#22c55e", fontSize: "9px", fontWeight: 600, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Strengths
              </div>
              {[...new Set(fb!.strengths)].map((s, i) => (
                <div
                  key={`ts-${i}`}
                  style={{ color: "#a1a1aa", fontSize: "10px", lineHeight: "1.5", paddingLeft: "8px" }}
                >
                  <span style={{ color: "#22c55e" }}>+</span> {s}
                </div>
              ))}
            </div>
          )}
          {fb!.weaknesses.length > 0 && (
            <div>
              <div style={{ color: "#f87171", fontSize: "9px", fontWeight: 600, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Weaknesses
              </div>
              {[...new Set(fb!.weaknesses)].map((w, i) => (
                <div
                  key={`tw-${i}`}
                  style={{ color: "#a1a1aa", fontSize: "10px", lineHeight: "1.5", paddingLeft: "8px" }}
                >
                  <span style={{ color: "#f87171" }}>-</span> {w}
                </div>
              ))}
            </div>
          )}
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "100%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #2a2a30",
            }}
          />
        </div>
      )}
    </div>
  );
};

const nodeTypes = { feedback: FeedbackNode };

export function ComparisonGraph() {
  const { comparisons, getRankedParticipants, feedback } = useJudging();
  const ranked = getRankedParticipants();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<FeedbackNodeData>[] = ranked.map((p) => {
      const fb = feedback[p.id] || null;
      return {
        id: p.id,
        type: "feedback",
        position: { x: 0, y: 0 },
        data: {
          label: p.projectName,
          score: p.score ?? 0,
          feedback: fb,
          hasFeedback: fb !== null && (fb.strengths.length > 0 || fb.weaknesses.length > 0),
        },
      };
    });

    const edges: Edge[] = comparisons.map((c, i) => ({
      id: `e-${i}`,
      source: c.winnerId,
      target: c.loserId,
      animated: true,
      style: { stroke: "#22c55e", strokeWidth: 1.5, opacity: 0.6 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#22c55e",
        width: 16,
        height: 16,
      },
    }));

    const layouted = getLayout(nodes, edges);
    return { initialNodes: layouted, initialEdges: edges };
  }, [ranked, comparisons, feedback]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const fitViewOptions = useMemo(() => ({ padding: 0.3, maxZoom: 1.5 }), []);

  return (
    <div className="w-full flex-1 min-h-0 rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={proOptions}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode="dark"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1c1c22" />
      </ReactFlow>
    </div>
  );
}
