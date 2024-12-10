import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestGeneratorProps {
  contractCode: string;
  onTestsGenerated?: (tests: GeneratedTest[]) => void;
}

interface GeneratedTest {
  name: string;
  description: string;
  code: string;
  type: "unit" | "integration" | "security" | "gas";
  coverage?: {
    functions: string[];
    lines: number;
  };
  expected: {
    result: string;
    gasEstimate?: string;
  };
}

export function TestGenerator({ contractCode, onTestsGenerated }: TestGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const { toast } = useToast();

  const generateTests = async () => {
    if (!contractCode?.trim()) {
      toast({
        title: "No Contract Code",
        description: "Please provide contract code to generate tests",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch("/api/ai/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: contractCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate tests");
      }

      const generatedTests = await response.json();
      setTests(generatedTests);
      onTestsGenerated?.(generatedTests);

      toast({
        title: "Tests Generated",
        description: `Generated ${generatedTests.length} test cases`,
      });
    } catch (error) {
      console.error("Test generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate tests",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case "unit":
        return "bg-blue-500/10 text-blue-500";
      case "integration":
        return "bg-purple-500/10 text-purple-500";
      case "security":
        return "bg-red-500/10 text-red-500";
      case "gas":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Test Suite Generator</h2>
          <p className="text-sm text-muted-foreground">
            Generate comprehensive test cases for your smart contract
          </p>
        </div>
        <Button
          onClick={generateTests}
          disabled={isGenerating || !contractCode}
          className="min-w-[140px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate Tests
            </>
          )}
        </Button>
      </div>

      {tests.length > 0 && (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getTestTypeColor(test.type)}>
                    {test.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <CodeViewer code={test.code} className="max-h-[300px]" />
                  {test.coverage && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {test.coverage.functions.length} Functions Covered
                      </div>
                      <div className="flex items-center text-blue-500">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        {test.coverage.lines}% Line Coverage
                      </div>
                    </div>
                  )}
                  <div className="text-sm bg-muted p-3 rounded-md">
                    <strong>Expected Result:</strong> {test.expected.result}
                    {test.expected.gasEstimate && (
                      <div className="mt-1">
                        <strong>Estimated Gas:</strong> {test.expected.gasEstimate}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
