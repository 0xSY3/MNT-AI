import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, BarChart2, FileCode, Shield, TestTubeIcon, Brain, Zap } from "lucide-react";
import { Link } from "wouter";

import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";

interface FeatureCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
}

// Card Components
const FeatureCard = ({ href, icon: Icon, title, description, buttonText }: FeatureCardProps) => (
  <Link href={href}>
    <Card className="h-full bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm 
      hover:-translate-y-1 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-400/20 to-purple-600/20">
            <Icon className="h-6 w-6 text-purple-400" />
          </div>
          <span className="font-semibold text-white/90">
            {title}
          </span>
        </CardTitle>
        <CardDescription className="text-white/60">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
          shadow-lg shadow-purple-500/20 transition-all duration-300">
          {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  </Link>
);

interface StatCardProps {
  value: string;
  label: string;
  icon: React.ElementType;
}

const StatCard = ({ value, label, icon: Icon }: StatCardProps) => (
  <div className="p-6 rounded-2xl bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm 
    hover:scale-105 transition-all duration-300">
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-6 h-6 text-purple-400" />
        <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-purple-600 
          bg-clip-text text-transparent">
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-300 font-medium">{label}</p>
    </div>
  </div>
);

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      href: "/contract-builder",
      icon: Code2,
      title: "Contract Builder",
      description: "AI-powered smart contract development with visual tools",
      buttonText: "Get Started"
    },
    {
      href: "/decoder",
      icon: Code2,
      title: "Transaction Decoder",
      description: "Analyze and understand smart contracts with AI",
      buttonText: "Decode Contract"
    },
    {
      href: "/templates",
      icon: FileCode,
      title: "Templates",
      description: "Pre-built smart contract templates and patterns",
      buttonText: "Browse Templates"
    },
    {
      href: "/explorer",
      icon: BarChart2,
      title: "Contract Explorer",
      description: "Chat with and analyze deployed contracts",
      buttonText: "Explore Contracts"
    },
    {
      href: "/test-suite",
      icon: TestTubeIcon,
      title: "Test Suite Generator",
      description: "AI-powered smart contract test generation",
      buttonText: "Generate Tests"
    },
    {
      href: "/assistant",
      icon: Brain,
      title: "MNT AI Assistant",
      description: "Get instant help with Mantle development",
      buttonText: "Chat Now"
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full text-sm font-medium 
                bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Powered by AI 🚀
                </span>
              </div>

              <div className="mb-12 space-y-6">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight">
                  Smart Contracts with
                  <br />
                  <span className="text-purple-500">
                    AI Power
                  </span>
                </h1>
                <p className="text-xl md:text-2xl max-w-2xl mx-auto text-gray-400">
                  Build, deploy, and optimize smart contracts with AI assistance on the Mantle network
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
                <StatCard value="100%" label="Code Coverage" icon={Shield} />
                <StatCard value="50%" label="Gas Optimized" icon={Zap} />
                <StatCard value="24/7" label="AI Analysis" icon={Brain} />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 border-y border-purple-500/10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}