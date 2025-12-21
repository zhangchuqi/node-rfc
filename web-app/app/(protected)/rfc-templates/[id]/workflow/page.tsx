"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Play,
  Download,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import WorkflowCanvas, {
  type WorkflowDefinition,
} from "@/components/workflow/WorkflowCanvas";
import type { Node } from "@xyflow/react";

interface RFCTemplate {
  id: string;
  name: string;
  description?: string;
  workflowDefinition?: WorkflowDefinition;
}

export default function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<RFCTemplate | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    nodes: [],
    edges: [],
  });
  const [templateId, setTemplateId] = useState<string>("");

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setTemplateId(p.id));
  }, [params]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载模板数据
  useEffect(() => {
    if (!templateId) return;
    
    async function loadTemplate() {
      try {
        const response = await fetch(`/api/rfc-templates/${templateId}`);
        if (!response.ok) throw new Error("Failed to load template");

        const data = await response.json();
        setTemplate(data);

        if (data.workflowDefinition) {
          setWorkflow(data.workflowDefinition);
        } else {
          // 如果没有工作流定义，创建默认结构
          setWorkflow(createDefaultWorkflow(data));
        }
      } catch (error) {
        console.error("Error loading template:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  // 创建默认工作流（基于现有模板配置）
  const createDefaultWorkflow = (template: any): WorkflowDefinition => {
    const nodes: Node[] = [
      {
        id: "start",
        type: "start",
        position: { x: 250, y: 50 },
        data: {
          apiPath: template.apiPath || "/api/rfc/custom",
          httpMethod: "POST",
          description: "API Entry Point",
        },
      },
      {
        id: "input-mapping",
        type: "mapping",
        position: { x: 250, y: 200 },
        data: {
          label: "Input Mapping",
          direction: "input",
          mappingRules: template.inputMapping || [],
          description: "Transform API input to RFC format",
        },
      },
      {
        id: "rfc-call",
        type: "rfc-call",
        position: { x: 250, y: 400 },
        data: {
          connectionId: template.connectionId,
          connectionName: template.connection?.name,
          rfmName: template.rfmName,
          description: `Call ${template.rfmName}`,
        },
      },
      {
        id: "output-mapping",
        type: "mapping",
        position: { x: 250, y: 600 },
        data: {
          label: "Output Mapping",
          direction: "output",
          mappingRules: template.outputMapping || [],
          description: "Transform RFC output to API format",
        },
      },
      {
        id: "end",
        type: "end",
        position: { x: 250, y: 800 },
        data: {
          statusCode: 200,
          description: "Return API response",
        },
      },
    ];

    const edges = [
      { id: "e1", source: "start", target: "input-mapping" },
      { id: "e2", source: "input-mapping", target: "rfc-call" },
      { id: "e3", source: "rfc-call", target: "output-mapping" },
      { id: "e4", source: "output-mapping", target: "end" },
    ];

    return { nodes, edges };
  };

  // 保存工作流
  const handleSave = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/rfc-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowDefinition: workflow,
        }),
      });

      if (!response.ok) throw new Error("Failed to save workflow");

      // TODO: Show success toast
      console.log("Workflow saved successfully");
    } catch (error) {
      console.error("Error saving workflow:", error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  // 测试工作流
  const handleTest = () => {
    // TODO: Open test dialog with input form
    console.log("Test workflow", workflow);
  };

  // 导出工作流
  const handleExport = () => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `workflow-${template?.name || "export"}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // 导入工作流
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text) as WorkflowDefinition;
        setWorkflow(imported);
      } catch (error) {
        console.error("Error importing workflow:", error);
        // TODO: Show error toast
      }
    };
    input.click();
  };

  // 添加节点
  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {},
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  // 清空工作流
  const handleClear = () => {
    if (confirm("Are you sure you want to clear the workflow?")) {
      setWorkflow({ nodes: [], edges: [] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/rfc-templates")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{template?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Visual Workflow Editor
              </p>
            </div>
            <Badge variant="secondary">
              {workflow.nodes.length} nodes
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette Sidebar */}
        <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Node Palette</h3>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddNode("start")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Start Node
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddNode("mapping")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Mapping Node
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddNode("rfc-call")}
            >
              <Plus className="h-4 w-4 mr-2" />
              RFC Call Node
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddNode("end")}
            >
              <Plus className="h-4 w-4 mr-2" />
              End Node
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleClear}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Workflow
            </Button>
          </div>

          {/* Workflow Info */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-2">Workflow Info</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Nodes: {workflow.nodes.length}</div>
              <div>Edges: {workflow.edges.length}</div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1">
          <WorkflowCanvas
            initialWorkflow={workflow}
            onWorkflowChange={setWorkflow}
          />
        </div>
      </div>
    </div>
  );
}
