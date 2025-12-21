// 内置工作流模板
// 根据 WORKFLOW_CONSIDERATIONS.md Phase 2 实现

import { WorkflowDefinition } from "@/components/workflow/WorkflowCanvas";

export interface WorkflowTemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: WorkflowDefinition;
  icon?: string;
}

export const workflowTemplates: WorkflowTemplateInfo[] = [
  {
    id: "simple-rfc",
    name: "Simple RFC Call",
    description: "Basic RFC call template for direct single RFC function invocation",
    category: "basic",
    icon: "⚡",
    workflow: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: {
            apiPath: "/api/my-rfc",
            httpMethod: "POST",
            description: "API Entry Point",
          },
        },
        {
          id: "rfc-1",
          type: "rfc-call",
          position: { x: 450, y: 100 },
          data: {
            description: "Call SAP RFC Function",
          },
        },
        {
          id: "end-1",
          type: "end",
          position: { x: 800, y: 100 },
          data: {
            statusCode: 200,
            description: "Return RFC Result",
          },
        },
      ],
      edges: [
        {
          id: "e-start-rfc",
          source: "start-1",
          target: "rfc-1",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e-rfc-end",
          source: "rfc-1",
          target: "end-1",
          type: "smoothstep",
          animated: true,
        },
      ],
    },
  },
  {
    id: "rest-to-rfc-bridge",
    name: "REST to RFC Bridge",
    description: "Complete data mapping workflow with input/output transformation",
    category: "integration",
    icon: "🔄",
    workflow: {
      nodes: [
        {
          id: "start-2",
          type: "start",
          position: { x: 50, y: 150 },
          data: {
            apiPath: "/api/bridge",
            httpMethod: "POST",
            description: "REST API Entry",
          },
        },
        {
          id: "input-map",
          type: "mapping",
          position: { x: 250, y: 150 },
          data: {
            label: "Input Data Transform",
            direction: "input",
            description: "Convert REST format to RFC format",
          },
        },
        {
          id: "rfc-2",
          type: "rfc-call",
          position: { x: 500, y: 150 },
          data: {
            description: "Execute RFC Call",
          },
        },
        {
          id: "output-map",
          type: "mapping",
          position: { x: 750, y: 150 },
          data: {
            label: "Output Data Transform",
            direction: "output",
            description: "Convert RFC result to REST format",
          },
        },
        {
          id: "end-2",
          type: "end",
          position: { x: 1000, y: 150 },
          data: {
            statusCode: 200,
            description: "Return REST Response",
          },
        },
      ],
      edges: [
        {
          id: "e2-start-inputmap",
          source: "start-2",
          target: "input-map",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e2-inputmap-rfc",
          source: "input-map",
          target: "rfc-2",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e2-rfc-outputmap",
          source: "rfc-2",
          target: "output-map",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e2-outputmap-end",
          source: "output-map",
          target: "end-2",
          type: "smoothstep",
          animated: true,
        },
      ],
    },
  },
  {
    id: "data-enrichment",
    name: "Data Enrichment",
    description: "Process and transform data before and after RFC call",
    category: "data-processing",
    icon: "✨",
    workflow: {
      nodes: [
        {
          id: "start-3",
          type: "start",
          position: { x: 50, y: 200 },
          data: {
            apiPath: "/api/enrich",
            httpMethod: "POST",
          },
        },
        {
          id: "pre-map",
          type: "mapping",
          position: { x: 250, y: 100 },
          data: {
            label: "Data Pre-processing",
            direction: "input",
            description: "Clean and validate input data",
          },
        },
        {
          id: "rfc-3",
          type: "rfc-call",
          position: { x: 500, y: 200 },
          data: {
            description: "Get Master Data",
          },
        },
        {
          id: "post-map",
          type: "mapping",
          position: { x: 750, y: 300 },
          data: {
            label: "Data Post-processing",
            direction: "output",
            description: "Format and enrich return data",
          },
        },
        {
          id: "end-3",
          type: "end",
          position: { x: 1000, y: 200 },
          data: {
            statusCode: 200,
          },
        },
      ],
      edges: [
        {
          id: "e3-start-premap",
          source: "start-3",
          target: "pre-map",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e3-premap-rfc",
          source: "pre-map",
          target: "rfc-3",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e3-rfc-postmap",
          source: "rfc-3",
          target: "post-map",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e3-postmap-end",
          source: "post-map",
          target: "end-3",
          type: "smoothstep",
          animated: true,
        },
      ],
    },
  },
  {
    id: "multi-mapping",
    name: "Multi-layer Transformation",
    description: "For complex data structure transformation scenarios",
    category: "data-processing",
    icon: "🔀",
    workflow: {
      nodes: [
        {
          id: "start-4",
          type: "start",
          position: { x: 50, y: 250 },
          data: {},
        },
        {
          id: "map-1",
          type: "mapping",
          position: { x: 250, y: 150 },
          data: {
            label: "First Layer Transform",
            direction: "input",
          },
        },
        {
          id: "map-2",
          type: "mapping",
          position: { x: 250, y: 350 },
          data: {
            label: "Second Layer Transform",
            direction: "input",
          },
        },
        {
          id: "rfc-4",
          type: "rfc-call",
          position: { x: 500, y: 250 },
          data: {},
        },
        {
          id: "end-4",
          type: "end",
          position: { x: 750, y: 250 },
          data: {
            statusCode: 200,
          },
        },
      ],
      edges: [
        {
          id: "e4-start-map1",
          source: "start-4",
          target: "map-1",
          type: "smoothstep",
        },
        {
          id: "e4-start-map2",
          source: "start-4",
          target: "map-2",
          type: "smoothstep",
        },
        {
          id: "e4-map1-rfc",
          source: "map-1",
          target: "rfc-4",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e4-map2-rfc",
          source: "map-2",
          target: "rfc-4",
          type: "smoothstep",
          animated: true,
        },
        {
          id: "e4-rfc-end",
          source: "rfc-4",
          target: "end-4",
          type: "smoothstep",
          animated: true,
        },
      ],
    },
  },
];

// 按分类获取模板
export function getTemplatesByCategory(category?: string): WorkflowTemplateInfo[] {
  if (!category) return workflowTemplates;
  return workflowTemplates.filter((t) => t.category === category);
}

// 按 ID 获取模板
export function getTemplateById(id: string): WorkflowTemplateInfo | undefined {
  return workflowTemplates.find((t) => t.id === id);
}

// 获取所有分类
export function getCategories(): string[] {
  return Array.from(new Set(workflowTemplates.map((t) => t.category)));
}
