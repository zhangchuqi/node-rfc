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
import { RefreshCw } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  isActive: boolean;
}

export default function NewRFCTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
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
        router.push('/rfc-templates');
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">New RFC Template</h1>
        <p className="text-muted-foreground mb-8">Create a predefined RFC call configuration</p>

        <form onSubmit={handleSubmit}>
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
                  <Input
                    id="rfmName"
                    value={formData.rfmName}
                    onChange={(e) => setFormData({ ...formData, rfmName: e.target.value.toUpperCase() })}
                    placeholder="e.g., BAPI_CUSTOMER_GETDETAIL"
                    required
                  />
                </div>
              </div>

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
                <p className="text-xs text-muted-foreground">
                  Default parameters for this RFC. Can be overridden when calling the API.
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

          <div className="flex gap-4 mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
            <Link href="/rfc-templates">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
