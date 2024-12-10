import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Code2, History, Play, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { useTypingEffect } from "@/hooks/use-typing-effect";
import { getContractCode, getContractABI } from "@/lib/blockchain";

interface Message {
  role: 'user' | 'assistant' | 'contract' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'function' | 'transaction' | 'error' | 'warning' | 'success';
  metadata?: {
    functionName?: string;
    params?: Record<string, any>;
    gasEstimate?: string;
    mantleSpecific?: {
      optimizations?: string[];
      savings?: string;
    };
  };
}

export default function ContractExplorer() {
  const [address, setAddress] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [contractCode, setContractCode] = useState("");
  const [contractABI, setContractABI] = useState<any>(null);

  const handleConnect = async () => {
    if (!address) {
      toast({
        title: "Input Required",
        description: "Please enter a contract address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const code = await getContractCode(address);
      const abi = await getContractABI(address);
      
      setContractCode(code);
      setContractABI(abi);
      
      // Show appropriate toast message based on verification status
      if (code.includes('Not Verified')) {
        toast({
          title: "Contract Connected",
          description: "Contract is not verified. Only bytecode is available.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Contract Connected",
          description: "Successfully connected to verified contract",
        });
      }
      
      setMessages([
        {
          role: "assistant",
          content: "Contract connected successfully! You can now interact with it.",
          timestamp: new Date(),
          type: "text",
        },
        {
          role: "contract",
          content: code,
          timestamp: new Date(),
          type: "code",
        },
      ]);

      toast({
        title: "Contract Connected",
        description: "Successfully connected to the contract",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to contract",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage as Message]);
    setInput("");

    try {
      setIsLoading(true);

      // Send to AI for analysis
      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          contractCode,
          contractABI,
          address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze message");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date(),
          type: (data.type || 'text') as 'text' | 'code' | 'transaction' | 'error',
        },
      ]);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative text-center py-6 space-y-2 hero-pattern rounded-lg">
        <h1 className="text-3xl font-bold tracking-tighter gradient-heading">
          Interactive Contract Explorer
        </h1>
        <p className="text-base text-muted-foreground max-w-[600px] mx-auto">
          Chat with and analyze smart contracts on Mantle network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Contract Chat</CardTitle>
            <CardDescription>
              Interact with your smart contract through natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter contract address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button onClick={handleConnect} disabled={isLoading || !address}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`max-w-[85%] space-y-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.role === "system"
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : message.role === "contract"
                          ? "bg-card border border-border"
                          : "bg-muted"
                      } rounded-lg p-4`}
                    >
                      {message.type === "code" ? (
                        <CodeViewer code={message.content} />
                      ) : message.type === "function" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{message.metadata?.functionName}</h4>
                            {message.metadata?.gasEstimate && (
                              <Badge variant="outline" className="bg-primary/10">
                                Gas: {message.metadata.gasEstimate}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{message.content}</p>
                          {message.metadata?.mantleSpecific?.optimizations && (
                            <div className="bg-primary/5 rounded p-2 mt-2">
                              <p className="text-sm font-medium">Mantle Optimizations:</p>
                              <ul className="list-disc list-inside text-sm">
                                {message.metadata.mantleSpecific.optimizations.map((opt, i) => (
                                  <li key={i}>{opt}</li>
                                ))}
                              </ul>
                              {message.metadata.mantleSpecific.savings && (
                                <p className="text-sm text-primary mt-1">
                                  Potential savings: {message.metadata.mantleSpecific.savings}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : message.type === "warning" ? (
                        <div className="flex items-start space-x-2 text-yellow-500">
                          <AlertTriangle className="h-4 w-4 mt-1" />
                          <p>{message.content}</p>
                        </div>
                      ) : message.type === "error" ? (
                        <div className="flex items-start space-x-2 text-destructive">
                          <XCircle className="h-4 w-4 mt-1" />
                          <p>{message.content}</p>
                        </div>
                      ) : message.type === "success" ? (
                        <div className="flex items-start space-x-2 text-green-500">
                          <CheckCircle className="h-4 w-4 mt-1" />
                          <p>{message.content}</p>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                        <div className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        {message.type === "function" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setInput(`Call ${message.metadata?.functionName} with parameters...`);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Try it
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder="Ask about the contract or request an action..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="min-h-[80px]"
              />
              <Button
                className="self-end"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim() || !address}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Contract Analysis</CardTitle>
            <CardDescription>
              Visualize and understand contract behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractCode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Contract Code</h3>
                    <Badge variant="outline" className={
                      contractCode.includes("not verified") 
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                    }>
                      {contractCode.includes("not verified") ? "Unverified" : "Verified"}
                    </Badge>
                  </div>
                  <CodeViewer 
                    code={contractCode} 
                    className="max-h-[300px]"
                    language={contractCode.includes("not verified") ? "javascript" : "solidity"}
                  />
                </div>
                {contractABI && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Functions</h3>
                    <div className="space-y-2">
                      {contractABI.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 rounded-md border border-border/40 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Code2 className="h-4 w-4 text-primary" />
                              <span className="font-mono text-sm">
                                {item.name}
                              </span>
                            </div>
                            <Badge variant="outline">
                              {item.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Connect to a contract to see its analysis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
