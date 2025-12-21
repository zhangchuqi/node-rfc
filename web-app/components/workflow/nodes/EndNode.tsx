"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export interface EndNodeData {
  responseSchema?: Record<string, any>;
  statusCode?: number;
  description?: string;
}

/**
 * End Node - API Response Node
 * 
 * Defines the final JSON structure and HTTP status code returned to the caller
 */
function EndNode({ data, selected }: NodeProps) {
  const nodeData = data as EndNodeData;

  return (
    <div
      className={`min-w-[300px] bg-white rounded-lg border-2 shadow-sm transition-all ${
        selected ? "border-red-500 shadow-lg" : "border-red-200 hover:border-red-300"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 border-b border-red-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">End</span>
          </div>
          <Badge className="bg-red-500 text-white text-xs">
            Response
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {nodeData.statusCode ? (
          <div className="text-xs flex items-center gap-2">
            <span className="font-medium text-gray-600">Status Code:</span>
            <Badge
              className={`text-xs ${
                nodeData.statusCode === 200 || nodeData.statusCode === 201
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {nodeData.statusCode}
            </Badge>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No status code configured
          </p>
        )}

        {nodeData.responseSchema && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Response Schema:</span>
            <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1">
              {Object.keys(nodeData.responseSchema).slice(0, 3).join(", ")}
              {Object.keys(nodeData.responseSchema).length > 3 && " ..."}
            </div>
          </div>
        )}

        {nodeData.description && (
          <p className="text-xs text-gray-500 italic mt-2">
            {nodeData.description}
          </p>
        )}
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white shadow-md"
      />
    </div>
  );
}

export default memo(EndNode);
