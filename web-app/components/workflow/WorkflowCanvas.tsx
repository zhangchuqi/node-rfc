"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnSelectionChangeParams,
} from "@xyflow/react";

import {
  StartNode,
  MappingNode,
  RFCCallNode,
  EndNode,
  type StartNodeData,
  type MappingNodeData,
  type RFCCallNodeData,
  type EndNodeData,
} from "./nodes";
import NodeConfigDialog from "./NodeConfigDialog";

// 定义节点类型映射
const nodeTypes: NodeTypes = {
  start: StartNode,
  mapping: MappingNode,
  "rfc-call": RFCCallNode,
  end: EndNode,
};

export interface WorkflowDefinition {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowCanvasProps {
  initialWorkflow?: WorkflowDefinition;
  onWorkflowChange?: (workflow: WorkflowDefinition) => void;
  onNodeDoubleClick?: (node: Node) => void;
  readOnly?: boolean;
}

/**
 * WorkflowCanvas - ReactFlow 可视化工作流画布
 * 
 * 提供拖拽式节点编辑、连接管理和实时预览功能
 */
export default function WorkflowCanvas({
  initialWorkflow,
  onWorkflowChange,
  onNodeDoubleClick,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.edges || []
  );
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Track if we're updating from external props to prevent infinite loop
  const isExternalUpdate = useRef(false);

  // 更新外部 workflow 时同步到本地状态
  useEffect(() => {
    if (initialWorkflow) {
      isExternalUpdate.current = true;
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
      setTimeout(() => {
        isExternalUpdate.current = false;
      }, 0);
    }
  }, [initialWorkflow, setNodes, setEdges]);

  // Connection validation
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // Prevent self-loops
      if (sourceNode.id === targetNode.id) return false;

      // Start node can only be source
      if (targetNode.type === "start") return false;

      // End node can only be target
      if (sourceNode.type === "end") return false;

      return true;
    },
    [nodes]
  );

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) {
        console.warn("Invalid connection attempt");
        return;
      }

      const newEdges = addEdge(connection, edges);
      setEdges(newEdges);
      
      // Notify parent after state update
      if (onWorkflowChange) {
        setTimeout(() => {
          onWorkflowChange({ nodes, edges: newEdges });
        }, 0);
      }
    },
    [isValidConnection, edges, nodes, setEdges, onWorkflowChange]
  );

  // Handle node changes and sync to parent
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // Handle edge changes and sync to parent
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Sync to parent after nodes or edges change (debounced)
  useEffect(() => {
    // Don't sync if this is an external update
    if (isExternalUpdate.current || !onWorkflowChange) return;

    const timeoutId = setTimeout(() => {
      onWorkflowChange({ nodes, edges });
    }, 100);

    return () => clearTimeout(timeoutId);
    // Intentionally not including onWorkflowChange in deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Handle edge right-click
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    []
  );

  // Delete edge from context menu
  const handleDeleteEdge = useCallback(() => {
    if (contextMenu) {
      setEdges((eds) => eds.filter((e) => e.id !== contextMenu.edgeId));
      setContextMenu(null);
    }
  }, [contextMenu, setEdges]);

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (readOnly) return;
      // Nodes are already removed by ReactFlow, just sync to parent
      setNodes((nds) => nds.filter((n) => !deleted.some((d) => d.id === n.id)));
    },
    [readOnly, setNodes]
  );

  // Handle drag over for drop zone
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to add node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          label: type === 'mapping' ? 'Data Mapping' : undefined,
          direction: type === 'mapping' ? 'input' : undefined,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-full bg-background relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => setContextMenu(null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node)}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        onNodesDelete={onNodesDelete}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        selectNodesOnDrag={false}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          gap={16} 
          size={1} 
          color="hsl(var(--border))" 
        />
        <Controls 
          position="top-left"
          className="!left-4 !top-4 bg-background border border-border rounded-md shadow-md"
          showInteractive={false}
        />
        <MiniMap
          position="bottom-right"
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bottom-4 !right-4 bg-background border border-border rounded-md shadow-md"
          maskColor="hsl(var(--muted) / 0.3)"
        />
      </ReactFlow>
      
      {/* Floating tooltip */}
      {!readOnly && nodes.length > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg px-4 py-2 text-xs text-muted-foreground z-10 pointer-events-none">
          💡 Double-click to configure | Drag from palette to add | Right-click edge to delete
        </div>
      )}

      {/* Context Menu for edges */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            onClick={handleDeleteEdge}
          >
            <span className="text-destructive">🗑️</span> Delete Connection
          </button>
        </div>
      )}
    </div>
  );
}
