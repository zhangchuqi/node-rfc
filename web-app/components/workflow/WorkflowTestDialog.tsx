"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { validateWorkflowEnhanced, getExecutionPath } from "@/lib/workflow-validation";

interface WorkflowTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
}

type NodeExecutionState = "pending" | "running" | "success" | "error";

interface NodeExecution {
  nodeId: string;
  state: NodeExecutionState;
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

export default function WorkflowTestDialog({
  open,
  onOpenChange,
  nodes,
  edges,
}: WorkflowTestDialogProps) {
  const [testInput, setTestInput] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);
  const [executions, setExecutions] = useState<NodeExecution[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const validation = validateWorkflowEnhanced(nodes, edges);
  const executionPath = getExecutionPath(nodes, edges);

  const handleRunTest = async () => {
    if (!validation.isValid) {
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);

    // 初始化执行状态
    const initialExecutions: NodeExecution[] = executionPath.map((nodeId) => ({
      nodeId,
      state: "pending",
    }));
    setExecutions(initialExecutions);

    // 模拟逐步执行
    try {
      let currentData = JSON.parse(testInput);

      for (let i = 0; i < executionPath.length; i++) {
        const nodeId = executionPath[i];
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        setCurrentStep(i);

        // 标记为运行中
        setExecutions((prev) =>
          prev.map((e) =>
            e.nodeId === nodeId ? { ...e, state: "running", input: currentData } : e
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        // 模拟节点执行
        const result = await simulateNodeExecution(node, currentData);

        if (result.success) {
          setExecutions((prev) =>
            prev.map((e) =>
              e.nodeId === nodeId
                ? {
                    ...e,
                    state: "success",
                    output: result.output,
                    duration: result.duration,
                  }
                : e
            )
          );
          currentData = result.output;
        } else {
          setExecutions((prev) =>
            prev.map((e) =>
              e.nodeId === nodeId
                ? {
                    ...e,
                    state: "error",
                    error: result.error,
                  }
                : e
            )
          );
          break;
        }
      }
    } catch (error: any) {
      console.error("Test execution failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const simulateNodeExecution = async (
    node: Node,
    input: any
  ): Promise<{ success: boolean; output?: any; error?: string; duration: number }> => {
    const startTime = Date.now();

    // 模拟不同节点类型的执行
    switch (node.type) {
      case "start":
        return {
          success: true,
          output: input,
          duration: Date.now() - startTime,
        };

      case "mapping":
        // 模拟数据映射
        const mappedData = { ...input, _mapped: true, direction: node.data.direction };
        return {
          success: true,
          output: mappedData,
          duration: Date.now() - startTime,
        };

      case "rfc-call":
        // Simulate RFC call (not actual call)
        if (!node.data.rfmName) {
          return {
            success: false,
            error: "RFC function name not configured",
            duration: Date.now() - startTime,
          };
        }
        const rfcResult = {
          ...input,
          _rfc_result: {
            function: node.data.rfmName,
            success: true,
            data: { message: "Simulated RFC call successful" },
          },
        };
        return {
          success: true,
          output: rfcResult,
          duration: Date.now() - startTime,
        };

      case "end":
        return {
          success: true,
          output: {
            statusCode: node.data.statusCode || 200,
            body: input,
          },
          duration: Date.now() - startTime,
        };

      default:
        return {
          success: true,
          output: input,
          duration: Date.now() - startTime,
        };
    }
  };

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return nodeId;

    switch (node.type) {
      case "start":
        return `Start (${node.data.apiPath || "Not configured"})`;
      case "mapping":
        return `Mapping (${node.data.label || node.data.direction || "Unnamed"})`;
      case "rfc-call":
        return `RFC (${node.data.rfmName || "Not configured"})`;
      case "end":
        return `End (${node.data.statusCode || 200})`;
      default:
        return nodeId;
    }
  };

  const getStateIcon = (state: NodeExecutionState) => {
    switch (state) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStateBadge = (state: NodeExecutionState) => {
    switch (state) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>;
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Workflow
          </DialogTitle>
          <DialogDescription>
            Simulate workflow execution and view input/output for each node (won't actually call SAP)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 验证结果 */}
          {!validation.isValid && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Workflow Validation Failed</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {validation.errors.map((error, i) => (
                      <li key={i}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800 text-sm">Warnings</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-yellow-700">
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>• {warning.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Test input data */}
          <div className="space-y-2">
            <Label>Test Input (JSON)</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder='{"customerId": "12345", "query": "order"}'
              className="font-mono text-sm"
              rows={3}
              disabled={isRunning}
            />
          </div>

          {/* Execution steps */}
          {executions.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="font-medium mb-2">Execution Steps</h3>
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-3">
                  {executions.map((execution, index) => (
                    <div
                      key={execution.nodeId}
                      className={`border rounded-lg p-3 ${
                        execution.state === "running"
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStateIcon(execution.state)}
                          <span className="font-medium text-sm">
                            {index + 1}. {getNodeName(execution.nodeId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {execution.duration && (
                            <span className="text-xs text-muted-foreground">
                              {execution.duration}ms
                            </span>
                          )}
                          {getStateBadge(execution.state)}
                        </div>
                      </div>

                      {execution.error && (
                        <div className="mt-2 text-sm text-destructive bg-destructive/10 rounded p-2">
                          {execution.error}
                        </div>
                      )}

                      {(execution.input || execution.output) && (
                        <div className="mt-2 space-y-2">
                          {execution.input && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Input Data
                              </summary>
                              <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(execution.input, null, 2)}
                              </pre>
                            </details>
                          )}
                          {execution.output && execution.state === "success" && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Output Data
                              </summary>
                              <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(execution.output, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleRunTest}
            disabled={!validation.isValid || isRunning}
          >
            {isRunning ? (
              <>
                <Play className="h-4 w-4 mr-2 animate-pulse" />
                Running... ({currentStep + 1}/{executionPath.length})
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
