import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface TypingState {
  isTyping: boolean;
  text: string;
  fullText: string;
}

export default function MNTAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m MNT AI, your Mantle ecosystem assistant. How can I help you today? You can ask me about:\n- Mantle Network features\n- Layer 2 scaling solutions\n- Smart contract development\n- Network statistics and performance'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState<TypingState>({
    isTyping: false,
    text: '',
    fullText: ''
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing.text]);

  useEffect(() => {
    if (typing.isTyping && typing.text !== typing.fullText) {
      const timeout = setTimeout(() => {
        setTyping(prev => ({
          ...prev,
          text: prev.fullText.slice(0, prev.text.length + 3)
        }));
      }, 10);
      return () => clearTimeout(timeout);
    } else if (typing.isTyping && typing.text === typing.fullText) {
      setTyping(prev => ({ ...prev, isTyping: false }));
      setMessages(prev => [...prev, { role: 'assistant', content: typing.fullText }]);
    }
  }, [typing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setTyping({
        isTyping: true,
        text: '',
        fullText: data.message
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col bg-purple-900/10 border-purple-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-400/20 to-purple-600/20">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            MNT AI Assistant
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col h-full space-y-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'assistant' 
                      ? 'bg-purple-500/10 text-white'
                      : 'bg-purple-600 text-white'
                  } rounded-lg p-3`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 mt-1 flex-shrink-0" />
                  )}
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {typing.isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%] bg-purple-500/10 text-white rounded-lg p-3">
                  <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {typing.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Mantle Network..."
            className="flex-1 bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
