'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ArrowRight, Eye } from 'lucide-react';

interface MappingRule {
  id: string;
  source: string;
  target: string;
  type: 'field' | 'constant' | 'expression';
  value?: string;
}

interface JSONMapperVisualProps {
  direction: 'input' | 'output';
  sourceLabel: string;      // "API" or "RFC"
  targetLabel: string;       // "RFC" or "API"
  sourceSchema?: any;
  targetSchema?: any;
  mappings: MappingRule[];
  onChange: (mappings: MappingRule[]) => void;
}

export default function JSONMapperVisual({
  direction,
  sourceLabel,
  targetLabel,
  sourceSchema,
  targetSchema,
  mappings,
  onChange,
}: JSONMapperVisualProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // 从对象中提取所有路径
  const extractPaths = (obj: any, prefix = ''): Array<{ path: string; type: string; value?: any }> => {
    if (!obj || typeof obj !== 'object') return [];
    
    const paths: Array<{ path: string; type: string; value?: any }> = [];
    
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (value === null) {
        paths.push({ path, type: 'null' });
      } else if (Array.isArray(value)) {
        paths.push({ path, type: 'array' });
        if (value.length > 0 && typeof value[0] === 'object') {
          paths.push(...extractPaths(value[0], `${path}[0]`));
        }
      } else if (typeof value === 'object') {
        paths.push({ path, type: 'object' });
        paths.push(...extractPaths(value, path));
      } else {
        paths.push({ path, type: typeof value, value });
      }
    }
    
    return paths;
  };

  const sourcePaths = sourceSchema ? extractPaths(sourceSchema) : [];
  const targetPaths = targetSchema ? extractPaths(targetSchema) : [];

  const createMapping = () => {
    if (!selectedSource || !selectedTarget) return;

    const newRule: MappingRule = {
      id: Date.now().toString(),
      source: selectedSource,
      target: selectedTarget,
      type: 'field',
    };

    onChange([...mappings, newRule]);
    setSelectedSource(null);
    setSelectedTarget(null);
  };

  const deleteMapping = (id: string) => {
    onChange(mappings.filter(m => m.id !== id));
  };

  const isSourceMapped = (path: string) => {
    return mappings.some(m => m.source === path);
  };

  const isTargetMapped = (path: string) => {
    return mappings.some(m => m.target === path);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'object': return 'bg-orange-100 text-orange-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：源字段 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{sourceLabel} Fields</CardTitle>
            <CardDescription className="text-xs">Click to select source field</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {sourcePaths.length === 0 ? (
                <p className="text-xs text-muted-foreground">No fields available</p>
              ) : (
                sourcePaths.map(({ path, type }) => (
                  <div
                    key={path}
                    onClick={() => setSelectedSource(path)}
                    className={`
                      p-2 rounded cursor-pointer text-xs flex items-center justify-between
                      ${selectedSource === path ? 'bg-blue-100 border-2 border-blue-500' : 'bg-muted/50 hover:bg-muted'}
                      ${isSourceMapped(path) ? 'opacity-50' : ''}
                    `}
                  >
                    <span className="font-mono truncate flex-1">{path}</span>
                    <Badge variant="outline" className={`text-[10px] ml-2 ${getTypeColor(type)}`}>
                      {type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：目标字段 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{targetLabel} Fields</CardTitle>
            <CardDescription className="text-xs">Click to select target field</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {targetPaths.length === 0 ? (
                <p className="text-xs text-muted-foreground">No fields available</p>
              ) : (
                targetPaths.map(({ path, type }) => (
                  <div
                    key={path}
                    onClick={() => setSelectedTarget(path)}
                    className={`
                      p-2 rounded cursor-pointer text-xs flex items-center justify-between
                      ${selectedTarget === path ? 'bg-green-100 border-2 border-green-500' : 'bg-muted/50 hover:bg-muted'}
                      ${isTargetMapped(path) ? 'opacity-50' : ''}
                    `}
                  >
                    <span className="font-mono truncate flex-1">{path}</span>
                    <Badge variant="outline" className={`text-[10px] ml-2 ${getTypeColor(type)}`}>
                      {type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 创建映射按钮 */}
      {selectedSource && selectedTarget && (
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg border-2 border-dashed">
          <Badge variant="outline" className="font-mono">{selectedSource}</Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge variant="outline" className="font-mono">{selectedTarget}</Badge>
          <Button size="sm" onClick={createMapping}>
            <Plus className="h-3 w-3 mr-1" />
            Create Mapping
          </Button>
        </div>
      )}

      {/* 映射列表 */}
      {mappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Active Mappings ({mappings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mappings.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                  <Badge variant="secondary" className="font-mono text-xs flex-1 justify-start">
                    {rule.source}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <Badge variant="secondary" className="font-mono text-xs flex-1 justify-start">
                    {rule.target}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMapping(rule.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
