// 工作流验证增强
// 根据 WORKFLOW_CONSIDERATIONS.md Phase 2 实现

import { Node, Edge } from "@xyflow/react";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: "missing-node" | "invalid-connection" | "cycle" | "orphan" | "configuration";
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: "error";
}

export interface ValidationWarning {
  type: "best-practice" | "performance" | "maintainability";
  message: string;
  nodeId?: string;
  severity: "warning";
}

/**
 * 全面验证工作流
 */
export function validateWorkflowEnhanced(
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. 检查必需节点
  const hasStart = nodes.some((n) => n.type === "start");
  const hasEnd = nodes.some((n) => n.type === "end");

  if (!hasStart) {
    errors.push({
      type: "missing-node",
      message: "Workflow must contain at least one Start node",
      severity: "error",
    });
  }

  if (!hasEnd) {
    errors.push({
      type: "missing-node",
      message: "Workflow must contain at least one End node",
      severity: "error",
    });
  }

  // 2. 检查是否有 RFC 节点
  const hasRFC = nodes.some((n) => n.type === "rfc-call");
  if (!hasRFC) {
    warnings.push({
      type: "best-practice",
      message: "No RFC Call node in workflow, suggest adding at least one",
      severity: "warning",
    });
  }

  // 3. 检查节点配置
  nodes.forEach((node) => {
    const config = validateNodeConfiguration(node);
    if (!config.isValid) {
      errors.push({
        type: "configuration",
        message: `Node "${node.id}" configuration incomplete: ${config.message}`,
        nodeId: node.id,
        severity: "error",
      });
    }
  });

  // 4. 检查孤立节点
  const orphanNodes = findOrphanNodes(nodes, edges);
  orphanNodes.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.type !== "start" && node.type !== "end") {
      errors.push({
        type: "orphan",
        message: `Node "${nodeId}" is not connected to workflow`,
        nodeId,
        severity: "error",
      });
    }
  });

  // 5. 检查循环
  if (hasCycle(nodes, edges)) {
    errors.push({
      type: "cycle",
      message: "Cycle detected in workflow, please check node connections",
      severity: "error",
    });
  }

  // 6. 检查无效连接
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      errors.push({
        type: "invalid-connection",
        message: `Connection "${edge.id}" references non-existent node`,
        edgeId: edge.id,
        severity: "error",
      });
      return;
    }

    // End 节点不能有输出
    if (sourceNode.type === "end") {
      errors.push({
        type: "invalid-connection",
        message: "End node cannot connect to other nodes",
        edgeId: edge.id,
        nodeId: sourceNode.id,
        severity: "error",
      });
    }

    // Start 节点不能有输入
    if (targetNode.type === "start") {
      errors.push({
        type: "invalid-connection",
        message: "Start node cannot accept connections from other nodes",
        edgeId: edge.id,
        nodeId: targetNode.id,
        severity: "error",
      });
    }
  });

  // 7. 性能警告
  if (nodes.length > 50) {
    warnings.push({
      type: "performance",
      message: "Large number of nodes (>50), may affect execution performance",
      severity: "warning",
    });
  }

  // 8. 最佳实践建议
  const mappingNodes = nodes.filter((n) => n.type === "mapping");
  if (mappingNodes.length === 0 && hasRFC) {
    warnings.push({
      type: "best-practice",
      message: "Consider adding Mapping nodes to transform data formats",
      severity: "warning",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证单个节点的配置
 */
function validateNodeConfiguration(node: Node): { isValid: boolean; message?: string } {
  switch (node.type) {
    case "start":
      if (!node.data.apiPath) {
        return { isValid: false, message: "Missing API path" };
      }
      if (!node.data.httpMethod) {
        return { isValid: false, message: "Missing HTTP method" };
      }
      break;

    case "rfc-call":
      if (!node.data.connectionId && !node.data.connectionName) {
        return { isValid: false, message: "Missing SAP connection" };
      }
      if (!node.data.rfmName) {
        return { isValid: false, message: "Missing RFC function name" };
      }
      break;

    case "mapping":
      if (!node.data.direction) {
        return { isValid: false, message: "Missing mapping direction" };
      }
      if (!node.data.mappingRules || !Array.isArray(node.data.mappingRules) || node.data.mappingRules.length === 0) {
        return { isValid: false, message: "Missing mapping rules" };
      }
      break;

    case "end":
      if (!node.data.statusCode) {
        return { isValid: false, message: "Missing status code" };
      }
      break;
  }

  return { isValid: true };
}

/**
 * 查找孤立节点
 */
function findOrphanNodes(nodes: Node[], edges: Edge[]): string[] {
  const connectedNodeIds = new Set<string>();

  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  return nodes
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);
}

/**
 * 检测循环（DFS）
 */
function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const adjacency = new Map<string, string[]>();
  nodes.forEach((node) => adjacency.set(node.id, []));

  edges.forEach((edge) => {
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * 获取工作流执行路径
 */
export function getExecutionPath(nodes: Node[], edges: Edge[]): string[] {
  const startNode = nodes.find((n) => n.type === "start");
  if (!startNode) return [];

  const path: string[] = [];
  const adjacency = new Map<string, string[]>();

  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });

  const visited = new Set<string>();

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach((next) => traverse(next));
  }

  traverse(startNode.id);
  return path;
}
