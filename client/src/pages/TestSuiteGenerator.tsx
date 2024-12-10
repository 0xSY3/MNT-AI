import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "@/components/ui/code-viewer";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />
      
      <main className="relative z-10">
        <section className="pt-24 pb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full text-sm font-medium 
                bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Testing 🧪
                </span>
              </div>

              <div className="mb-12 space-y-6">
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight">
                  Test Suite
                  <br />
                  <span className="text-purple-500">
                    Generator
                  </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Generate comprehensive test suites for your smart contracts with AI assistance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                <CardHeader className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Code2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">Contract Input</CardTitle>
                  </div>
                  <CardDescription className="text-white/60">
                    Enter your contract code or provide a contract address to begin analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your smart contract code here..."
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value)}
                    className="font-mono min-h-[400px] bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40"
                  />
                  <Button
                    onClick={generateTests}
                    disabled={isLoading || !contractCode}
                    className="w-full bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 shadow-lg shadow-purple-500/20"
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

              <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Generated Tests</CardTitle>
                  <CardDescription className="text-white/60">
                    View and analyze the AI-generated test suite with detailed coverage metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tests.length === 0 ? (
                      <div className="text-center py-8 text-white/60">
                        No tests generated yet. Paste your contract code and click Generate to start.
                      </div>
                    ) : (
                      tests.map((test, index) => (
                        <Card key={index} className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm transition-all hover:border-purple-500/40 animate-in fade-in-50 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-base font-medium text-white">{test.name}</CardTitle>
                                <CardDescription className="text-sm text-white/60">{test.description}</CardDescription>
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
                              <div className="text-sm bg-purple-500/10 p-3 rounded-md border border-purple-500/20">
                                <strong className="text-white">Expected Result:</strong>{" "}
                                <span className="text-white/80">{test.expected.result}</span>
                                {test.expected.gasEstimate && (
                                  <div className="mt-1">
                                    <strong className="text-white">Estimated Gas:</strong>{" "}
                                    <span className="text-white/80">{test.expected.gasEstimate}</span>
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
        </section>
      </main>
    </div>
  );
}