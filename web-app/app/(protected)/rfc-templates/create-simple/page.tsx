'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, Copy, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Connection {
  id: string;
  name: string;
}

interface MappingRule {
  rfcParam: string;
  apiPath: string;
  description?: string;
}

export default function CreateSimpleTemplatePage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 基本信息
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [rfmName, setRfmName] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [apiKey, setApiKey] = useState('');

  // 映射规则
  const [inputMappings, setInputMappings] = useState<MappingRule[]>([
    { rfcParam: '', apiPath: '', description: '' }
  ]);

  // 输出映射（可选）
  const [useOutputMapping, setUseOutputMapping] = useState(false);
  const [outputMappings, setOutputMappings] = useState<MappingRule[]>([]);

  useEffect(() => {
    loadConnections();
    // 生成默认 API Key
    setApiKey(generateApiKey());
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/sap-connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const generateApiKey = () => {
    return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const addInputMapping = () => {
    setInputMappings([...inputMappings, { rfcParam: '', apiPath: '', description: '' }]);
  };

  const removeInputMapping = (index: number) => {
    setInputMappings(inputMappings.filter((_, i) => i !== index));
  };

  const updateInputMapping = (index: number, field: keyof MappingRule, value: string) => {
    const updated = [...inputMappings];
    updated[index][field] = value;
    setInputMappings(updated);
  };

  const addOutputMapping = () => {
    setOutputMappings([...outputMappings, { rfcParam: '', apiPath: '', description: '' }]);
  };

  const removeOutputMapping = (index: number) => {
    setOutputMappings(outputMappings.filter((_, i) => i !== index));
  };

  const updateOutputMapping = (index: number, field: keyof MappingRule, value: string) => {
    const updated = [...outputMappings];
    updated[index][field] = value;
    setOutputMappings(updated);
  };

  const handleSave = async () => {
    // 验证
    if (!name || !connectionId || !rfmName || !apiPath) {
      alert('请填写所有必填字段');
      return;
    }

    const validInputMappings = inputMappings.filter(m => m.rfcParam && m.apiPath);
    if (validInputMappings.length === 0) {
      alert('请至少添加一条输入映射规则');
      return;
    }

    // 构建映射对象
    const inputMapping: Record<string, string> = {};
    validInputMappings.forEach(m => {
      inputMapping[m.rfcParam] = m.apiPath;
    });

    const outputMapping: Record<string, string> = {};
    if (useOutputMapping) {
      const validOutputMappings = outputMappings.filter(m => m.rfcParam && m.apiPath);
      validOutputMappings.forEach(m => {
        outputMapping[m.rfcParam] = m.apiPath;
      });
    }

    setLoading(true);
    try {
      const res = await fetch('/api/rfc-templates/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          connectionId,
          rfmName,
          apiPath,
          apiKey,
          inputMapping,
          outputMapping: useOutputMapping ? outputMapping : null
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('接口创建成功！');
        router.push('/rfc-templates');
      } else {
        alert('创建失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-4xl font-bold mb-2">创建 REST API 接口</h1>
          <p className="text-muted-foreground">
            定义一个 REST API 接口，自动映射到 SAP RFC 调用
          </p>
        </div>

        {/* 基本信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>接口的基本配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">接口名称 *</Label>
              <Input
                id="name"
                placeholder="例如: 获取客户信息"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">接口描述</Label>
              <Textarea
                id="description"
                placeholder="描述这个接口的用途"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="apiPath">API 路径 *</Label>
              <div className="flex gap-2">
                <Input
                  id="apiPath"
                  placeholder="/api/external/get-customer"
                  value={apiPath}
                  onChange={(e) => setApiPath(e.target.value)}
                />
                <Badge variant="outline" className="shrink-0">POST</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                外部系统将通过 POST 请求访问这个路径
              </p>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key *</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setApiKey(generateApiKey())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                外部系统需要在请求头中携带此 Key: <code>Authorization: Bearer {'{'}API_KEY{'}'}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SAP RFC 配置 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SAP RFC 配置</CardTitle>
            <CardDescription>指定要调用的 SAP 函数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="connection">SAP 连接 *</Label>
              <Select value={connectionId} onValueChange={setConnectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择 SAP 连接" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rfmName">RFC 函数名 *</Label>
              <Input
                id="rfmName"
                placeholder="例如: BAPI_CUSTOMER_GETDETAIL"
                value={rfmName}
                onChange={(e) => setRfmName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 输入映射 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>输入映射规则</CardTitle>
            <CardDescription>
              定义如何将 REST API 的 JSON 输入映射到 RFC 参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50 mb-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="text-sm">
                  <p className="font-medium mb-1">JSONPath 语法说明：</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code>$.customer.id</code> - 获取嵌套字段</li>
                    <li><code>$.items[0].name</code> - 获取数组元素</li>
                    <li><code>$</code> - 整个 JSON 对象</li>
                  </ul>
                </div>
              </div>
            </div>

            {inputMappings.map((mapping, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">映射规则 {index + 1}</Label>
                  {inputMappings.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInputMapping(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">RFC 参数名</Label>
                    <Input
                      placeholder="CUSTOMER_ID"
                      value={mapping.rfcParam}
                      onChange={(e) => updateInputMapping(index, 'rfcParam', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">API JSON 路径</Label>
                    <Input
                      placeholder="$.customerId"
                      value={mapping.apiPath}
                      onChange={(e) => updateInputMapping(index, 'apiPath', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">说明（可选）</Label>
                  <Input
                    placeholder="例如: 客户编号"
                    value={mapping.description || ''}
                    onChange={(e) => updateInputMapping(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addInputMapping}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              添加映射规则
            </Button>
          </CardContent>
        </Card>

        {/* 输出映射（可选） */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>输出映射规则（可选）</CardTitle>
            <CardDescription>
              默认返回 RFC 的完整结果。如果需要自定义输出格式，可以配置映射规则
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useOutputMapping"
                checked={useOutputMapping}
                onChange={(e) => {
                  setUseOutputMapping(e.target.checked);
                  if (e.target.checked && outputMappings.length === 0) {
                    setOutputMappings([{ rfcParam: '', apiPath: '', description: '' }]);
                  }
                }}
                className="rounded"
              />
              <Label htmlFor="useOutputMapping">启用自定义输出映射</Label>
            </div>

            {useOutputMapping && (
              <>
                {outputMappings.map((mapping, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">输出映射 {index + 1}</Label>
                      {outputMappings.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOutputMapping(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">RFC 返回字段</Label>
                        <Input
                          placeholder="CUSTOMER_NAME"
                          value={mapping.rfcParam}
                          onChange={(e) => updateOutputMapping(index, 'rfcParam', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">API 输出路径</Label>
                        <Input
                          placeholder="$.name"
                          value={mapping.apiPath}
                          onChange={(e) => updateOutputMapping(index, 'apiPath', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addOutputMapping}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加输出映射
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? '保存中...' : '保存接口'}
          </Button>
        </div>
      </div>
    </div>
  );
}
