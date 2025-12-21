"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Play,
  Download,
  Upload,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Copy,
  Info,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import WorkflowCanvas, {
  type WorkflowDefinition,
} from "@/components/workflow/WorkflowCanvas";
import NodeConfigDialog from "@/components/workflow/NodeConfigDialog";
import WorkflowTemplateDialog from "@/components/workflow/WorkflowTemplateDialog";
import WorkflowTestDialog from "@/components/workflow/WorkflowTestDialog";
import type { Node } from "@xyflow/react";
import { WorkflowTemplateInfo } from "@/lib/workflow-templates";

/**
 * 工作流优先的模板创建页面
 * 
 * 直接进入可视化工作流编辑器，通过拖拽节点设计流程
 */
export default function CreateTemplatePage() {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    nodes: [],
    edges: [],
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'draft' | 'publish'>('draft');
  
  // 节点配置
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [connections, setConnections] = useState<Array<{ id: string; name: string }>>([]);
  
  // 模板基本信息
  const [templateInfo, setTemplateInfo] = useState({
    name: "",
    description: "",
    apiPath: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [showApiInfo, setShowApiInfo] = useState(false);

  // 首次加载时显示模板选择对话框
  useEffect(() => {
    // 只在初始化且没有节点时显示
    if (workflow.nodes.length === 0) {
      setShowTemplateDialog(true);
    }
  }, []);

  // 加载 SAP 连接列表
  useEffect(() => {
    fetch("/api/sap-connections")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setConnections(data.data.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch((err) => console.error("Failed to load connections:", err));
  }, []);

  // 添加节点
  const handleAddNode = (type: string) => {
    // 智能定位：根据现有节点数量计算位置
    const existingCount = workflow.nodes.length;
    const x = 100 + (existingCount % 3) * 350;
    const y = 100 + Math.floor(existingCount / 3) * 200;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x, y },
      data: {
        label: type === "mapping" ? "Data Mapping" : undefined,
        direction: type === "mapping" ? "input" : undefined,
      },
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  // 开始拖拽节点
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 生成 API Key
  const generateApiKey = () => {
    const newKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
  };

  // 获取 API 路径
  const getApiPath = (): string => {
    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (startNode?.data?.apiPath) {
      return String(startNode.data.apiPath);
    }
    return templateInfo.apiPath || '/api/rfc/workflow';
  };

  // 获取完整 API URL
  const getFullApiUrl = (): string => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${getApiPath()}`;
    }
    return getApiPath();
  };

  // 从模板加载
  const handleTemplateSelect = (template: WorkflowTemplateInfo) => {
    setWorkflow(template.workflow);
    // 如果模板有建议的 API 路径，自动填充
    const startNode = template.workflow.nodes.find((n: Node) => n.type === "start");
    if (startNode && startNode.data.apiPath) {
      setTemplateInfo((prev) => ({
        ...prev,
        apiPath: String(startNode.data.apiPath || ""),
        name: template.name,
        description: template.description,
      }));
    }
  };


  // 节点双击打开配置
  const handleNodeDoubleClick = (node: Node) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  };

  // 保存节点配置
  const handleSaveNodeConfig = (nodeId: string, data: any) => {
    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  };

  // 清空工作流
  const handleClear = () => {
    if (confirm("Are you sure you want to clear the workflow?")) {
      setWorkflow({ nodes: [], edges: [] });
    }
  };

  // 保存草稿 - drafts can be incomplete
  const handleSaveDraft = () => {
    setSaveMode('draft');
    setShowSaveDialog(true);
  };

  // 发布模板
  const handlePublish = () => {
    // 验证工作流
    if (workflow.nodes.length === 0) {
      alert("Please add nodes to design the workflow first");
      return;
    }

    const startNode = workflow.nodes.find((n) => n.type === "start");
    const endNode = workflow.nodes.find((n) => n.type === "end");

    if (!startNode || !endNode) {
      alert("Workflow must contain Start and End nodes");
      return;
    }

    setSaveMode('publish');
    setShowSaveDialog(true);
  };

  // 提交保存
  const handleSubmitSave = async () => {
    if (!templateInfo.name) {
      alert("Please fill in template name");
      return;
    }

    setIsSaving(true);

    try {
      // 从工作流中提取信息
      const rfcNode = workflow.nodes.find((n) => n.type === "rfc-call");
      const startNode = workflow.nodes.find((n) => n.type === "start");

      // Only validate for publish mode, not for draft
      if (saveMode === 'publish') {
        if (!rfcNode) {
          alert("Workflow must contain an RFC Call node");
          setIsSaving(false);
          return;
        }

        const rfcData = rfcNode.data as any;
        if (!rfcData.connectionId || !rfcData.rfmName) {
          alert("Please configure connection and function name in RFC Call node");
          setIsSaving(false);
          return;
        }
      }

      // For draft mode, use existing RFC data if available
      const rfcData = rfcNode?.data as any;

      // 生成 API Key
      const apiKey = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const payload = {
        name: templateInfo.name,
        description: templateInfo.description || null,
        connectionId: rfcData?.connectionId || null,
        rfmName: rfcData?.rfmName || null,
        parameters: rfcData?.inputParams || {},
        workflowDefinition: workflow,
        apiPath: templateInfo.apiPath || `/rfc/${templateInfo.name.toLowerCase().replace(/\s+/g, "-")}`,
        apiKey,
        status: saveMode === 'publish' ? 'PUBLISHED' : 'DRAFT',
        isActive: saveMode === 'publish',
      };

      const response = await fetch("/api/rfc-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const mode = saveMode === 'draft' ? 'Draft' : 'Template';
        alert(`${mode} created successfully!`);
        router.push("/rfc-templates");
      } else {
        alert("Creation failed: " + data.error);
      }
    } catch (error: any) {
      alert("创建失败: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 导出工作流
  const handleExport = () => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `workflow-draft-${Date.now()}.json`;

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
        alert("导入失败：文件格式不正确");
      }
    };
    input.click();
  };

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
              <h1 className="text-2xl font-bold">Create RFC Template</h1>
              <p className="text-sm text-muted-foreground">
                Design RFC call workflow with visual editor
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {workflow.nodes.length} nodes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={showApiInfo ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowApiInfo(!showApiInfo)}
            >
              <Info className="h-4 w-4 mr-2" />
              API Info
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTestDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Use Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish}>
              <Upload className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette Sidebar */}
        <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Node Palette</h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <div
                draggable
                onDragStart={(e) => onDragStart(e, "start")}
                className="cursor-grab active:cursor-grabbing"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 hover:bg-green-50 hover:border-green-300"
                  onClick={() => handleAddNode("start")}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Start</div>
                      <div className="text-xs text-muted-foreground">API Entry</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div
                draggable
                onDragStart={(e) => onDragStart(e, "mapping")}
                className="cursor-grab active:cursor-grabbing"
              >
                <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handleAddNode("mapping")}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">Mapping</div>
                    <div className="text-xs text-muted-foreground">Data Transform</div>
                  </div>
                </div>
              </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div
                draggable
                onDragStart={(e) => onDragStart(e, "rfc-call")}
                className="cursor-grab active:cursor-grabbing"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => handleAddNode("rfc-call")}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">RFC Call</div>
                      <div className="text-xs text-muted-foreground">Call SAP</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div
                draggable
                onDragStart={(e) => onDragStart(e, "end")}
                className="cursor-grab active:cursor-grabbing"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleAddNode("end")}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">End</div>
                      <div className="text-xs text-muted-foreground">API Response</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
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

          {/* Tips */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-3">💡 Quick Actions</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Add Node</span>
                <span>Click or drag to canvas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Move Node</span>
                <span>Drag with mouse</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Connect</span>
                <span>Drag from right edge</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Configure</span>
                <span>Double-click node</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Delete Edge</span>
                <span>Right-click connection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Delete Node</span>
                <span>Select & press Delete</span>
              </div>
            </div>
          </div>

          {/* Workflow Info */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-2">Workflow Info</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Nodes: {workflow.nodes.length}</div>
              <div>Connections: {workflow.edges.length}</div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1">
          {workflow.nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
              <div className="text-center max-w-lg p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Create Your First Workflow
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Visual workflow design makes RFC calls easier. Select a node type from the left,<br />
                  or quick start with a standard workflow.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button size="lg" onClick={() => {
                    handleAddNode("start");
                    setTimeout(() => handleAddNode("rfc-call"), 100);
                    setTimeout(() => handleAddNode("end"), 200);
                  }}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Standard Workflow
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleImport}>
                    <Upload className="h-5 w-5 mr-2" />
                    Import Existing Template
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
                  💡 Standard workflow includes: Start → RFC Call → End (3 basic nodes)
                </div>
              </div>
            </div>
          ) : (
            <WorkflowCanvas
              initialWorkflow={workflow}
              onWorkflowChange={setWorkflow}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
          )}
        </div>

        {/* API Info Sidebar */}
        {showApiInfo && (
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">API Information</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowApiInfo(false)}>
                ✕
              </Button>
            </div>

            {/* API Endpoint */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">API Endpoint</Label>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border rounded px-3 py-2 font-mono break-all">
                    {getApiPath()}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(getFullApiUrl());
                      alert('Copied to clipboard!');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Full URL: {getFullApiUrl()}
                </p>
              </div>

              {/* API Key */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">API Key</Label>
                <div className="mt-2 space-y-2">
                  {!apiKey ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={generateApiKey}
                    >
                      <Key className="h-3 w-3 mr-2" />
                      Generate API Key
                    </Button>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background border rounded px-3 py-2 font-mono break-all">
                          {apiKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey);
                            alert('API Key copied!');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={generateApiKey}
                      >
                        Regenerate Key
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Include this key in your request headers
                </p>
              </div>

              {/* Request Example */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Request Example (cURL)</Label>
                <div className="mt-2 relative">
                  <pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
{`curl -X POST ${getFullApiUrl()} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -d '{
    "param1": "value1",
    "param2": "value2"
  }'`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const example = `curl -X POST ${getFullApiUrl()} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'your-api-key'}" \\
  -d '{
    "param1": "value1",
    "param2": "value2"
  }'`;
                      navigator.clipboard.writeText(example);
                      alert('Example copied!');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* JavaScript Example */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Request Example (JavaScript)</Label>
                <div className="mt-2 relative">
                  <pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
{`fetch('${getFullApiUrl()}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${apiKey || 'your-api-key'}'
  },
  body: JSON.stringify({
    param1: 'value1',
    param2: 'value2'
  })
}).then(res => res.json())
  .then(data => console.log(data));`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const example = `fetch('${getFullApiUrl()}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${apiKey || 'your-api-key'}'
  },
  body: JSON.stringify({
    param1: 'value1',
    param2: 'value2'
  })
}).then(res => res.json())
  .then(data => console.log(data));`;
                      navigator.clipboard.writeText(example);
                      alert('Example copied!');
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 space-y-1">
                    <p className="font-semibold">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Save your API key securely</li>
                      <li>Configure the Start node's API path</li>
                      <li>Test the workflow before deployment</li>
                      <li>Keys are generated per template</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node Config Dialog */}
      <NodeConfigDialog
        node={selectedNode}
        open={showNodeConfig}
        onOpenChange={setShowNodeConfig}
        onSave={handleSaveNodeConfig}
        connections={connections}
      />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {saveMode === 'draft' ? 'Save as Draft' : 'Publish Template'}
            </DialogTitle>
            <DialogDescription>
              {saveMode === 'draft' 
                ? 'Save your work as a draft. You can publish it later.'
                : 'Publish this template to make it available for API calls.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g.: Customer Info Query"
                value={templateInfo.name}
                onChange={(e) =>
                  setTemplateInfo({ ...templateInfo, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this template"
                value={templateInfo.description}
                onChange={(e) =>
                  setTemplateInfo({
                    ...templateInfo,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiPath">API Path</Label>
              <Input
                id="apiPath"
                placeholder="Leave blank for auto-generation"
                value={templateInfo.apiPath}
                onChange={(e) =>
                  setTemplateInfo({ ...templateInfo, apiPath: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                e.g.: /rfc/get-customer (leave blank to auto-generate from name)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitSave} disabled={isSaving}>
              {isSaving 
                ? (saveMode === 'draft' ? 'Saving...' : 'Publishing...') 
                : (saveMode === 'draft' ? 'Save Draft' : 'Publish Template')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 模板选择对话框 */}
      <WorkflowTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelect={handleTemplateSelect}
      />

      {/* 测试工作流对话框 */}
      <WorkflowTestDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        nodes={workflow.nodes}
        edges={workflow.edges}
      />
    </div>
  );
}
