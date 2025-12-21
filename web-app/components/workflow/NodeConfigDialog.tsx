"use client";

import { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Download, RefreshCw } from "lucide-react";
import { VisualMappingEditor } from "./VisualMappingEditor";

interface NodeConfigDialogProps {
  node: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (nodeId: string, data: any) => void;
  connections?: Array<{ id: string; name: string }>;
}

/**
 * 节点配置对话框
 * 
 * 根据不同节点类型显示相应的配置表单
 */
export default function NodeConfigDialog({
  node,
  open,
  onOpenChange,
  onSave,
  connections = [],
}: NodeConfigDialogProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (node) {
      setFormData({ ...node.data });
    }
  }, [node]);

  const handleSave = () => {
    if (node) {
      onSave(node.id, formData);
      onOpenChange(false);
    }
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置 {node.type} 节点</DialogTitle>
          <DialogDescription>
            设置节点的属性和参数
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {node.type === "start" && <StartNodeConfig formData={formData} setFormData={setFormData} />}
          {node.type === "mapping" && <MappingNodeConfig formData={formData} setFormData={setFormData} />}
          {node.type === "rfc-call" && <RFCCallNodeConfig formData={formData} setFormData={setFormData} connections={connections} />}
          {node.type === "end" && <EndNodeConfig formData={formData} setFormData={setFormData} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Start Node 配置
function StartNodeConfig({ formData, setFormData }: any) {
  return (
    <>
      <div className="space-y-2">
        <Label>API 路径</Label>
        <Input
          placeholder="/api/my-endpoint"
          value={formData.apiPath || ""}
          onChange={(e) => setFormData({ ...formData, apiPath: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>HTTP 方法</Label>
        <Select
          value={formData.method || "POST"}
          onValueChange={(value) => setFormData({ ...formData, method: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>输入 Schema (JSON)</Label>
        <Textarea
          placeholder='{"customerNumber": "string", "date": "string"}'
          value={formData.inputSchema ? JSON.stringify(formData.inputSchema, null, 2) : ""}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setFormData({ ...formData, inputSchema: parsed });
            } catch {
              // 输入时允许非法 JSON
            }
          }}
          className="font-mono text-xs"
          rows={6}
        />
      </div>
    </>
  );
}

// Mapping Node 配置
function MappingNodeConfig({ formData, setFormData }: any) {
  const [mappingRules, setMappingRules] = useState<Array<{ source: string; target: string; transform?: string }>>(
    formData.mappingRules || [{ source: "", target: "", transform: "" }]
  );
  const [sourceSchema, setSourceSchema] = useState(formData.sourceSchema || "{}");
  const [targetSchema, setTargetSchema] = useState(formData.targetSchema || "{}");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'visual'>('text');

  useEffect(() => {
    setFormData((prev: any) => ({ 
      ...prev, 
      mappingRules,
      sourceSchema,
      targetSchema
    }));
  }, [mappingRules, sourceSchema, targetSchema, setFormData]);

  const addRule = () => {
    setMappingRules([...mappingRules, { source: "", target: "", transform: "" }]);
  };

  const removeRule = (index: number) => {
    setMappingRules(mappingRules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: string) => {
    const newRules = [...mappingRules];
    (newRules[index] as any)[field] = value;
    setMappingRules(newRules);
  };

  const handleGenerateMapping = async () => {
    if (!sourceSchema || !targetSchema) {
      alert("Please provide both source and target JSON schemas");
      return;
    }

    // Validate JSON
    try {
      JSON.parse(sourceSchema);
      JSON.parse(targetSchema);
    } catch (e) {
      alert("Invalid JSON format in source or target schema");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSchema,
          targetSchema,
          direction: formData.direction || "input",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMappingRules(data.mappingRules.map((rule: any) => ({
          source: rule.source || "",
          target: rule.target || "",
          transform: rule.transform || ""
        })));
        if (data.explanation) {
          alert(`✅ Mapping generated!\n\n${data.explanation}`);
        }
      } else {
        alert("Failed to generate mapping: " + data.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Direction</Label>
        <Select
          value={formData.direction || "input"}
          onValueChange={(value) => setFormData({ ...formData, direction: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="input">Input Mapping (API → RFC)</SelectItem>
            <SelectItem value="output">Output Mapping (RFC → API)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mapping Label</Label>
        <Input
          placeholder="e.g.: Customer Data Transform"
          value={formData.label || ""}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Source JSON Structure (from previous node)</Label>
          <Textarea
            placeholder='{"customerNumber": "123", "name": "John"}'
            value={sourceSchema}
            onChange={(e) => setSourceSchema(e.target.value)}
            className="font-mono text-xs h-32"
          />
        </div>

        <div className="space-y-2">
          <Label>Target JSON Structure (to next node)</Label>
          <Textarea
            placeholder='{"KUNNR": "", "NAME1": ""}'
            value={targetSchema}
            onChange={(e) => setTargetSchema(e.target.value)}
            className="font-mono text-xs h-32"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mapping Rules</Label>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={viewMode === 'text' ? 'default' : 'outline'}
              onClick={() => setViewMode('text')}
            >
              Text
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'visual' ? 'default' : 'outline'}
              onClick={() => setViewMode('visual')}
            >
              Visual
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleGenerateMapping}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="mr-1">✨</span>
                  Call Gemini
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={addRule}>
              <Plus className="h-3 w-3 mr-1" />
              Add Rule
            </Button>
          </div>
        </div>

        {viewMode === 'text' ? (
          <div className="space-y-2">{mappingRules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Source field (e.g.: input.customerNumber)"
                  value={rule.source || ""}
                  onChange={(e) => updateRule(index, "source", e.target.value)}
                />
                <Input
                  placeholder="Target field (e.g.: KUNNR)"
                  value={rule.target || ""}
                  onChange={(e) => updateRule(index, "target", e.target.value)}
                />
                <Input
                  placeholder="Transform (optional, e.g.: toUpperCase)"
                  value={rule.transform || ""}
                  onChange={(e) => updateRule(index, "transform", e.target.value)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}</div>
        ) : (
          <VisualMappingEditor 
            sourceSchema={sourceSchema}
            targetSchema={targetSchema}
            mappingRules={mappingRules}
            onMappingChange={setMappingRules}
          />
        )}
      </div>
    </>
  );
}

// RFC Call Node 配置
function RFCCallNodeConfig({ formData, setFormData, connections }: any) {
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // 获取 RFC 函数的元数据
  const handleGetRFCMetadata = async () => {
    if (!formData.connectionId || !formData.rfmName) {
      alert("Please select SAP connection and RFC function name first");
      return;
    }

    setIsLoadingMetadata(true);
    try {
      const response = await fetch("/api/rfc-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: formData.connectionId,
          rfmName: formData.rfmName,
        }),
      });

      const data = await response.json();
      
      console.log('RFC Metadata Response:', data); // Debug log
      
      if (data.success && data.metadata) {
        // 使用 API 返回的 inputTemplate
        const inputTemplate = data.inputTemplate || {};
        
        setFormData({ 
          ...formData, 
          inputParams: inputTemplate,
          outputParams: data.metadata.parameters || {}
        });
        
        const paramCount = Object.keys(inputTemplate).length;
        const totalParams = Object.keys(data.metadata.parameters || {}).length;
        alert(`Successfully fetched RFC function structure!\n${paramCount} input parameters found (${totalParams} total parameters).`);
      } else {
        // 显示详细错误信息
        let errorMsg = data.error || "Unknown error";
        if (data.suggestion) {
          errorMsg += `\n\n💡 Suggestion: ${data.suggestion}`;
        }
        alert("Failed to fetch metadata:\n" + errorMsg);
      }
    } catch (error: any) {
      alert("Failed to fetch: " + error.message);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label>SAP 连接 *</Label>
        <Select
          value={formData.connectionId || ""}
          onValueChange={(value) => {
            const conn = connections.find((c: any) => c.id === value);
            setFormData({
              ...formData,
              connectionId: value,
              connectionName: conn?.name,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择 SAP 连接" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((conn: any) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>RFC Function Module *</Label>
        <div className="flex gap-2">
          <Input
            placeholder="例如: STFC_CONNECTION"
            value={formData.rfmName || ""}
            onChange={(e) => setFormData({ ...formData, rfmName: e.target.value })}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetRFCMetadata}
            disabled={isLoadingMetadata || !formData.connectionId || !formData.rfmName}
            title="获取 RFC 函数的参数结构"
          >
            {isLoadingMetadata ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          点击 <Download className="h-3 w-3 inline" /> 按钮自动获取函数参数结构
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>输入参数 (JSON)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormData({ ...formData, inputParams: {} })}
            disabled={!formData.inputParams || Object.keys(formData.inputParams).length === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            清空
          </Button>
        </div>
        <Textarea
          placeholder='{"DOC_NUMBER": "0080122100"}'
          value={formData.inputParams ? JSON.stringify(formData.inputParams, null, 2) : ""}
          onChange={(e) => {
            try {
              const parsed = e.target.value.trim() === "" ? {} : JSON.parse(e.target.value);
              setFormData({ ...formData, inputParams: parsed });
            } catch {
              // 允许输入过程中的非法 JSON
            }
          }}
          className="font-mono text-xs"
          rows={8}
        />
        <p className="text-xs text-muted-foreground">
          💡 支持手动编辑或通过上方按钮自动获取结构
        </p>
      </div>

      <div className="space-y-2">
        <Label>描述</Label>
        <Input
          placeholder="Call SAP RFC Function"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
    </>
  );
}

// End Node 配置
function EndNodeConfig({ formData, setFormData }: any) {
  return (
    <>
      <div className="space-y-2">
        <Label>HTTP 状态码</Label>
        <Select
          value={String(formData.statusCode || 200)}
          onValueChange={(value) => setFormData({ ...formData, statusCode: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">200 OK</SelectItem>
            <SelectItem value="201">201 Created</SelectItem>
            <SelectItem value="204">204 No Content</SelectItem>
            <SelectItem value="400">400 Bad Request</SelectItem>
            <SelectItem value="404">404 Not Found</SelectItem>
            <SelectItem value="500">500 Internal Server Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>响应 Schema (JSON)</Label>
        <Textarea
          placeholder='{"success": true, "data": {}}'
          value={formData.responseSchema ? JSON.stringify(formData.responseSchema, null, 2) : ""}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setFormData({ ...formData, responseSchema: parsed });
            } catch {
              // 允许非法 JSON
            }
          }}
          className="font-mono text-xs"
          rows={6}
        />
      </div>
    </>
  );
}
