'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface MappingRule {
  id: string;
  source: string;      // API 字段路径，如 "customerId" 或 "customer.id"
  target: string;      // RFC 字段路径，如 "CUSTOMERNO" 或 "CUSTOMER_DATA.CUSTOMER_ID"
  type: 'field' | 'constant' | 'expression';
  value?: string;      // 如果是 constant 类型，存储常量值
}

interface JSONMapperProps {
  direction: 'input' | 'output';
  apiSchema?: any;     // API 的 JSON 结构示例
  rfcSchema?: any;     // RFC 的参数结构
  mappings: MappingRule[];
  onChange: (mappings: MappingRule[]) => void;
}

export default function JSONMapper({ 
  direction, 
  apiSchema, 
  rfcSchema, 
  mappings, 
  onChange 
}: JSONMapperProps) {
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null);

  const addRule = () => {
    const newRule: MappingRule = {
      id: Date.now().toString(),
      source: '',
      target: '',
      type: 'field',
    };
    onChange([...mappings, newRule]);
    setEditingRule(newRule);
  };

  const updateRule = (id: string, updates: Partial<MappingRule>) => {
    onChange(mappings.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (id: string) => {
    onChange(mappings.filter(rule => rule.id !== id));
  };

  const extractPaths = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    const paths: string[] = [];
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        paths.push(...extractPaths(obj[key], path));
      }
    }
    return paths;
  };

  const apiPaths = apiSchema ? extractPaths(apiSchema) : [];
  const rfcPaths = rfcSchema ? extractPaths(rfcSchema) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {direction === 'input' ? 'Input Mapping' : 'Output Mapping'}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardTitle>
        <CardDescription>
          {direction === 'input' 
            ? 'Map API input fields to RFC parameters'
            : 'Map RFC output fields to API response'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No mapping rules yet. Click "Add Rule" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {mappings.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 grid grid-cols-5 gap-2 items-center">
                    {/* Source Field */}
                    <div className="col-span-2">
                      <Label className="text-xs mb-1">
                        {direction === 'input' ? 'API Field' : 'RFC Field'}
                      </Label>
                      {apiPaths.length > 0 ? (
                        <Select
                          value={rule.source}
                          onValueChange={(value) => updateRule(rule.id, { source: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {(direction === 'input' ? apiPaths : rfcPaths).map(path => (
                              <SelectItem key={path} value={path}>
                                {path}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g., customerId"
                          value={rule.source}
                          onChange={(e) => updateRule(rule.id, { source: e.target.value })}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Target Field or Value */}
                    <div className="col-span-2">
                      <Label className="text-xs mb-1">
                        {direction === 'input' ? 'RFC Field' : 'API Field'}
                      </Label>
                      {rule.type === 'constant' ? (
                        <Input
                          placeholder="Constant value"
                          value={rule.value || ''}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          className="h-8 text-sm"
                        />
                      ) : rfcPaths.length > 0 ? (
                        <Select
                          value={rule.target}
                          onValueChange={(value) => updateRule(rule.id, { target: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {(direction === 'input' ? rfcPaths : apiPaths).map(path => (
                              <SelectItem key={path} value={path}>
                                {path}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g., CUSTOMERNO"
                          value={rule.target}
                          onChange={(e) => updateRule(rule.id, { target: e.target.value })}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Type Selector */}
                  <Select
                    value={rule.type}
                    onValueChange={(value: any) => updateRule(rule.id, { type: value })}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field">Field</SelectItem>
                      <SelectItem value="constant">Constant</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {mappings.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <Label className="text-xs mb-2 block">Mapping Preview</Label>
              <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                {JSON.stringify(mappings.map(r => ({
                  [r.source]: r.type === 'constant' ? `"${r.value}"` : r.target
                })), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
