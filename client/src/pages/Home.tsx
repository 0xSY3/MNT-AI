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
      hover:-translate-y-1 transition-all duration-300 group">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-purple-400/20 to-purple-600/20
            transition-all duration-300 group-hover:from-purple-400/30 group-hover:to-purple-600/30">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          </div>
          <span className="font-semibold text-base sm:text-lg text-white/90">
            {title}
          </span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-white/60">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <Button className="w-full bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-500/30 
          shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:scale-[1.02]">
          <span className="mr-2">{buttonText}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
  <div className="px-4 py-5 sm:p-6 rounded-2xl bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm 
    hover:scale-105 transition-all duration-300">
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
        <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-purple-600 
          bg-clip-text text-transparent">
          {value}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-gray-300 font-medium">{label}</p>
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
      description: "AI-powered smart contract development and analysis",
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
                  Next-Gen Smart Contract Development 🚀
                </span>
              </div>

              <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight px-4">
                  Elevate Your
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent animate-text">
                    Web3 Experience
                  </span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto text-gray-400 px-4">
                  Build, audit, and deploy secure smart contracts with advanced AI assistance on the Mantle network
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-6 px-4">
                <StatCard value="10+" label="Contract Templates" icon={Shield} />
                <StatCard value="24/7" label="AI Development" icon={Brain} />
                <StatCard value="100%" label="Test Coverage" icon={Zap} />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-12 sm:py-20 border-y border-purple-500/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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