'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicForm } from '@/components/DynamicForm';

interface Connection {
  id: string;
  name: string;
  connectionType: string;
  isActive: boolean;
}

export default function CallPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [rfmName, setRfmName] = useState('STFC_CONNECTION');
  const [parameters, setParameters] = useState('{\n  "REQUTEXT": "Hello SAP"\n}');
  const [formData, setFormData] = useState<any>(null);
  const [fieldMetadata, setFieldMetadata] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        const activeConnections = data.data.filter((c: Connection) => c.isActive);
        setConnections(activeConnections);
        if (activeConnections.length > 0) {
          setSelectedConnection(activeConnections[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleCall = async () => {
    if (!selectedConnection || !rfmName) {
      alert('Please select a connection and enter a function name');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    let parsedParams = {};
    try {
      if (viewMode === 'form' && formData) {
        // Flatten grouped form data for API call
        parsedParams = {
          ...formData.import,
          ...formData.changing,
          ...formData.tables
        };
      } else if (parameters.trim()) {
        parsedParams = JSON.parse(parameters);
      }
    } catch (e) {
      alert('Invalid JSON parameters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/sap/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: selectedConnection,
          rfmName,
          parameters: parsedParams,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
        setResult(data.details || null);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMetadata = async () => {
    if (!selectedConnection || !rfmName) {
      alert('Please select a connection and enter a function name');
      return;
    }

    setLoadingMetadata(true);
    setError('');

    try {
      const res = await fetch('/api/rfc-templates/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: selectedConnection,
          rfmName: rfmName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Check if response has inputTemplate (from RFC Server) or inputSchema (from metadata API)
        let formattedTemplate = '';
        let groupedData: any = {};
        
        if (data.inputTemplate) {
          // RFC Server format - already has inputTemplate
          formattedTemplate = JSON.stringify(data.inputTemplate, null, 2);
          
          // Build grouped data from parameters for form view
          const params = data.metadata?.parameters || {};
          groupedData = {
            IMPORTING: [],
            TABLES: [],
            CHANGING: []
          };
          
          Object.values(params).forEach((param: any) => {
            if (param.direction === 'RFC_IMPORT') {
              groupedData.IMPORTING.push(param);
            } else if (param.direction === 'RFC_TABLES') {
              groupedData.TABLES.push(param);
            } else if (param.direction === 'RFC_CHANGING') {
              groupedData.CHANGING.push(param);
            }
          });
        } else if (data.data?.inputSchema) {
          // Metadata API format
          const metadata = data.data;
          groupedData = {
            IMPORTING: metadata.inputSchema?.IMPORTING || [],
            TABLES: metadata.inputSchema?.TABLES || [],
            CHANGING: metadata.inputSchema?.CHANGING || [],
          };
          
          // Create formatted template from schema
          const template: any = {};
          if (groupedData.IMPORTING?.length > 0) {
            groupedData.IMPORTING.forEach((param: any) => {
              template[param.PARAMETER || param.name] = '';
            });
          }
          if (groupedData.TABLES?.length > 0) {
            groupedData.TABLES.forEach((param: any) => {
              template[param.PARAMETER || param.name] = [];
            });
          }
          if (groupedData.CHANGING?.length > 0) {
            groupedData.CHANGING.forEach((param: any) => {
              template[param.PARAMETER || param.name] = '';
            });
          }
          
          formattedTemplate = JSON.stringify(template, null, 2);
        }
        
        setFormData(groupedData);
        setFieldMetadata({});
        setParameters(formattedTemplate);
        setViewMode('json'); // Switch to JSON view to show the template
        alert('Parameter structure loaded successfully!');
      } else {
        setError(data.error || 'Failed to get function metadata');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleFormDataChange = (newData: any) => {
    setFormData(newData);
    
    // Flatten grouped data for JSON view (only include input parameters)
    const flatData = {
      ...newData.import,
      ...newData.changing,
      ...newData.tables
    };
    setParameters(JSON.stringify(flatData, null, 2));
  };

  const selectedConn = connections.find((c) => c.id === selectedConnection);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Execute RFC Call</h1>
          <p className="text-muted-foreground">Call SAP Remote Function Modules</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Configuration</CardTitle>
                <CardDescription>Configure your RFC function call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connection">Connection</Label>
                  <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                          <Badge className="ml-2" variant="secondary">
                            {conn.connectionType}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfmName">Function Module Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rfmName"
                      placeholder="STFC_CONNECTION"
                      value={rfmName}
                      onChange={(e) => setRfmName(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetMetadata}
                      disabled={loadingMetadata || !selectedConnection || !rfmName}
                      title="Get parameter structure for this function"
                    >
                      {loadingMetadata ? '⏳' : '📋'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click 📋 to automatically load parameter structure
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Parameters</Label>
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'form' | 'json')} className="w-auto">
                      <TabsList className="grid w-[200px] grid-cols-2">
                        <TabsTrigger value="form">Form View</TabsTrigger>
                        <TabsTrigger value="json">JSON View</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {viewMode === 'form' ? (
                    <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto">
                      <DynamicForm 
                        data={formData} 
                        onChange={handleFormDataChange} 
                        grouped={true}
                        metadata={fieldMetadata}
                      />
                    </div>
                  ) : (
                    <Textarea
                      id="parameters"
                      className="font-mono text-sm min-h-[200px]"
                      value={parameters}
                      onChange={(e) => {
                        setParameters(e.target.value);
                        try {
                          const parsed = JSON.parse(e.target.value);
                          // Try to detect if it's grouped or flat
                          if (parsed.import || parsed.export || parsed.changing || parsed.tables) {
                            setFormData(parsed);
                          } else {
                            // Assume it's flat, group it under import
                            setFormData({ import: parsed, export: {}, changing: {}, tables: {} });
                          }
                        } catch {}
                      }}
                    />
                  )}
                </div>

                <Button onClick={handleCall} disabled={loading || !selectedConnection} className="w-full">
                  {loading ? 'Calling...' : 'Execute RFC Call'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Function Modules</CardTitle>
                <CardDescription>Quick examples to try</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRfmName('STFC_CONNECTION');
                    setParameters('{\n  "REQUTEXT": "Hello SAP"\n}');
                  }}
                >
                  STFC_CONNECTION
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRfmName('RFC_PING');
                    setParameters('{}');
                  }}
                >
                  RFC_PING
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRfmName('RFC_SYSTEM_INFO');
                    setParameters('{}');
                  }}
                >
                  RFC_SYSTEM_INFO
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {error && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-destructive whitespace-pre-wrap">{error}</pre>
                  {result && (
                    <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            )}

            {result && !error && (
              <Card>
                <CardHeader>
                  <CardTitle>Result</CardTitle>
                  <CardDescription>
                    Execution time: {result.duration}ms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-[600px]">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {!result && !error && (
              <Card>
                <CardHeader>
                  <CardTitle>Result</CardTitle>
                  <CardDescription>Execute a call to see results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    No results yet
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
