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
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store";
import { BlockNode } from "./BlockNode";

const nodeTypes = { block: BlockNode };

export function Canvas() {
  const { file, addBlock } = useStore();

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
        block.childrenIds.map((childId) => ({
          id: `${block.id}-${childId}`,
          source: block.id,
          target: childId,
          style: { stroke: "#45475a", strokeWidth: 2 },
          animated: false,
        }))
      ),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { file: currentFile } = useStore();

  // Sync store → React Flow: add new nodes, remove deleted nodes
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
      return kept.length + added.length !== nds.length || added.length > 0
        ? [...kept, ...added]
        : nds;
    });

    setEdges((eds) => {
      const kept = eds.filter(
        (e) => storeIds.has(e.source) && storeIds.has(e.target)
      );
      const existingEdgeIds = new Set(kept.map((e) => e.id));
      const newEdges: Edge[] = [];
      for (const id of storeIds) {
        const block = currentFile.blocks[id];
        if (!block.parentId) continue;
        const edgeId = `${block.parentId}-${id}`;
        if (!existingEdgeIds.has(edgeId)) {
          newEdges.push({
            id: edgeId,
            source: block.parentId,
            target: id,
            style: { stroke: "#45475a", strokeWidth: 2 },
          });
        }
      }
      return newEdges.length > 0 ? [...kept, ...newEdges] : kept;
    });
  }, [currentFile.blocks]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
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
