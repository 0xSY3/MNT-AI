import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Shield, AlertTriangle, Zap, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SecurityAnalyzerProps {
  code: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export function SecurityAnalyzer({ code, onAnalysisComplete }: SecurityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    if (!code?.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide contract code to analyze",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await response.json();
      if (!result.securityIssues || !result.optimizations) {
        throw new Error("Invalid analysis result format");
      }

      setAnalysis(result);
      onAnalysisComplete?.(result);

      toast({
        title: "Analysis Complete",
        description: `Found ${result.securityIssues.length} security issues and ${result.mantleOptimizations?.length || 0} Mantle-specific optimizations`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze contract",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500 bg-red-500/10";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10";
      case "low":
        return "text-green-500 bg-green-500/10";
      default:
        return "text-blue-500 bg-blue-500/10";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          onClick={analyze}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>Analyzing Contract...</>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Analyze Security & Optimizations
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Security Issues */}
          {analysis.securityIssues?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                  Security Issues
                </CardTitle>
                <CardDescription>
                  Found {analysis.securityIssues.length} potential security issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.securityIssues.map((issue: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{issue.description}</h3>
                      <Badge variant="outline" className={cn("ml-2", getSeverityColor(issue.severity))}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.impact}</p>
                    <div className="text-sm bg-primary/5 p-3 rounded-md">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mantle L2 Optimizations */}
          {analysis.mantleOptimizations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Rocket className="mr-2 h-5 w-5 text-primary" />
                  Mantle L2 Optimizations
                </CardTitle>
                <CardDescription>
                  Suggested optimizations for Mantle network
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.mantleOptimizations.map((opt: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{opt.description}</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {opt.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Potential savings: {opt.potentialSavings}
                    </p>
                    <div className="text-sm bg-primary/5 p-3 rounded-md">
                      <strong>Implementation:</strong> {opt.implementation}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Gas Optimizations */}
          {analysis.optimizations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                  Gas & Performance Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.optimizations.map((opt: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{opt.description}</h3>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        {opt.type}
                      </Badge>
                    </div>
                    {opt.beforeCode && opt.afterCode && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Before:</div>
                          <CodeViewer code={opt.beforeCode} className="max-h-[200px]" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">After:</div>
                          <CodeViewer code={opt.afterCode} className="max-h-[200px]" />
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Estimated improvement: {opt.estimate}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
