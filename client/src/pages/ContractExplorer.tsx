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
      const contractData = await getContractCode(address);
      const abi = await getContractABI(address);
      
      setContractCode(contractData.code);
      setContractABI(abi);
      
      // Show appropriate toast message based on verification status
      if (!contractData.verified) {
        toast({
          title: "Contract Connected",
          description: contractData.message,
          variant: "warning"
        });
      } else {
        toast({
          title: "Contract Connected",
          description: "Successfully connected to verified contract",
        });
      }
      
      // Add initial analysis message
      setMessages([
        {
          role: "system",
          content: contractData.verified 
            ? "Connected to verified contract. You can now ask questions about its functionality."
            : "Connected to unverified contract. Analysis will be based on bytecode patterns.",
          timestamp: new Date(),
          type: "text"
        },
        {
          role: "contract",
          content: contractData.code,
          timestamp: new Date(),
          type: "code",
          metadata: {
            verified: contractData.verified,
            message: contractData.message,
            decompiled: contractData.decompiled
          }
        }
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

      // Determine the message type based on content and response type from API
      let responseType: Message['type'] = 'text';
      let responseContent = data.response;
      let metadata = {};

      if (data.type === 'code' || data.response.includes('```')) {
        responseType = 'code';
        // Clean up code blocks if present
        responseContent = data.response.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
      } else if (data.type === 'function') {
        responseType = 'function';
        try {
          const parsedResponse = JSON.parse(data.response);
          metadata = {
            functionName: parsedResponse.functionName,
            params: parsedResponse.params || {},
            gasEstimate: parsedResponse.gasEstimate,
            mantleSpecific: parsedResponse.mantleOptimizations
          };
          responseContent = parsedResponse.description || data.response;
        } catch (e) {
          // If parsing fails, fallback to text format
          responseType = 'text';
        }
      } else if (data.response.toLowerCase().includes('warning') || 
                 data.response.toLowerCase().includes('vulnerability')) {
        responseType = 'warning';
      } else if (data.response.toLowerCase().includes('error') || 
                 data.response.toLowerCase().includes('failed')) {
        responseType = 'error';
      } else if (data.response.toLowerCase().includes('success') || 
                 data.response.toLowerCase().includes('completed')) {
        responseType = 'success';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: responseContent,
          timestamp: new Date(),
          type: responseType,
          metadata,
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
        <Card className="border-primary/20 backdrop-blur-sm bg-background/95">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Contract Chat
            </CardTitle>
            <CardDescription className="text-base">
              Interact with your smart contract through natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Input
                  placeholder="Enter contract address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-4 h-11 transition-all duration-200 border-primary/20 focus:border-primary/40 bg-background/80 backdrop-blur-sm"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              </div>
              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !address}
                className="h-11 px-6 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </div>

            <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gradient-to-b from-background to-background/50">
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } mb-4 animate-in slide-in-from-bottom-2`}
                  >
                    <div
                      className={`max-w-[85%] backdrop-blur-sm transition-all duration-200 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : message.role === "system"
                          ? "bg-yellow-500/10 border border-yellow-500/20 shadow-lg shadow-yellow-500/10"
                          : message.role === "contract"
                          ? "bg-card/95 border border-border shadow-lg"
                          : "bg-card/95 border border-border shadow-lg"
                      } rounded-2xl p-5`}
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
                        <div className="space-y-4 text-foreground">
                          {message.content.split('###').map((section, index) => {
                            if (index === 0) {
                              // Process main content - remove markdown
                              const mainContent = section
                                .trim()
                                .replace(/\*\*/g, '')
                                .replace(/`/g, '');
                              return (
                                <div key={index} className="bg-card/50 rounded-lg p-4">
                                  <p className="text-base leading-relaxed">{mainContent}</p>
                                </div>
                              );
                            }
                            
                            const [title, ...content] = section.split('\n');
                            const processedTitle = title.trim().replace(/\*\*/g, '');
                            
                            return (
                              <div key={index} className="bg-card/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">
                                  {processedTitle}
                                </h3>
                                <div className="space-y-3">
                                  {content.map((paragraph, pIndex) => {
                                    const processedText = paragraph
                                      .trim()
                                      .replace(/\*\*/g, '')
                                      .replace(/`/g, '');
                                    
                                    if (processedText.startsWith('-')) {
                                      return (
                                        <div key={pIndex} className="flex items-start space-x-2 pl-4">
                                          <span className="text-primary">•</span>
                                          <span className="text-sm leading-relaxed flex-1">
                                            {processedText.substring(1).trim()}
                                          </span>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <p key={pIndex} className="text-sm leading-relaxed text-foreground/90">
                                        {processedText}
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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

            <div className="flex gap-3 relative group">
              <Textarea
                placeholder="Ask about the contract or request an action..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="min-h-[100px] pr-14 transition-all duration-200 border-primary/20 focus:border-primary/40 bg-background/80 backdrop-blur-sm resize-none"
              />
              <Button
                className="absolute bottom-3 right-3 h-10 w-10 rounded-full p-0 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim() || !address}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
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
