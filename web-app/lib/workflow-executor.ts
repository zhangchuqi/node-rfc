import type { Node, Edge } from "@xyflow/react";
import type { MappingRule } from "@/components/workflow/nodes";
import { applyMapping } from "./json-mapper";

/**
 * 工作流定义接口
 */
export interface WorkflowDefinition {
  nodes: Node[];
  edges: Edge[];
}

/**
 * 工作流执行上下文
 */
interface ExecutionContext {
  // 当前节点的输入数据
  currentData: any;
  
  // 所有节点的执行结果
  results: Map<string, any>;
  
  // 变量存储
  variables: Map<string, any>;
}

/**
 * 节点执行结果
 */
interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  status: "success" | "error";
  input: any;
  output: any;
  duration: number;
  error?: string;
}

/**
 * 工作流执行器
 * 
 * 遍历工作流图并按顺序执行每个节点
 */
export class WorkflowExecutor {
  private workflow: WorkflowDefinition;
  private context: ExecutionContext;
  private executionLog: NodeExecutionResult[] = [];

  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
    this.context = {
      currentData: null,
      results: new Map(),
      variables: new Map(),
    };
  }

  /**
   * 执行完整工作流
   * 
   * @param initialInput - 来自 API 的初始输入数据
   * @param rfcExecutor - RFC 调用函数
   * @returns 工作流执行结果
   */
  async execute(
    initialInput: any,
    rfcExecutor: (connectionId: string, rfmName: string, params: any) => Promise<any>
  ): Promise<{
    success: boolean;
    result: any;
    executionLog: NodeExecutionResult[];
    error?: string;
  }> {
    try {
      this.context.currentData = initialInput;
      this.executionLog = [];

      // 查找起始节点
      const startNode = this.workflow.nodes.find((n) => n.type === "start");
      if (!startNode) {
        throw new Error("No start node found in workflow");
      }

      // 从起始节点开始执行
      const finalResult = await this.executeNode(startNode, rfcExecutor);

      return {
        success: true,
        result: finalResult,
        executionLog: this.executionLog,
      };
    } catch (error: any) {
      return {
        success: false,
        result: null,
        executionLog: this.executionLog,
        error: error.message || "Workflow execution failed",
      };
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: Node,
    rfcExecutor: (connectionId: string, rfmName: string, params: any) => Promise<any>
  ): Promise<any> {
    const startTime = Date.now();
    const input = this.context.currentData;

    try {
      let output: any;

      // 根据节点类型执行不同逻辑
      switch (node.type) {
        case "start":
          output = await this.executeStartNode(node);
          break;
        case "mapping":
          output = await this.executeMappingNode(node);
          break;
        case "rfc-call":
          output = await this.executeRFCCallNode(node, rfcExecutor);
          break;
        case "end":
          output = await this.executeEndNode(node);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // 记录执行结果
      const duration = Date.now() - startTime;
      this.executionLog.push({
        nodeId: node.id,
        nodeName: (node.data as any)?.label || node.type || "Unnamed",
        status: "success",
        input,
        output,
        duration,
      });

      // 保存结果到上下文
      this.context.results.set(node.id, output);
      this.context.currentData = output;

      // 如果是 End 节点，返回最终结果
      if (node.type === "end") {
        return output;
      }

      // 查找下一个节点
      const nextNode = this.findNextNode(node.id);
      if (!nextNode) {
        throw new Error(`No next node found after ${node.id}`);
      }

      // 递归执行下一个节点
      return this.executeNode(nextNode, rfcExecutor);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.executionLog.push({
        nodeId: node.id,
        nodeName: (node.data as any)?.label || node.type || "Unnamed",
        status: "error",
        input,
        output: null,
        duration,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 执行 Start 节点
   */
  private async executeStartNode(node: Node): Promise<any> {
    // Start 节点只是传递输入数据
    return this.context.currentData;
  }

  /**
   * 执行 Mapping 节点
   */
  private async executeMappingNode(node: Node): Promise<any> {
    const data = node.data as any;
    const mappingRules: MappingRule[] = data.mappingRules || [];

    if (mappingRules.length === 0) {
      // 没有映射规则，直接返回输入
      return this.context.currentData;
    }

    // 应用映射规则
    const mapped = applyMapping(this.context.currentData, mappingRules);
    return mapped;
  }

  /**
   * 执行 RFC Call 节点
   */
  private async executeRFCCallNode(
    node: Node,
    rfcExecutor: (connectionId: string, rfmName: string, params: any) => Promise<any>
  ): Promise<any> {
    const data = node.data as any;
    const { connectionId, rfmName } = data;

    if (!connectionId || !rfmName) {
      throw new Error("RFC Call node missing connectionId or rfmName");
    }

    // 调用 RFC
    const result = await rfcExecutor(
      connectionId as string,
      rfmName as string,
      this.context.currentData
    );

    return result;
  }

  /**
   * 执行 End 节点
   */
  private async executeEndNode(node: Node): Promise<any> {
    // End 节点返回当前数据
    return this.context.currentData;
  }

  /**
   * 查找下一个节点
   */
  private findNextNode(currentNodeId: string): Node | null {
    // 查找从当前节点出发的边
    const edge = this.workflow.edges.find((e) => e.source === currentNodeId);
    if (!edge) return null;

    // 查找目标节点
    return this.workflow.nodes.find((n) => n.id === edge.target) || null;
  }
}

/**
 * 便捷函数：执行工作流
 * 
 * @param workflow - 工作流定义
 * @param input - 输入数据
 * @param rfcExecutor - RFC 执行器
 * @returns 执行结果
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: any,
  rfcExecutor: (connectionId: string, rfmName: string, params: any) => Promise<any>
) {
  const executor = new WorkflowExecutor(workflow);
  return executor.execute(input, rfcExecutor);
}

/**
 * 验证工作流定义
 * 
 * @param workflow - 工作流定义
 * @returns 验证结果和错误信息
 */
export function validateWorkflow(workflow: WorkflowDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查是否有节点
  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push("Workflow must have at least one node");
    return { valid: false, errors };
  }

  // 检查是否有 Start 节点
  const startNodes = workflow.nodes.filter((n) => n.type === "start");
  if (startNodes.length === 0) {
    errors.push("Workflow must have a Start node");
  } else if (startNodes.length > 1) {
    errors.push("Workflow must have exactly one Start node");
  }

  // 检查是否有 End 节点
  const endNodes = workflow.nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    errors.push("Workflow must have an End node");
  } else if (endNodes.length > 1) {
    errors.push("Workflow must have exactly one End node");
  }

  // 检查所有节点是否连接（除了 End 节点）
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  const sourceNodeIds = new Set(workflow.edges.map((e) => e.source));
  const targetNodeIds = new Set(workflow.edges.map((e) => e.target));

  for (const node of workflow.nodes) {
    if (node.type === "start") {
      // Start 节点必须有输出
      if (!sourceNodeIds.has(node.id)) {
        errors.push(`Start node (${node.id}) has no outgoing connection`);
      }
    } else if (node.type === "end") {
      // End 节点必须有输入
      if (!targetNodeIds.has(node.id)) {
        errors.push(`End node (${node.id}) has no incoming connection`);
      }
    } else {
      // 中间节点必须有输入和输出
      if (!sourceNodeIds.has(node.id)) {
        errors.push(`Node (${node.id}) has no outgoing connection`);
      }
      if (!targetNodeIds.has(node.id)) {
        errors.push(`Node (${node.id}) has no incoming connection`);
      }
    }
  }

  // 检查是否有循环
  if (hasCycle(workflow)) {
    errors.push("Workflow contains cycles");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查工作流是否包含循环
 */
function hasCycle(workflow: WorkflowDefinition): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    // 查找所有出边
    const outEdges = workflow.edges.filter((e) => e.source === nodeId);
    for (const edge of outEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) return true;
      } else if (recursionStack.has(edge.target)) {
        return true; // 发现循环
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // 从所有节点开始 DFS
  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}
