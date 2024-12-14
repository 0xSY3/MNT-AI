import React, { useState, useEffect } from "react";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeViewer } from "@/components/ui/code-viewer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTypingEffect } from "@/hooks/use-typing-effect";

interface DecoderResponse {
  contractCode: string;
  summary: string;
  features: string[];
}

async function decodeContract(address: string): Promise<DecoderResponse> {
  const response = await fetch("/api/decoder/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze contract");
  }

  return response.json();
}

export default function Decoder() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [address, setAddress] = useState("");
  const { toast } = useToast();
  const [result, setResult] = useState<DecoderResponse | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const decodeMutation = useMutation({
    mutationFn: decodeContract,
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Contract analysis completed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze contract",
        variant: "destructive",
      });
    },
  });

  const handleDecode = () => {
    if (!address) {
      toast({
        title: "Input Required",
        description: "Please enter a smart contract address",
        variant: "destructive",
      });
      return;
    }

    decodeMutation.mutate(address);
  };

  const { displayedText: displayedSummary } = useTypingEffect(
    result?.summary || "",
    10
  );

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />
      
      <main className="relative z-10 pt-24 pb-20 space-y-6 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full text-sm font-medium 
            bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Analysis 🔍
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Transaction Decoder
          </h1>
          <p className="text-xl text-white/60 max-w-[600px] mx-auto">
            Analyze and understand smart contracts with AI assistance
          </p>
        </div>

        <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Contract Analysis</CardTitle>
            <CardDescription className="text-white/60">
              Enter a smart contract address to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Enter contract address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-8 bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40"
                />
              </div>
              <Button
                onClick={handleDecode}
                disabled={decodeMutation.isPending || !address}
                className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
                  shadow-lg shadow-purple-500/20 transition-all duration-300"
              >
                {decodeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>

            {result && (
              <div className="space-y-4 mt-6">
                <div className="bg-purple-500/5 rounded-lg p-4 space-y-2 border border-purple-500/10">
                  <h3 className="font-medium text-white">Summary</h3>
                  <p className="text-white/80">{displayedSummary}</p>
                </div>

                {result.features?.length > 0 && (
                  <div className="bg-purple-500/5 rounded-lg p-4 space-y-2 border border-purple-500/10">
                    <h3 className="font-medium text-white">Key Features</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.features.map((feature, index) => (
                        <li key={index} className="text-white/80">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.contractCode && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-white">Contract Code</h3>
                    <CodeViewer
                      code={result.contractCode}
                      className="max-h-[400px] bg-purple-500/5 border-purple-500/20"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
