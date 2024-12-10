import { useState, useEffect } from "react";
import { useTypingEffect } from "@/hooks/use-typing-effect";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash, Tag, Shield, Coins, Database } from "lucide-react";
import { generateContract, analyzeCode } from "@/lib/ai";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Badge } from "@/components/ui/badge";
import { SecurityAnalyzer } from "@/components/SecurityAnalyzer";
import { TestGenerator } from "@/components/TestGenerator";

export default function ContractBuilder() {
  const [description, setDescription] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<Array<{
    id: string;
    type: "function" | "event" | "state" | "modifier";
    text: string;
    description?: string;
  }>>([]);
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: generateContract,
    onSuccess: (data) => {
      try {
        let cleanCode = data.code || '';
        
        // Ensure proper formatting and remove any unwanted markers
        cleanCode = cleanCode.trim();
        
        // Only clean markdown if present
        if (cleanCode.includes('```')) {
          cleanCode = cleanCode
            .replace(/^```solidity\n/gm, '')
            .replace(/^```\n/gm, '')
            .replace(/```$/gm, '')
            .trim();
        }
        
        // Add SPDX and pragma if missing
        if (!cleanCode.includes('SPDX-License-Identifier')) {
          cleanCode = '// SPDX-License-Identifier: MIT\n' + cleanCode;
        }
        if (!cleanCode.includes('pragma solidity')) {
          cleanCode = cleanCode.replace(/^/, 'pragma solidity ^0.8.19;\n\n');
        }
        
        setCode(cleanCode);
        toast({
          title: "Contract Generated",
          description: "Smart contract generated successfully with Mantle L2 optimizations"
        });
      } catch (error) {
        console.error('Error processing generated code:', error);
        toast({
          title: "Processing Error",
          description: "Failed to process the generated contract code",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Contract generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate contract",
        variant: "destructive"
      });
    }
  });

  const analysisMutation = useMutation({
    mutationFn: analyzeCode,
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `Found ${data.suggestions.length} suggestions and ${data.securityIssues.length} security issues.`
      });
    }
  });

  const featureTypes = [
    { 
      type: "function",
      label: "Function",
      description: "Add a new contract function",
      icon: <Tag className="h-4 w-4" />
    },
    { 
      type: "event",
      label: "Event",
      description: "Add an event to track state changes",
      icon: <Coins className="h-4 w-4" />
    },
    { 
      type: "state",
      label: "State Variable",
      description: "Add a contract state variable",
      icon: <Database className="h-4 w-4" />
    },
    { 
      type: "modifier",
      label: "Modifier",
      description: "Add a function modifier",
      icon: <Shield className="h-4 w-4" />
    }
  ];

  type FeatureType = "function" | "event" | "state" | "modifier";
  const [selectedFeatureType, setSelectedFeatureType] = useState<FeatureType>("function");

  const addFeature = () => {
    if (featureInput.trim()) {
      const featureType = featureTypes.find(f => f.type === selectedFeatureType);
      setFeatures([...features, {
        id: Math.random().toString(36).substring(7),
        type: selectedFeatureType,
        text: featureInput.trim(),
        description: `${featureType?.label}: ${featureInput.trim()}`
      }]);
      setFeatureInput("");
    }
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const getFeatureIcon = (type: "function" | "event" | "state" | "modifier") => {
    const featureType = featureTypes.find(f => f.type === type);
    return featureType?.icon;
  };

  const handleGenerateContract = () => {
    if (!description) {
      toast({
        title: "Input Required",
        description: "Please provide a contract description",
        variant: "destructive"
      });
      return;
    }

    generateMutation.mutate({
      description,
      features: features.map(f => f.text)
    });
  };

  return (
    <div className="space-y-8">
      <div className="relative text-center py-6 space-y-2 hero-pattern rounded-lg mb-4">
        <h1 className="text-3xl font-bold tracking-tighter gradient-heading">
          Smart Contract Builder
        </h1>
        <p className="text-base text-muted-foreground max-w-[600px] mx-auto">
          Build secure smart contracts with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-lg h-full flex flex-col">
            <CardHeader className="flex-none">
              <CardTitle>Contract Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-auto px-4 py-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your smart contract's purpose and functionality..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-[80px]"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Contract Features</label>
                  <p className="text-sm text-muted-foreground">Add functions, events, storage variables, and security features</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {featureTypes.map((featureType) => (
                      <Button
                        key={featureType.type}
                        variant={selectedFeatureType === featureType.type ? "default" : "outline"}
                        className="flex-1 h-10"
                        onClick={() => setSelectedFeatureType(featureType.type as FeatureType)}
                        title={featureType.description}
                      >
                        <div className="flex items-center space-x-2">
                          {featureType.icon}
                          <span>{featureType.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Add ${featureTypes.find(f => f.type === selectedFeatureType)?.label.toLowerCase()}...`}
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addFeature()}
                    />
                    <Button 
                      variant="default"
                      onClick={addFeature}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {features.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No features added yet. Start by selecting a type and adding your first feature.
                      </div>
                    ) : (
                      features.map((feature) => (
                        <div 
                          key={feature.id} 
                          className="group bg-card hover:bg-accent/50 rounded-lg p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {getFeatureIcon(feature.type)}
                              </div>
                              <div>
                                <div className="font-medium">{feature.text}</div>
                                <div className="text-sm text-muted-foreground">
                                  {featureTypes.find(f => f.type === feature.type)?.label}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFeature(feature.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateContract}
                disabled={generateMutation.isPending || !description}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Contract"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 shadow-lg h-full flex flex-col">
          <CardHeader className="flex-none">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-primary">Generated Contract</span>
              {code && <Badge variant="secondary" className="ml-2">Preview</Badge>}
            </CardTitle>
            <CardDescription>
              Your AI-generated smart contract will appear here with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="space-y-4">
              <div className="relative">
                {(() => {
                  const { displayedText, isTyping } = useTypingEffect(code || "", 5);
                  return (
                    <>
                      <CodeViewer 
                        code={code ? displayedText : "// Your generated contract will appear here..."} 
                        className="h-[400px] border border-border"
                      />
                      {isTyping && (
                        <div className="absolute bottom-4 right-4">
                          <span className="inline-block px-3 py-1 text-xs bg-primary/10 text-primary rounded-full animate-pulse">
                            Generating...
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {code && (
                <div className="px-4 pb-4 space-y-6">
                  <SecurityAnalyzer 
                    code={code} 
                    onAnalysisComplete={(analysis) => {
                      toast({
                        title: "Analysis Complete",
                        description: `Found ${analysis.securityIssues?.length || 0} security issues and ${analysis.mantleOptimizations?.length || 0} Mantle-specific optimizations`
                      });
                    }}
                  />
                  
                  <TestGenerator 
                    contractCode={code}
                    onTestsGenerated={(tests) => {
                      toast({
                        title: "Tests Generated",
                        description: `Generated ${tests.length} test cases for your contract`
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
