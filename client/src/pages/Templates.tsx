import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileCode, ArrowRight } from "lucide-react";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  code: string;
}

export default function Templates() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    }
  });

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = templates ? Array.from(new Set(templates.map(t => t.category))) : [];

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />
      
      <main className="relative z-10 pt-24 pb-20 space-y-6 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full text-sm font-medium 
            bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Smart Contract Library 📚
            </span>
          </div>
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight">
              Smart Contract
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Templates
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore and use pre-built smart contract templates for your decentralized applications
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-background/80 backdrop-blur-sm border-primary/20"
            />
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 border-primary/20 backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant="ghost"
                      className="w-full justify-start hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates?.map((template) => (
                <Card key={template.id} className="border-primary/20 backdrop-blur-sm bg-background/95 hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader>
                    <CardTitle className="flex items-center bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                      <FileCode className="mr-2 h-5 w-5 text-primary" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-white/60">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">
                        {template.category}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary group-hover:translate-x-1 transition-all duration-300"
                      >
                        Use Template <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
