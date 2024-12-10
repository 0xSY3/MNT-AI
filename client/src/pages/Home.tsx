import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, BarChart2, FileCode, Users, TestTubeIcon } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="relative text-center py-16 space-y-6 hero-pattern">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl gradient-heading">
            Web3 Development Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Build, deploy, and optimize smart contracts with AI assistance on the Mantle network
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/contract-builder">
          <Card className="feature-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <span>Contract Builder</span>
              </CardTitle>
              <CardDescription>
                AI-powered smart contract development with visual tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/decoder">
          <Card className="retro-card bounce-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code2 className="mr-2 h-6 w-6 text-primary" />
                Transaction Decoder
              </CardTitle>
              <CardDescription>
                Analyze and understand smart contracts with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full hover:text-primary hover:bg-primary/5">
                Decode Contract <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="retro-card bounce-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCode className="mr-2 h-6 w-6 text-primary" />
                Templates
              </CardTitle>
              <CardDescription>
                Pre-built smart contract templates and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full hover:text-primary hover:bg-primary/5">
                Browse Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/explorer">
          <Card className="retro-card bounce-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-6 w-6 text-primary" />
                Contract Explorer
              </CardTitle>
              <CardDescription>
                Chat with and analyze deployed contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full hover:text-primary hover:bg-primary/5">
                Explore Contracts <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/test-suite">
          <Card className="retro-card bounce-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTubeIcon className="mr-2 h-6 w-6 text-primary" />
                Test Suite Generator
              </CardTitle>
              <CardDescription>
                AI-powered smart contract test generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full hover:text-primary hover:bg-primary/5">
                Generate Tests <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/forum">
          <Card className="retro-card bounce-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Community
              </CardTitle>
              <CardDescription>
                Connect with other developers and get help
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full hover:text-primary hover:bg-primary/5">
                Join Discussion <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
