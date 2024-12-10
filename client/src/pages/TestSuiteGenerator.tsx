import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Code2, TestTube2, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";

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

export default function TestSuiteGenerator() {
  const [contractCode, setContractCode] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
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
      setIsLoading(false);
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
    <div className="space-y-8">
      <div className="relative text-center py-12 space-y-4 hero-pattern rounded-lg border border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)] dark:bg-grid-white/10" />
        <div className="relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            AI-Powered Test Suite Generator
          </h1>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Generate comprehensive test suites for your smart contracts with advanced AI assistance
        </p>
        <div className="flex gap-2 justify-center text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            Unit Tests
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
            Integration Tests
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
            Security Tests
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-1" />
            Gas Optimization
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/20 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Code2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Contract Input</CardTitle>
            </div>
            <CardDescription className="text-base">
              Enter your contract code or provide a contract address to begin analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="code">
              <TabsList className="mb-4">
                <TabsTrigger value="code">Contract Code</TabsTrigger>
                <TabsTrigger value="address">Contract Address</TabsTrigger>
              </TabsList>

              <TabsContent value="code">
                <Textarea
                  placeholder="Paste your smart contract code here..."
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  className="font-mono min-h-[400px]"
                />
              </TabsContent>

              <TabsContent value="address">
                <div className="space-y-4">
                  <Input
                    placeholder="Enter contract address..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                  />
                  <Button 
                    variant="secondary"
                    className="w-full"
                    disabled={!contractAddress}
                    onClick={() => {/* TODO: Implement contract fetching */}}
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    Fetch Contract Code
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={generateTests}
              disabled={isLoading || !contractCode}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Tests...
                </>
              ) : (
                <>
                  <TestTube2 className="mr-2 h-4 w-4" />
                  Generate Test Suite
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TestTube2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Generated Tests</CardTitle>
            </div>
            <CardDescription className="text-base">
              View and analyze the AI-generated test suite with detailed coverage metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tests generated yet. Paste your contract code and click Generate to start.
                </div>
              ) : (
                tests.map((test, index) => (
                  <Card key={index} className="overflow-hidden border-primary/10 transition-all hover:shadow-md hover:border-primary/20 animate-in fade-in-50 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-medium">{test.name}</CardTitle>
                          <CardDescription className="text-sm">{test.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className={`${getTestTypeColor(test.type)} transition-colors`}>
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
