"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface MappingRule {
  source: string;
  target: string;
  transform?: string;
}

interface VisualMappingEditorProps {
  sourceSchema: string;
  targetSchema: string;
  mappingRules: MappingRule[];
  onMappingChange: (rules: MappingRule[]) => void;
}

function extractFields(jsonStr: string, prefix = ''): string[] {
  try {
    const obj = JSON.parse(jsonStr);
    const fields: string[] = [];
    
    function traverse(obj: any, path: string) {
      if (obj === null || obj === undefined) return;
      
      if (Array.isArray(obj)) {
        if (obj.length > 0) {
          traverse(obj[0], path + '[0]');
        }
      } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            traverse(obj[key], newPath);
          } else {
            fields.push(newPath);
          }
        });
      }
    }
    
    traverse(obj, prefix);
    return fields;
  } catch (e) {
    return [];
  }
}

export function VisualMappingEditor({ 
  sourceSchema, 
  targetSchema, 
  mappingRules, 
  onMappingChange 
}: VisualMappingEditorProps) {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<string[]>([]);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  useEffect(() => {
    setSourceFields(extractFields(sourceSchema));
  }, [sourceSchema]);

  useEffect(() => {
    setTargetFields(extractFields(targetSchema));
  }, [targetSchema]);

  const handleConnect = (source: string, target: string) => {
    // Check if mapping already exists
    const exists = mappingRules.some(rule => rule.source === source && rule.target === target);
    if (!exists) {
      onMappingChange([...mappingRules, { source, target, transform: '' }]);
    }
  };

  const handleDisconnect = (source: string, target: string) => {
    onMappingChange(mappingRules.filter(rule => !(rule.source === source && rule.target === target)));
  };

  const isConnected = (source: string, target: string) => {
    return mappingRules.some(rule => rule.source === source && rule.target === target);
  };

  const getTransform = (source: string, target: string) => {
    const rule = mappingRules.find(rule => rule.source === source && rule.target === target);
    return rule?.transform || '';
  };

  const updateTransform = (source: string, target: string, transform: string) => {
    onMappingChange(mappingRules.map(rule => 
      rule.source === source && rule.target === target 
        ? { ...rule, transform } 
        : rule
    ));
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/5">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6">
        {/* Source Fields */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-muted-foreground mb-3">Source Fields</div>
          {sourceFields.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">No fields found</div>
          ) : (
            sourceFields.map(field => (
              <div
                key={field}
                className={`p-2 rounded border bg-card text-sm cursor-pointer transition-colors ${
                  hoveredSource === field ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
                }`}
                onMouseEnter={() => setHoveredSource(field)}
                onMouseLeave={() => setHoveredSource(null)}
              >
                <div className="font-mono text-xs">{field}</div>
              </div>
            ))
          )}
        </div>

        {/* Connections Area */}
        <div className="flex flex-col items-center justify-center min-w-[200px] space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Connections</div>
          {mappingRules.length === 0 ? (
            <div className="text-xs text-muted-foreground italic text-center">
              Click source then target<br/>to create connection
            </div>
          ) : (
            <div className="space-y-2 w-full">
              {mappingRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground truncate">{rule.source}</div>
                    <div className="text-xs font-semibold truncate">→ {rule.target}</div>
                    {rule.transform && (
                      <div className="text-xs text-blue-600 truncate">{rule.transform}</div>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleDisconnect(rule.source, rule.target)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Target Fields */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-muted-foreground mb-3">Target Fields</div>
          {targetFields.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">No fields found</div>
          ) : (
            targetFields.map(field => (
              <div
                key={field}
                className={`p-2 rounded border bg-card text-sm cursor-pointer transition-colors ${
                  hoveredTarget === field ? 'border-green-500 bg-green-50' : 'hover:border-green-300'
                }`}
                onMouseEnter={() => setHoveredTarget(field)}
                onMouseLeave={() => setHoveredTarget(null)}
                onClick={() => {
                  if (hoveredSource) {
                    handleConnect(hoveredSource, field);
                  }
                }}
              >
                <div className="font-mono text-xs">{field}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transform Editor for Selected Connection */}
      {hoveredSource && hoveredTarget && isConnected(hoveredSource, hoveredTarget) && (
        <div className="mt-4 p-3 border rounded bg-card">
          <div className="text-sm font-semibold mb-2">Transform Function</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground flex-shrink-0">
              {hoveredSource} → {hoveredTarget}
            </div>
            <Input
              placeholder="e.g.: toUpperCase()"
              value={getTransform(hoveredSource, hoveredTarget)}
              onChange={(e) => updateTransform(hoveredSource, hoveredTarget, e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
