"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { PlayCircle } from "lucide-react";

export interface StartNodeData {
  apiPath?: string;
  httpMethod?: "GET" | "POST" | "PUT" | "DELETE";
  inputSchema?: Record<string, any>;
  description?: string;
}

/**
 * Start Node - API Entry Point
 * 
 * Defines the RESTful API endpoint and input JSON structure
 */
function StartNode({ data, selected }: NodeProps) {
  const nodeData = data as StartNodeData;
  
  return (
    <div
      className={`min-w-[300px] bg-white rounded-lg border-2 shadow-sm transition-all ${
        selected ? "border-green-500 shadow-lg" : "border-green-200 hover:border-green-300"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
              <PlayCircle className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Start</span>
          </div>
          <Badge className="bg-green-500 text-white text-xs">
            API Entry
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {nodeData.apiPath && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Path:</span>
            <code className="ml-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">
              {nodeData.apiPath}
            </code>
          </div>
        )}
        
        {nodeData.httpMethod && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Method:</span>
            <code className="ml-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono font-semibold">
              {nodeData.httpMethod}
            </code>
          </div>
        )}
        
        {nodeData.inputSchema && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Input Schema:</span>
            <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1">
              {Object.keys(nodeData.inputSchema).slice(0, 3).join(", ")}
              {Object.keys(nodeData.inputSchema).length > 3 && " ..."}
            </div>
          </div>
        )}

        {nodeData.description && (
          <p className="text-xs text-gray-500 italic mt-2">
            {nodeData.description}
          </p>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white shadow-md"
      />
    </div>
  );
}

export default memo(StartNode);
