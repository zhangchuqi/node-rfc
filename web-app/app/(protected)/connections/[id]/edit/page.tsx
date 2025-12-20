'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function EditConnectionPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    connectionType: 'CLIENT',
    host: '',
    systemNumber: '00',
    client: '',
    user: '',
    password: '',
    language: 'EN',
    description: '',
    poolLow: '2',
    poolHigh: '10',
    isActive: true,
  });

  useEffect(() => {
    fetchConnection();
  }, [connectionId]);

  const fetchConnection = async () => {
    try {
      const res = await fetch(`/api/connections/${connectionId}`);
      const data = await res.json();
      
      if (data.success) {
        const conn = data.data;
        setFormData({
          name: conn.name,
          connectionType: conn.connectionType,
          host: conn.host,
          systemNumber: conn.systemNumber,
          client: conn.client,
          user: conn.user,
          password: conn.password,
          language: conn.language,
          description: conn.description || '',
          poolLow: conn.poolOptions?.low?.toString() || '2',
          poolHigh: conn.poolOptions?.high?.toString() || '10',
          isActive: conn.isActive,
        });
      } else {
        alert('Error: ' + data.error);
        router.push('/connections');
      }
    } catch (error: any) {
      alert('Error fetching connection: ' + error.message);
      router.push('/connections');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      name: formData.name,
      connectionType: formData.connectionType,
      host: formData.host,
      systemNumber: formData.systemNumber,
      client: formData.client,
      user: formData.user,
      password: formData.password,
      language: formData.language,
      description: formData.description || null,
      isActive: formData.isActive,
    };

    if (formData.connectionType === 'POOL') {
      payload.poolOptions = {
        low: parseInt(formData.poolLow),
        high: parseInt(formData.poolHigh),
      };
    }

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/connections');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error updating connection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);

    const connectionData: any = {
      host: formData.host,
      systemNumber: formData.systemNumber,
      client: formData.client,
      user: formData.user,
      password: formData.password,
      language: formData.language,
      connectionType: formData.connectionType,
    };

    try {
      const res = await fetch('/api/sap/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionData }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Connection successful! (${data.data.duration}ms)`);
      } else {
        alert(`❌ Connection failed: ${data.error}`);
      }
    } catch (error: any) {
      alert('Error testing connection: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-8">Loading connection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Edit SAP Connection</h1>
        <p className="text-muted-foreground mb-8">Update SAP system connection settings</p>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
              <CardDescription>Modify the SAP connection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionType">Connection Type *</Label>
                  <Select
                    value={formData.connectionType}
                    onValueChange={(value) => setFormData({ ...formData, connectionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client (Direct)</SelectItem>
                      <SelectItem value="POOL">Pool (Connection Pool)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host (ASHOST) *</Label>
                  <Input
                    id="host"
                    placeholder="sap.example.com"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemNumber">System Number *</Label>
                  <Input
                    id="systemNumber"
                    placeholder="00"
                    value={formData.systemNumber}
                    onChange={(e) => setFormData({ ...formData, systemNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Input
                    id="client"
                    placeholder="100"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user">User *</Label>
                  <Input
                    id="user"
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.connectionType === 'POOL' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poolLow">Pool Min Connections</Label>
                    <Input
                      id="poolLow"
                      type="number"
                      value={formData.poolLow}
                      onChange={(e) => setFormData({ ...formData, poolLow: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poolHigh">Pool Max Connections</Label>
                    <Input
                      id="poolHigh"
                      type="number"
                      value={formData.poolHigh}
                      onChange={(e) => setFormData({ ...formData, poolHigh: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Connection'}
                </Button>
                <Link href="/connections">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
