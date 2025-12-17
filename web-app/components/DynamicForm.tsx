"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DynamicFormProps {
  data: any;
  onChange: (data: any) => void;
  grouped?: boolean;
  metadata?: any;
}

const PARAM_TYPE_INFO: Record<string, { label: string; color: string; description: string; readonly?: boolean }> = {
  import: { 
    label: 'Import Parameters', 
    color: 'bg-blue-100 text-blue-800 border-blue-300', 
    description: 'Input parameters - data sent to SAP'
  },
  export: { 
    label: 'Export Parameters', 
    color: 'bg-green-100 text-green-800 border-green-300', 
    description: 'Output parameters - data returned from SAP',
    readonly: true
  },
  changing: { 
    label: 'Changing Parameters', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
    description: 'Bidirectional parameters - both input and output'
  },
  tables: { 
    label: 'Table Parameters', 
    color: 'bg-purple-100 text-purple-800 border-purple-300', 
    description: 'Table parameters - typically for lists of data'
  }
};

export function DynamicForm({ data, onChange, grouped = false, metadata = {} }: DynamicFormProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['import', 'changing', 'tables']));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['import', 'changing', 'tables']));

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const updateValue = (path: (string | number)[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newData);
  };

  const addArrayItem = (path: (string | number)[]) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (const key of path) {
      current = current[key];
    }
    
    // Create a template item based on first item or empty object
    const template = current.length > 0 ? JSON.parse(JSON.stringify(current[0])) : {};
    
    // Clear all values in template
    const clearValues = (obj: any): any => {
      if (Array.isArray(obj)) {
        return [];
      } else if (typeof obj === 'object' && obj !== null) {
        const cleared: any = {};
        for (const key in obj) {
          cleared[key] = clearValues(obj[key]);
        }
        return cleared;
      }
      return '';
    };
    
    current.push(clearValues(template));
    onChange(newData);
  };

  const removeArrayItem = (path: (string | number)[], index: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (const key of path) {
      current = current[key];
    }
    
    current.splice(index, 1);
    onChange(newData);
  };

  const renderField = (key: string, value: any, path: (string | number)[], pathString: string, depth: number = 0): React.ReactNode => {
    // Try to get field metadata - look at the top-level parameter name
    const topLevelParam = path[0];
    let fieldMeta = null;
    
    // For nested fields, the key is the field name
    if (path.length >= 2 && metadata?.[topLevelParam]?.fields) {
      fieldMeta = metadata[topLevelParam].fields[key];
    }
    
    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(pathString);
      
      return (
        <div key={pathString} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(pathString)}
              className="p-0 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Label className="font-semibold text-blue-600">{key} ({value.length} items)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(path)}
              className="h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          
          {isExpanded && (
            <div className="ml-6 space-y-3">
              {value.length === 0 && (
                <p className="text-sm text-gray-500 italic">No items. Click "Add" to create one.</p>
              )}
              {value.map((item, index) => (
                <Card key={`${pathString}[${index}]`} className="border-l-4 border-l-blue-400">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem(path, index)}
                        className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {typeof item === 'object' && item !== null ? (
                      Object.entries(item).map(([itemKey, itemValue]) =>
                        renderField(itemKey, itemValue, [...path, index, itemKey], `${pathString}[${index}].${itemKey}`, depth + 1)
                      )
                    ) : (
                      <Input
                        value={item}
                        onChange={(e) => updateValue([...path, index], e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    } else if (typeof value === 'object' && value !== null) {
      const isExpanded = expandedPaths.has(pathString);
      
      return (
        <div key={pathString} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(pathString)}
              className="p-0 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Label className="font-semibold text-green-600">{key}</Label>
          </div>
          
          {isExpanded && (
            <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
              {Object.entries(value).map(([subKey, subValue]) =>
                renderField(subKey, subValue, [...path, subKey], `${pathString}.${subKey}`, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    } else {
      // Simple field
      // Use the fieldMeta we already extracted at the beginning
      const isRequired = fieldMeta?.key || false;
      const description = fieldMeta?.description || '';
      const dataType = fieldMeta?.dataType || '';
      const length = fieldMeta?.length || 0;
      const hasValueHelp = fieldMeta?.hasValueHelp || false;
      const checkTable = fieldMeta?.checkTable || '';
      
      return (
        <div key={pathString} className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor={pathString} className="text-sm font-medium text-gray-700">
              {key}
              {isRequired && <span className="text-red-500 ml-1" title="Key field">*</span>}
              {hasValueHelp && <span className="text-blue-500 ml-1" title="Value help available">🔍</span>}
            </Label>
            <div className="flex gap-2 text-xs">
              {dataType && (
                <Badge variant="outline" className="text-xs font-mono">
                  {dataType}
                  {length > 0 && `(${length})`}
                </Badge>
              )}
              {checkTable && (
                <Badge variant="secondary" className="text-xs" title={`Check table: ${checkTable}`}>
                  {checkTable}
                </Badge>
              )}
            </div>
          </div>
          {description && (
            <p className="text-xs text-gray-600 mb-1.5 italic">{description}</p>
          )}
          <Input
            id={pathString}
            value={value}
            onChange={(e) => updateValue(path, e.target.value)}
            placeholder={length > 0 ? `Max ${length} chars` : `Enter ${key}`}
            className="text-sm"
            maxLength={length > 0 ? length : undefined}
          />
        </div>
      );
    }
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No parameters loaded. Click 📋 to load parameter structure.</p>
      </div>
    );
  }

  // Check if data is grouped by parameter type
  const isGrouped = grouped || (data.import || data.export || data.changing || data.tables);

  if (isGrouped) {
    return (
      <div className="space-y-6">
        {Object.entries(PARAM_TYPE_INFO).map(([groupKey, groupInfo]) => {
          const groupData = data[groupKey];
          if (!groupData || Object.keys(groupData).length === 0) return null;
          
          const isGroupExpanded = expandedGroups.has(groupKey);
          
          return (
            <Card key={groupKey} className={`border-2 ${groupInfo.color}`}>
              <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleGroup(groupKey)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6"
                    >
                      {isGroupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <CardTitle className="text-base">{groupInfo.label}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(groupData).length} params
                    </Badge>
                  </div>
                  {groupInfo.readonly && (
                    <Badge variant="secondary" className="text-xs">Read-only</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-9">{groupInfo.description}</p>
              </CardHeader>
              
              {isGroupExpanded && (
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(groupData).map(([key, value]) => {
                      const paramMeta = metadata?.[key];
                      const isParamRequired = paramMeta?.required || false;
                      
                      return (
                        <div key={key}>
                          {isParamRequired && (
                            <Badge variant="destructive" className="text-xs mb-2">Required</Badge>
                          )}
                          {renderField(key, value, [groupKey, key], `${groupKey}.${key}`)}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) =>
        renderField(key, value, [key], key)
      )}
    </div>
  );
}
