import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ContractEditor from "@/components/ContractEditor";
import DataVisualization from "@/components/DataVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityAnalyzer } from "@/components/SecurityAnalyzer";
import { TestGenerator } from "@/components/TestGenerator";
import {
  GridBackground,
  ScrollLines,
  FloatingParticles,
} from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Code2, ShieldCheck, TestTubes } from "lucide-react";
import { CodeViewer } from "@/components/ui/code-viewer";

export default function ContractBuilder() {
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures((prev) => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const generateContract = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          features,
          contractType: "standard",
        }),
      });

      let errorText;
      let responseData;

      try {
        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || "Failed to generate contract");
        }
        if (!responseData.code) {
          throw new Error("No contract code received from the API");
        }
        return responseData;
      } catch (error) {
        if (!response.ok) {
          errorText = await response.text();
          throw new Error(errorText || "Failed to generate contract");
        }
        console.error("Response parsing error:", error);
        throw new Error("Failed to parse the generated contract");
      }
    },
    onSuccess: (data) => {
      setCode(data.code);
      toast({
        title: "Contract Generated",
        description:
          "Smart contract has been generated with Mantle L2 optimizations.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate contract",
        variant: "destructive",
      });
    },
  });

  const compileContract = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/compile-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Compilation failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compilation Successful",
        description: "Smart contract compiled without errors.",
      });
    },
    onError: (error) => {
      toast({
        title: "Compilation Failed",
        description:
          error instanceof Error ? error.message : "Unknown compilation error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />

      <main className="relative z-10">
        <section className="pt-16 pb-10">
          {" "}
          {/* Adjusted padding */}
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-6">
              {" "}
              {/* Reduced margin */}
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Contract Builder
                </span>
              </h1>
              <p className="text-base text-gray-400">
                Build secure smart contracts with AI assistance on Mantle
                Network
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Contract Requirements
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Describe your smart contract requirements (use "-" for
                      features)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">
                        Contract Description
                      </label>
                      <Textarea
                        placeholder="Enter your contract requirements..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-[120px] bg-purple-500/10 border-purple-500/20 text-white 
                          placeholder:text-white/40 resize-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white">
                          Features (Optional)
                        </label>
                        <p className="text-xs text-white/60 mt-1">
                          Add custom features for your smart contract
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter a feature..."
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addFeature()}
                          className="bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40"
                        />
                        <Button
                          onClick={addFeature}
                          disabled={!newFeature.trim()}
                          className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
                            shadow-lg shadow-purple-500/20"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-purple-500/10 text-white border-purple-500/20 px-2 py-1 
                              flex items-center space-x-2"
                          >
                            <span>{feature}</span>
                            <button
                              onClick={() => removeFeature(index)}
                              className="hover:text-purple-300 transition-colors"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => generateContract.mutate()}
                      disabled={!description || generateContract.isPending}
                      className="w-full bg-purple-600/90 text-white hover:bg-purple-500 
                        border border-purple-500/30 shadow-lg shadow-purple-500/20"
                    >
                      <Code2 className="mr-2 h-4 w-4" />
                      {generateContract.isPending
                        ? "Generating..."
                        : "Generate Contract"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="security" className="space-y-4">
                      <TabsList className="bg-purple-500/10 border border-purple-500/20">
                        <TabsTrigger
                          value="security"
                          className="data-[state=active]:bg-purple-500"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Security
                        </TabsTrigger>
                        <TabsTrigger
                          value="tests"
                          className="data-[state=active]:bg-purple-500"
                        >
                          <TestTubes className="mr-2 h-4 w-4" />
                          Tests
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="security">
                        <SecurityAnalyzer code={code} />
                      </TabsContent>
                      <TabsContent value="tests">
                        <TestGenerator contractCode={code} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Generated Contract
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Edit your generated smart contract code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <CodeViewer
                        code={code}
                        className="min-h-[400px] max-h-[600px]"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => compileContract.mutate()}
                          disabled={!code || compileContract.isPending}
                          className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30"
                        >
                          {compileContract.isPending
                            ? "Compiling..."
                            : "Compile Contract"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Contract Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataVisualization
                      data={[
                        { timestamp: new Date(), value: Math.random() * 100 },
                        { timestamp: new Date(), value: Math.random() * 100 },
                      ]}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
