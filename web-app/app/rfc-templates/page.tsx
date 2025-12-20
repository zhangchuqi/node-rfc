'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings, Play, Link as LinkIcon } from 'lucide-react';

interface RFCTemplate {
  id: string;
  name: string;
  description: string | null;
  rfmName: string;
  apiPath: string | null;
  isActive: boolean;
  connection: {
    id: string;
    name: string;
  };
  _count: {
    calls: number;
  };
}

export default function RFCTemplatesPage() {
  const [templates, setTemplates] = useState<RFCTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/rfc-templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this RFC template?')) return;

    try {
      const res = await fetch(`/api/rfc-templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
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
            <h1 className="text-4xl font-bold mb-2">RFC Templates</h1>
            <p className="text-muted-foreground">Manage predefined RFC call configurations</p>
          </div>
          <Link href="/rfc-templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates yet. Create your first RFC template to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>RFC Function</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>API Path</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                        {template.description && (
                          <div className="text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {template.rfmName}
                        </code>
                      </TableCell>
                      <TableCell>{template.connection.name}</TableCell>
                      <TableCell>
                        {template.apiPath ? (
                          <div className="flex items-center gap-2">
                            <code className="text-sm">
                              /api/public{template.apiPath}
                            </code>
                            <Badge variant="outline">Secured</Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{template._count.calls}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'outline'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/rfc-templates/${template.id}/execute`}>
                            <Button variant="ghost" size="icon" title="执行">
                              <Play className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/rfc-templates/${template.id}/edit`}>
                            <Button variant="ghost" size="icon" title="编辑">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                          {template.apiPath && (
                            <Link href={`/rfc-templates/${template.id}/api-docs`}>
                            <Button variant="ghost" size="icon" title="API Docs">
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTemplate(template.id)}
                            title="Delete"
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
