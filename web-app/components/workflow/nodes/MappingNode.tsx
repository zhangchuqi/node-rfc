"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";

export interface MappingRule {
  id: string;
  source: string;
  target: string;
  type: "field" | "constant" | "expression";
  value?: string;
  transform?: string;
}

export interface MappingNodeData {
  label?: string;
  mappingRules?: MappingRule[];
  direction?: "input" | "output"; // input: API -> RFC, output: RFC -> API
  description?: string;
}

/**
 * Mapping Node - Data Transform Node
 * 
 * Transforms JSON data structure, supports field mapping, constant assignment, and expression calculation
 */
function MappingNode({ data, selected }: NodeProps) {
  const nodeData = data as MappingNodeData;
  const isInput = nodeData.direction === "input";
  const color = isInput
    ? { bg: "bg-blue-50", bgGradient: "from-blue-50 to-blue-100", border: "border-blue-200", borderHover: "hover:border-blue-300", borderSelected: "border-blue-500", accent: "bg-blue-500", text: "text-blue-700" }
    : { bg: "bg-purple-50", bgGradient: "from-purple-50 to-purple-100", border: "border-purple-200", borderHover: "hover:border-purple-300", borderSelected: "border-purple-500", accent: "bg-purple-500", text: "text-purple-700" };

  return (
    <div
      className={`min-w-[300px] bg-white rounded-lg border-2 shadow-sm transition-all ${
        selected ? `${color.borderSelected} shadow-lg` : `${color.border} ${color.borderHover}`
      }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${color.bgGradient} px-4 py-3 border-b ${color.border} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${color.accent} flex items-center justify-center shadow-sm`}>
              <span className="text-white font-bold text-sm">{isInput ? "→" : "←"}</span>
            </div>
            <span className="font-semibold text-gray-800">
              {nodeData.label || "Mapping"}
            </span>
          </div>
          <Badge className={`${color.accent} text-white text-xs`}>
            {isInput ? "Input" : "Output"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {nodeData.mappingRules && nodeData.mappingRules.length > 0 ? (
          <div className="space-y-1.5">
            {nodeData.mappingRules.slice(0, 3).map((rule, idx) => (
              <div
                key={idx}
                className="text-xs flex items-center gap-1.5 text-gray-700"
              >
                <code className={`${color.bg} ${color.text} px-2 py-0.5 rounded font-mono text-[10px]`}>{rule.source}</code>
                <span className="text-gray-400">→</span>
                <code className={`${color.bg} ${color.text} px-2 py-0.5 rounded font-mono text-[10px]`}>{rule.target}</code>
                {rule.transform && (
                  <span className="text-[10px] italic text-gray-500">({rule.transform})</span>
                )}
              </div>
            ))}
            {nodeData.mappingRules.length > 3 && (
              <div className="text-xs text-gray-500 pl-2">
                + {nodeData.mappingRules.length - 3} more rules
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No mapping rules configured
          </p>
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
        className={`${color.accent} !w-3 !h-3 !border-2 !border-white shadow-md`}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={`${color.accent} !w-3 !h-3 !border-2 !border-white shadow-md`}
      />
    </div>
  );
}

export default memo(MappingNode);
