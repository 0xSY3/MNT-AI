import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { MANTLE_TESTNET_CONFIG } from "@/config/mantle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ContractEditor from "@/components/ContractEditor";
import DataVisualization from "@/components/DataVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecurityAnalyzer from "@/components/SecurityAnalyzer";
import TestGenerator from "@/components/TestGenerator";
import { connectWallet, compileContract, estimateGas, deployContract } from "@/lib/mantle";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Code2, ShieldCheck, TestTubes, Wallet, Rocket, Timer, Loader2, CheckCircle, FileCode } from "lucide-react";
import { CodeViewer } from "@/components/ui/code-viewer";

export default function ContractBuilder() {
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Listen for wallet connection changes
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        try {
          const accounts = await provider.listAccounts();
          setWalletAddress(accounts[0]?.address || null);
        } catch (error) {
          console.error("Error checking wallet:", error);
          setWalletAddress(null);
        }
      }
    };

    checkWallet();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setWalletAddress(accounts[0] || null);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  const [compiledContract, setCompiledContract] = useState<{ abi: any[]; bytecode: string } | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");
  const [gasEstimate, setGasEstimate] = useState<{ estimated: string; breakdown: { deployment: string; execution: string } } | null>(null);

  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const generateContract = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          features,
          contractType: "standard"
        })
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
        description: "Smart contract has been generated with Mantle L2 optimizations."
      });
    },
    onError: (error) => {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate contract",
        variant: "destructive"
      });
    }
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) {
        throw new Error("No contract code to compile");
      }
      // Reset states
      setCompiledContract(null);
      setGasEstimate(null);
      
      // Compile the contract
      const result = await compileContract(code);
      if (!result || !result.abi || !result.bytecode) {
        throw new Error("Invalid compilation result");
      }
      
      setCompiledContract(result);
      
      // Estimate gas if wallet is connected
      if (walletAddress) {
        try {
          const estimate = await estimateGas({
            code,
            abi: result.abi,
            bytecode: result.bytecode
          });
          setGasEstimate(estimate);
        } catch (error) {
          console.error("Gas estimation error:", error);
          // Don't throw here, as compilation was successful
        }
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Compilation Successful",
        description: "Smart contract compiled without errors."
      });
    },
    onError: (error) => {
      setCompiledContract(null);
      setGasEstimate(null);
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Unknown compilation error",
        variant: "destructive"
      });
    }
  });

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
                  AI-Powered Smart Contracts 🚀
                </span>
              </div>

              <div className="mb-12 space-y-6">
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight">
                  Smart Contract
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Builder
                  </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Build secure smart contracts with AI assistance on Mantle Network
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6">
                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader className="space-y-2 p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl text-white">Contract Requirements</CardTitle>
                    <CardDescription className="text-sm sm:text-base text-white/60">
                      Describe your smart contract requirements (use "-" for features)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 sm:p-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/80">Contract Description</label>
                      <Textarea 
                        placeholder="Enter your contract requirements..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[120px] sm:min-h-[150px] bg-purple-500/10 border-purple-500/20 
                          text-white placeholder:text-white/40 resize-none focus:border-purple-500/40 
                          transition-colors"
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white/80">Features (Optional)</label>
                        <p className="text-xs text-white/60 mt-1">Add custom features for your smart contract</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                        <Input
                          placeholder="Enter a feature..."
                          value={newFeature}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeature(e.target.value)}
                          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addFeature()}
                          className="flex-1 bg-purple-500/10 border-purple-500/20 text-white 
                            placeholder:text-white/40 focus:border-purple-500/40 transition-colors"
                        />
                        <Button
                          onClick={addFeature}
                          disabled={!newFeature.trim()}
                          className="sm:w-auto w-full bg-purple-600/90 text-white hover:bg-purple-500 
                            border border-purple-500/30 shadow-lg shadow-purple-500/20 transition-all 
                            duration-200 hover:scale-[1.02]"
                        >
                          Add Feature
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto 
                        scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent 
                        pr-2">
                        {features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-purple-500/10 text-white border-purple-500/20 px-3 py-1.5 
                              flex items-center space-x-2 text-sm"
                          >
                            <span>{feature}</span>
                            <button
                              onClick={() => removeFeature(index)}
                              className="hover:text-purple-300 transition-colors ml-2"
                              aria-label="Remove feature"
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
                        border border-purple-500/30 shadow-lg shadow-purple-500/20 
                        transition-all duration-200 hover:scale-[1.02] h-12"
                    >
                      <Code2 className="mr-2 h-5 w-5" />
                      {generateContract.isPending ? "Generating Contract..." : "Generate Smart Contract"}
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
                        <TabsTrigger value="security" className="data-[state=active]:bg-purple-500">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Security
                        </TabsTrigger>
                        <TabsTrigger value="tests" className="data-[state=active]:bg-purple-500">
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
                    <CardTitle className="text-white">Contract Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative rounded-lg border border-purple-500/20 bg-black/40 backdrop-blur-sm">
                        <CodeViewer
                          code={code}
                          className="h-[calc(100vh-400px)] min-h-[400px]"
                          language="solidity"
                        />
                      </div>
                      {gasEstimate && (
                        <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-900/10">
                          <div className="flex items-center mb-2">
                            <Timer className="mr-2 h-4 w-4 text-purple-400" />
                            <h4 className="text-sm font-medium text-purple-400">Estimated Gas</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-white/60">Deployment</p>
                              <p className="font-mono">{gasEstimate.breakdown.deployment} gas</p>
                            </div>
                            <div>
                              <p className="text-white/60">Execution</p>
                              <p className="font-mono">{gasEstimate.breakdown.execution} gas</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => compileMutation.mutate()}
                          disabled={!code || compileMutation.isPending}
                          className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30"
                        >
                          {compileMutation.isPending ? "Compiling..." : "Compile Contract"}
                        </Button>
                        {compiledContract && (
                          <Button
                            onClick={async () => {
                              if (!compiledContract || !compiledContract.abi || !compiledContract.bytecode) {
                                toast({
                                  title: "Compilation Required",
                                  description: "Please compile the contract before deploying",
                                  variant: "destructive",
                                });
                                return;
                              }

                              try {
                                setIsDeploying(true);
                                const constructorAbi = compiledContract.abi.find(item => item.type === 'constructor');
                                
                                let constructorArgs: any[] = [];
                                
                                if (constructorAbi && constructorAbi.inputs && constructorAbi.inputs.length > 0) {
                                  constructorArgs = constructorAbi.inputs.map((input: { type: string }) => {
                                    switch (input.type) {
                                      case 'address':
                                        return walletAddress || ethers.ZeroAddress;
                                      case 'uint256':
                                      case 'uint':
                                        return 0;
                                      case 'bool':
                                        return false;
                                      case 'string':
                                        return '';
                                      default:
                                        if (input.type.includes('[]')) {
                                          return [];
                                        }
                                        return ethers.ZeroAddress;
                                    }
                                  });
                                }

                                console.log("Deploying contract with constructor args:", constructorArgs);

                                const result = await deployContract({
                                  abi: compiledContract.abi,
                                  bytecode: compiledContract.bytecode,
                                  constructorArgs
                                });
                                
                                setDeployedAddress(result.address);
                                toast({
                                  title: "Contract Deployed Successfully",
                                  description: `Deployed to Mantle Testnet at ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
                                });
                                
                                try {
                                  await fetch('/api/contracts', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      address: result.address,
                                      network: 'mantle-testnet',
                                      transactionHash: result.transactionHash,
                                      abi: compiledContract.abi,
                                      constructorArgs,
                                    }),
                                  });
                                } catch (dbError) {
                                  console.error("Failed to save contract:", dbError);
                                }
                              } catch (error: any) {
                                console.error("Deployment error:", error);
                                let errorMessage = error.message || "Failed to deploy contract";
                                
                                if (errorMessage.includes("insufficient funds")) {
                                  errorMessage = "Insufficient funds in wallet for deployment. Please add MNT to your wallet.";
                                } else if (errorMessage.includes("user rejected")) {
                                  errorMessage = "Transaction was rejected by user.";
                                } else if (errorMessage.includes("constructor arguments")) {
                                  errorMessage = "Invalid constructor arguments. Using default values for deployment.";
                                }
                                
                                toast({
                                  title: "Deployment Failed",
                                  description: errorMessage,
                                  variant: "destructive",
                                });
                              } finally {
                                setIsDeploying(false);
                              }
                            }}
                            disabled={isDeploying}
                            className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30"
                          >
                            {isDeploying ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deploying...
                              </>
                            ) : deployedAddress ? (
                              <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Deployed
                              </>
                            ) : (
                              <>
                                <Rocket className="mr-2 h-5 w-5" />
                                Deploy to Mantle
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Contract Metrics</CardTitle>
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
