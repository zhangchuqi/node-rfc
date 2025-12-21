"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowTemplateInfo, getTemplatesByCategory, getCategories } from "@/lib/workflow-templates";
import { Sparkles, Zap, RefreshCw, GitBranch } from "lucide-react";

interface WorkflowTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: WorkflowTemplateInfo) => void;
}

const categoryIcons: Record<string, any> = {
  basic: Zap,
  integration: RefreshCw,
  "data-processing": GitBranch,
};

const categoryNames: Record<string, string> = {
  basic: "Basic Templates",
  integration: "Integration Templates",
  "data-processing": "Data Processing",
};

export default function WorkflowTemplateDialog({
  open,
  onOpenChange,
  onSelect,
}: WorkflowTemplateDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const categories = getCategories();

  const templates =
    selectedCategory === "all"
      ? getTemplatesByCategory()
      : getTemplatesByCategory(selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Workflow Template
          </DialogTitle>
          <DialogDescription>
            Quick start from preset templates, or choose blank canvas for custom design
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, 1fr)` }}>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {categoryNames[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 空白画布选项 */}
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  onSelect({
                    id: "blank",
                    name: "Blank Canvas",
                    description: "Design your workflow from scratch",
                    category: "custom",
                    workflow: { nodes: [], edges: [] },
                  });
                  onOpenChange(false);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <Badge variant="outline">Custom</Badge>
                  </div>
                  <CardTitle className="mt-4">Blank Canvas</CardTitle>
                  <CardDescription>
                    Fully custom workflow design for special requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    0 preset nodes
                  </div>
                </CardContent>
              </Card>

              {/* 模板列表 */}
              {templates.map((template) => {
                const Icon = categoryIcons[template.category] || Sparkles;
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      onSelect(template);
                      onOpenChange(false);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                          {template.icon || <Icon className="h-6 w-6 text-primary" />}
                        </div>
                        <Badge variant="secondary">
                          {categoryNames[template.category] || template.category}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{template.workflow.nodes.length} nodes</span>
                        <span>{template.workflow.edges.length} connections</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: After selecting a template, you can modify all node configurations by double-clicking them
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
