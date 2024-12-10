import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, BarChart2, FileCode, Users, TestTubeIcon, Brain, Zap } from "lucide-react";
import { Link } from "wouter";

// Background Components
const GridBackground = () => (
  <div className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-[#030303] to-[#050508]" />
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(90deg, rgba(147, 51, 234, 0.12) 1px, transparent 1px),
        linear-gradient(0deg, rgba(147, 51, 234, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
        linear-gradient(0deg, rgba(147, 51, 234, 0.08) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px, 32px 32px, 8px 8px, 8px 8px'
    }} />
  </div>
);

// Animated Lines Effect
const ScrollLines = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Left side lines */}
      <div className="absolute left-16 top-0 bottom-0 w-px opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="absolute w-full h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            style={{
              top: `${((scrollY * (0.5 + i * 0.1)) % 500) - 100}px`,
              opacity: 0.5 - i * 0.1,
              transition: 'top 0.1s linear'
            }}
          />
        ))}
      </div>

      {/* Right side lines */}
      <div className="absolute right-16 top-0 bottom-0 w-px opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="absolute w-full h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            style={{
              bottom: `${((scrollY * (0.5 + i * 0.1)) % 500) - 100}px`,
              opacity: 0.5 - i * 0.1,
              transition: 'bottom 0.1s linear'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Floating Particles
const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-purple-500/30"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`
        }}
      />
    ))}
  </div>
);

// Navbar Component
const Navbar = ({ isScrolled }) => (
  <nav className={`fixed top-0 left-0 right-0 w-full border-b border-purple-500/10 backdrop-blur-md z-50 
    transition-all duration-300 ${isScrolled ? 'bg-black/80 py-3' : 'bg-transparent py-4'}`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center 
            border border-purple-500/20">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white">
            MNT<span className="text-purple-400">DEV</span>AI
          </span>
        </Link>

        <div className="flex items-center space-x-8">
          {['Studio', 'Docs', 'Pricing'].map((item) => (
            <Link 
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-sm font-medium text-white/80 hover:text-purple-400 
                hover:-translate-y-0.5 transition-all duration-200"
            >
              {item}
            </Link>
          ))}
          <button className="px-6 py-2 bg-purple-600/90 text-white font-semibold rounded-xl 
            shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all duration-300 
            border border-purple-500/30">
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  </nav>
);

// Card Components
const FeatureCard = ({ href, icon: Icon, title, description, buttonText }) => (
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

const StatCard = ({ value, label, icon: Icon }) => (
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
      href: "/forum",
      icon: Users,
      title: "Community",
      description: "Connect with other developers and get help",
      buttonText: "Join Discussion"
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
        <section className="pt-32 pb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-block px-3 py-1 mb-6 rounded-full text-sm font-medium 
                bg-purple-500/10 border border-purple-500/20">
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
                <StatCard value="1000+" label="AI Powered Apps" icon={Brain} />
                <StatCard value="5x" label="Faster Development" icon={Zap} />
                <StatCard value="24/7" label="AI Support" icon={Users} />
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