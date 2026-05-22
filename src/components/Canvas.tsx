import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type OnNodeDrag,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store";
import { BlockNode } from "./BlockNode";
import type { Block } from "../lib/types";

function getEdgeHandles(parent: Block, child: Block): { sourceHandle: string; targetHandle: string } {
  const px = parent.position?.x ?? 0;
  const py = parent.position?.y ?? 0;
  const cx = child.position?.x ?? 0;
  const cy = child.position?.y ?? 0;
  const dx = cx - px;
  const dy = cy - py;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "source-right", targetHandle: "target-left" }
      : { sourceHandle: "source-left", targetHandle: "target-right" };
  } else {
    return dy >= 0
      ? { sourceHandle: "source-bottom", targetHandle: "target-top" }
      : { sourceHandle: "source-top", targetHandle: "target-bottom" };
  }
}

const nodeTypes = { block: BlockNode };

export function Canvas() {
  const { file, addBlock, updateBlock } = useStore();

  const initialNodes: Node[] = useMemo(
    () =>
      Object.values(file.blocks).map((block) => ({
        id: block.id,
        type: "block",
        position: block.position ?? { x: 400, y: 200 },
        data: {},
      })),
    []
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      Object.values(file.blocks).flatMap((block) =>
        block.childrenIds.map((childId) => {
          const child = file.blocks[childId];
          const { sourceHandle, targetHandle } = getEdgeHandles(block, child);
          return {
            id: `${block.id}-${childId}`,
            source: block.id,
            target: childId,
            sourceHandle,
            targetHandle,
            style: { stroke: "#45475a", strokeWidth: 2 },
          };
        })
      ),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { file: currentFile } = useStore();

  // Sync store → React Flow nodes and edges (full recompute)
  useEffect(() => {
    const storeIds = new Set(Object.keys(currentFile.blocks));

    setNodes((nds) => {
      const flowIds = new Set(nds.map((n) => n.id));
      const newIds = [...storeIds].filter((id) => !flowIds.has(id));
      const kept = nds.filter((n) => storeIds.has(n.id));
      const added = newIds.map((id) => ({
        id,
        type: "block" as const,
        position: currentFile.blocks[id].position ?? { x: 400, y: 300 },
        data: {},
      }));
      return kept.length !== nds.length || added.length > 0 ? [...kept, ...added] : nds;
    });

    // Recompute ALL edges from store so handle directions stay correct after drag
    const allEdges: Edge[] = [];
    for (const id of storeIds) {
      const block = currentFile.blocks[id];
      if (!block.parentId) continue;
      const parent = currentFile.blocks[block.parentId];
      if (!parent) continue;
      const { sourceHandle, targetHandle } = getEdgeHandles(parent, block);
      allEdges.push({
        id: `${block.parentId}-${id}`,
        source: block.parentId,
        target: id,
        sourceHandle,
        targetHandle,
        style: { stroke: "#45475a", strokeWidth: 2 },
      });
    }
    setEdges(allEdges);
  }, [currentFile.blocks]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      updateBlock(node.id, { position: node.position });
    },
    [updateBlock]
  );

  const onPaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const position = { x: e.clientX - bounds.left - 140, y: e.clientY - bounds.top };
      addBlock(null, position);
    },
    [addBlock]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => {}}
        onDoubleClick={onPaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "#11111b" }}
      >
        <Background color="#313244" gap={24} />
        <Controls style={{ background: "#1e1e2e", border: "1px solid #45475a", color: "#cdd6f4" }} />
        <MiniMap style={{ background: "#1e1e2e" }} nodeColor="#45475a" />
      </ReactFlow>
    </div>
  );
}
