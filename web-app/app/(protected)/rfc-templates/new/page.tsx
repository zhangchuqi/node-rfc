'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JSONMapper from '@/components/JSONMapper';
import JSONMapperVisual from '@/components/JSONMapperVisual';
import { RefreshCw, Search, Play, FileJson } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  isActive: boolean;
}

interface RFCMetadata {
  inputSchema: any;
  outputSchema: any;
  description: string;
}

interface MappingRule {
  id: string;
  source: string;
  target: string;
  type: 'field' | 'constant' | 'expression';
  value?: string;
}

export default function NewRFCTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [metadata, setMetadata] = useState<RFCMetadata | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [inputMappings, setInputMappings] = useState<MappingRule[]>([]);
  const [outputMappings, setOutputMappings] = useState<MappingRule[]>([]);
  const [apiInputExample, setApiInputExample] = useState('{"customerId": "100001"}');
  const [apiOutputExample, setApiOutputExample] = useState('{}');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    connectionId: '',
    rfmName: '',
    parameters: '{}',
    apiPath: '',
    apiKey: '',
    isActive: true,
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data.filter((c: Connection) => c.isActive));
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const generateApiKey = () => {
    const key = 'rfc_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData({ ...formData, apiKey: key });
  };

  const fetchMetadata = async () => {
    if (!formData.connectionId || !formData.rfmName) {
      alert('Please select a connection and enter RFC function name first');
      return;
    }

    setLoadingMetadata(true);
    setMetadata(null);

    try {
      const res = await fetch('/api/rfc-templates/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: formData.connectionId,
          rfmName: formData.rfmName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMetadata(data.data);
        if (data.data.description && !formData.description) {
          setFormData({ ...formData, description: data.data.description });
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error fetching metadata: ' + error.message);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const testRFC = async () => {
    if (!formData.connectionId || !formData.rfmName) {
      alert('Please select a connection and enter RFC function name first');
      return;
    }

    // Validate JSON parameters
    let params;
    try {
      params = JSON.parse(formData.parameters);
    } catch (error) {
      alert('Invalid JSON format in parameters');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/rfc-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: formData.connectionId,
          rfmName: formData.rfmName,
          parameters: params,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(data.data);
      } else {
        alert('Test failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Error testing RFC: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate JSON parameters
    try {
      JSON.parse(formData.parameters);
    } catch (error) {
      alert('Invalid JSON format in parameters');
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      connectionId: formData.connectionId,
      rfmName: formData.rfmName.toUpperCase(),
      parameters: JSON.parse(formData.parameters),
      inputSchema: metadata?.inputSchema || null,
      outputSchema: metadata?.outputSchema || null,
      inputMapping: inputMappings.length > 0 ? inputMappings : null,
      outputMapping: outputMappings.length > 0 ? outputMappings : null,
      apiPath: formData.apiPath,
      apiKey: formData.apiKey,
      isActive: formData.isActive,
    };

    try {
      const res = await fetch('/api/rfc-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // 创建成功后，直接跳转到工作流编辑器
        const templateId = data.data.id;
        router.push(`/rfc-templates/${templateId}/workflow`);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error creating template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">New RFC Template</h1>
        <p className="text-muted-foreground mb-8">Create a predefined RFC call configuration</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：表单配置 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Configuration</CardTitle>
                  <CardDescription>Configure the RFC template details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Get Customer Details"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of what this template does"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionId">SAP Connection *</Label>
                  <Select
                    value={formData.connectionId}
                    onValueChange={(value) => setFormData({ ...formData, connectionId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection" />
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

                <div className="space-y-2">
                  <Label htmlFor="rfmName">RFC Function Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rfmName"
                      value={formData.rfmName}
                      onChange={(e) => setFormData({ ...formData, rfmName: e.target.value.toUpperCase() })}
                      placeholder="e.g., BAPI_CUSTOMER_GETDETAIL"
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={fetchMetadata}
                      disabled={loadingMetadata || !formData.connectionId || !formData.rfmName}
                    >
                      {loadingMetadata ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the search icon to fetch parameter structure from SAP
                  </p>
                </div>
              </div>

              {metadata && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      RFC Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Input Parameters</Label>
                      <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(metadata.inputSchema, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <Label className="text-xs">Output Parameters</Label>
                      <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(metadata.outputSchema, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="parameters">Default Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={formData.parameters}
                  onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                  placeholder='{"CUSTOMERNO": "0000100001"}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Default parameters for this RFC. Can be overridden when calling the API.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={testRFC}
                    disabled={testing || !formData.connectionId || !formData.rfmName}
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-3 w-3" />
                        Test Execute
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {testResult && (
                <Card className="bg-muted/50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-green-600" />
                        Test Result
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {testResult.duration}ms
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-xs">Response</Label>
                      <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto max-h-60">
                        {JSON.stringify(testResult.result, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="apiInputExample">API Input Example (JSON)</Label>
                <Textarea
                  id="apiInputExample"
                  value={apiInputExample}
                  onChange={(e) => setApiInputExample(e.target.value)}
                  placeholder='{"customerId": "100001"}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Define what format external systems will send to your API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiOutputExample">API Output Example (JSON)</Label>
                <Textarea
                  id="apiOutputExample"
                  value={apiOutputExample}
                  onChange={(e) => setApiOutputExample(e.target.value)}
                  placeholder='{"customer": {"name": "...", "phone": "..."}}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Define what format to return to external systems
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiPath">API Path *</Label>
                <Input
                  id="apiPath"
                  value={formData.apiPath}
                  onChange={(e) => setFormData({ ...formData, apiPath: e.target.value })}
                  placeholder="/customer/details"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Public API path: <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    /api/public{formData.apiPath || '/your-path'}
                  </code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Generate or enter API key"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateApiKey}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This key must be provided in the X-API-Key header for all API calls.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (template is available for use)
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
            <Link href="/rfc-templates">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </div>

        {/* 右侧：JSON Mapping */}
        <div className="space-y-6">
          {metadata && (
            <Card>
              <CardHeader>
                <CardTitle>JSON Field Mapping (Optional)</CardTitle>
                <CardDescription>
                  Define how external API fields map to RFC parameters. Leave empty to use direct passthrough.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="input" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="input">Input Mapping</TabsTrigger>
                    <TabsTrigger value="output">Output Mapping</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="input" className="space-y-4">
                    <JSONMapperVisual
                      direction="input"
                      sourceLabel="API"
                      targetLabel="RFC"
                      sourceSchema={JSON.parse(apiInputExample || '{}')}
                      targetSchema={metadata.inputSchema}
                      mappings={inputMappings}
                      onChange={setInputMappings}
                    />
                  </TabsContent>
                  
                  <TabsContent value="output" className="space-y-4">
                    <JSONMapperVisual
                      direction="output"
                      sourceLabel="RFC"
                      targetLabel="API"
                      sourceSchema={testResult?.result || metadata.outputSchema}
                      targetSchema={JSON.parse(apiOutputExample || '{}')}
                      mappings={outputMappings}
                      onChange={setOutputMappings}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        </form>
      </div>
    </div>
  );
}
