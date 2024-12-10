import { useState } from "react";
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
  const [address, setAddress] = useState("");
  const { toast } = useToast();
  const [result, setResult] = useState<DecoderResponse | null>(null);

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
        description: "Please enter a contract address or transaction hash",
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
    <div className="space-y-6">
      <div className="relative text-center py-6 space-y-2 hero-pattern rounded-lg">
        <h1 className="text-3xl font-bold tracking-tighter gradient-heading">
          Transaction Decoder
        </h1>
        <p className="text-base text-muted-foreground max-w-[600px] mx-auto">
          Analyze and understand smart contracts with AI assistance
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Contract Analysis</CardTitle>
          <CardDescription>
            Enter a contract address or transaction hash to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter contract address or transaction hash..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              onClick={handleDecode}
              disabled={decodeMutation.isPending || !address}
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
              <div className="bg-card rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Summary</h3>
                <p className="text-muted-foreground">{displayedSummary}</p>
              </div>

              {result.features?.length > 0 && (
                <div className="bg-card rounded-lg p-4 space-y-2">
                  <h3 className="font-medium">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.features.map((feature, index) => (
                      <li key={index} className="text-muted-foreground">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.contractCode && (
                <div className="space-y-2">
                  <h3 className="font-medium">Contract Code</h3>
                  <CodeViewer
                    code={result.contractCode}
                    className="max-h-[400px]"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
