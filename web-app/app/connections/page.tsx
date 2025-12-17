'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  connectionType: string;
  host: string;
  systemNumber: string;
  client: string;
  user: string;
  isActive: boolean;
  _count: { callLogs: number };
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchConnections();
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">SAP Connections</h1>
            <p className="text-muted-foreground">Manage your SAP system connections</p>
          </div>
          <Link href="/connections/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Connection
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              {connections.length} connection{connections.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No connections yet. Create your first connection to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((conn) => (
                    <TableRow key={conn.id}>
                      <TableCell className="font-medium">{conn.name}</TableCell>
                      <TableCell>
                        <Badge variant={conn.connectionType === 'POOL' ? 'default' : 'secondary'}>
                          {conn.connectionType}
                        </Badge>
                      </TableCell>
                      <TableCell>{conn.host}:{conn.systemNumber}</TableCell>
                      <TableCell>{conn.client}</TableCell>
                      <TableCell>{conn.user}</TableCell>
                      <TableCell>{conn._count.callLogs}</TableCell>
                      <TableCell>
                        <Badge variant={conn.isActive ? 'default' : 'outline'}>
                          {conn.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/connections/${conn.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteConnection(conn.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
