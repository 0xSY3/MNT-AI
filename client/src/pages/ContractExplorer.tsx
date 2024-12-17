import { useState } from "react";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Code2, History, Play, AlertTriangle, XCircle, CheckCircle, Bot, User } from "lucide-react";
import { useTypingEffect } from "@/hooks/use-typing-effect";
import { getContractCode, getContractABI } from "@/lib/blockchain";

// Import ContractData interface
import type { ContractData } from "@/lib/blockchain";

interface Message {
  role: 'user' | 'assistant' | 'contract' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'function' | 'transaction' | 'error' | 'warning' | 'success';
  metadata?: {
    functionName?: string;
    params?: Record<string, any>;
    gasEstimate?: string;
    verified?: boolean;
    message?: string;
    decompiled?: string;
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
  const [isVerified, setIsVerified] = useState(false);
  const [decompiled, setDecompiled] = useState<string | undefined>();

  const handleConnect = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const contractData = await getContractCode(address);
      const abi = await getContractABI(address);
      
      setContractCode(contractData.code);
      setContractABI(abi);
      setIsVerified(contractData.verified);
      setDecompiled(contractData.decompiled);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Connected to contract at ${address}`,
        timestamp: new Date(),
        type: 'success'
      }]);
      
      if (!contractData.verified) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Contract is not verified. Some features may be limited.',
          timestamp: new Date(),
          type: 'warning'
        }]);
      }
    } catch (error) {
      toast({
        title: "Error connecting to contract",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: error instanceof Error ? error.message : "Failed to connect to contract",
        timestamp: new Date(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !address || !contractCode) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          contractCode,
          contractABI,
          address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error processing request",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: error instanceof Error ? error.message : "Failed to process request",
        timestamp: new Date(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar />
      
      <main className="relative z-10 pt-20 sm:pt-24 pb-16 sm:pb-20 space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full text-sm font-medium 
            bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Analysis 🤖
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent leading-tight">
            Interactive Contract Explorer
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-[600px] mx-auto">
            Chat with and analyze smart contracts on Mantle network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
            <CardHeader className="space-y-1 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Contract Chat
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-white/60">
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
                    className="pl-4 h-11 transition-all duration-200 border-purple-500/20 focus:border-purple-500/40 bg-purple-900/20 backdrop-blur-sm text-white placeholder:text-white/40"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                </div>
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading || !address}
                  className="h-11 px-6 bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 shadow-lg shadow-purple-500/20 transition-all duration-200"
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

              <div className="relative rounded-lg border border-purple-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {messages.filter(msg => msg.content?.trim()).map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-2 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        } animate-in slide-in-from-bottom-2`}
                      >
                        {message.role !== "user" && (
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                            {message.role === "assistant" ? (
                              <Bot className="w-4 h-4 text-purple-400" />
                            ) : message.role === "system" ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <Code2 className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === "user"
                            ? "bg-purple-600/90 text-white ml-auto"
                            : message.role === "system"
                            ? "bg-yellow-500/10 border border-yellow-500/20"
                            : "bg-purple-900/40 border border-purple-500/20"
                        }`}>
                          {message.type === "code" ? (
                            <div className="h-[300px] rounded-lg overflow-hidden border border-purple-500/20">
                              <CodeViewer 
                                code={message.content} 
                                language={isVerified ? "solidity" : "javascript"}
                              />
                            </div>
                          ) : message.type === "function" ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-purple-200">{message.metadata?.functionName}</h4>
                                {message.metadata?.gasEstimate && (
                                  <Badge variant="outline" className="bg-purple-500/10 text-purple-200 border-purple-500/20">
                                    Gas: {message.metadata.gasEstimate}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-white/80">{message.content}</p>
                              {message.metadata?.mantleSpecific?.optimizations && (
                                <div className="bg-purple-500/10 rounded-lg p-3 mt-2 border border-purple-500/20">
                                  <p className="text-sm font-medium text-purple-200">Mantle Optimizations:</p>
                                  <ul className="list-disc list-inside text-sm text-white/80 mt-1">
                                    {message.metadata.mantleSpecific.optimizations.map((opt: string, i: number) => (
                                      <li key={i}>{opt}</li>
                                    ))}
                                  </ul>
                                  {message.metadata.mantleSpecific.savings && (
                                    <p className="text-sm text-purple-300 mt-2">
                                      Potential savings: {message.metadata.mantleSpecific.savings}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : message.type === "warning" ? (
                            <div className="flex items-start space-x-2 text-yellow-400">
                              <AlertTriangle className="h-4 w-4 mt-1 flex-shrink-0" />
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ) : message.type === "error" ? (
                            <div className="flex items-start space-x-2 text-red-400">
                              <XCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ) : message.type === "success" ? (
                            <div className="flex items-start space-x-2 text-green-400">
                              <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ) : (
                            <div className="space-y-3 text-white/90">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-500/20">
                            <div className="text-xs text-white/40">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                            {message.type === "function" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs hover:bg-purple-500/20 text-purple-200"
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
                        
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="relative">
                <Textarea
                  placeholder="Ask about the contract or request an action..."
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="min-h-[100px] pr-14 bg-purple-900/20 border-purple-500/20 focus:border-purple-500/40 text-white placeholder:text-white/40 resize-none rounded-xl"
                />
                <Button
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-full p-0 bg-purple-600 hover:bg-purple-500 transition-all duration-200"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim() || !address}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Contract Analysis
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-white/60">
                Visualize and understand contract behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractCode ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-white/80">Contract Code</h3>
                      <Badge variant="outline" className={
                        isVerified 
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }>
                        {isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <div className="relative rounded-lg border border-purple-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
                      <CodeViewer 
                        code={isVerified ? contractCode : (decompiled || contractCode)} 
                        className="h-[calc(100vh-400px)] min-h-[400px]"
                        language={isVerified ? "solidity" : "javascript"}
                      />
                    </div>
                  </div>
                  {contractABI && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-white/80">Available Functions</h3>
                      <div className="space-y-2">
                        {contractABI.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-purple-500/20 bg-purple-900/20 hover:border-purple-500/40 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Code2 className="h-4 w-4 text-purple-400" />
                                <span className="font-mono text-sm text-white/80">
                                  {item.name}
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-200 border-purple-500/20">
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
                <div className="text-center py-8 text-white/40">
                  Connect to a contract to see its analysis
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
