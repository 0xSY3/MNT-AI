import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  category: string;
  userId: number;
  createdAt: string;
}

export default function Forum() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      category: "general"
    }
  });

  const { data: posts, isLoading } = useQuery<ForumPost[]>({
    queryKey: ["forum-posts"],
    queryFn: async () => {
      const response = await fetch("/api/forum/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });

  const createPost = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string }) => {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast({ title: "Post created", description: "Your post has been published successfully." });
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
                  Community Discussions 💬
                </span>
              </div>

              <div className="mb-12 space-y-6">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Community Forum
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Connect with other developers, share insights, and get help
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
                    shadow-lg shadow-purple-500/20 transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-purple-900/90 border-purple-500/20 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Post</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createPost.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Title</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Content</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-purple-500/10 border-purple-500/20 text-white placeholder:text-white/40" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={createPost.isPending}
                        className="w-full bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
                          shadow-lg shadow-purple-500/20 transition-all duration-300"
                      >
                        {createPost.isPending ? "Posting..." : "Create Post"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="grid gap-6">
                {posts?.map((post) => (
                  <Card key={post.id} className="border-purple-500/20 bg-purple-900/10 backdrop-blur-sm 
                    hover:border-purple-500/40 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-white">{post.title}</CardTitle>
                      <CardDescription className="text-white/60">
                        Posted on {format(new Date(post.createdAt), "PPP")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 mb-4">{post.content}</p>
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply
                        </Button>
                        <span className="text-sm text-white/60">
                          Category: {post.category}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
