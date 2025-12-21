"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";

export interface RFCCallNodeData {
  connectionId?: string;
  connectionName?: string;
  rfmName?: string;
  inputParams?: Record<string, any>;
  outputParams?: Record<string, any>;
  description?: string;
}

/**
 * RFC Call Node - SAP RFC Call Node
 * 
 * Configures SAP connection and RFC Function Module, executes actual SAP call
 */
function RFCCallNode({ data, selected }: NodeProps) {
  const nodeData = data as RFCCallNodeData;

  return (
    <div
      className={`min-w-[300px] bg-white rounded-lg border-2 shadow-sm transition-all ${
        selected ? "border-orange-500 shadow-lg" : "border-orange-200 hover:border-orange-300"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
              <Server className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">RFC Call</span>
          </div>
          <Badge className="bg-orange-500 text-white text-xs">
            SAP
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {nodeData.connectionName ? (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Connection:</span>
            <div className="mt-1">
              <code className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-mono">
                {nodeData.connectionName}
              </code>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No connection configured
          </p>
        )}

        {nodeData.rfmName ? (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Function:</span>
            <div className="mt-1">
              <code className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-mono font-semibold">
                {nodeData.rfmName}
              </code>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No RFC function configured
          </p>
        )}

        {nodeData.inputParams && Object.keys(nodeData.inputParams).length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Input Params:</span>
            <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1">
              {Object.keys(nodeData.inputParams).slice(0, 3).join(", ")}
              {Object.keys(nodeData.inputParams).length > 3 && " ..."}
            </div>
          </div>
        )}

        {nodeData.outputParams && Object.keys(nodeData.outputParams).length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Output Params:</span>
            <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1">
              {Object.keys(nodeData.outputParams).slice(0, 3).join(", ")}
              {Object.keys(nodeData.outputParams).length > 3 && " ..."}
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
        className="!bg-orange-500 !w-3 !h-3 !border-2 !border-white shadow-md"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-orange-500 !w-3 !h-3 !border-2 !border-white shadow-md"
      />
    </div>
  );
}

export default memo(RFCCallNode);
