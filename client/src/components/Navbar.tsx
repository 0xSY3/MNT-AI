import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Code2,
  FileCode,
  Brain,
  Home,
  TestTube,
  Shield,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { WalletConnector } from "./WalletConnector";

export default function Navbar() {
  const [activeLink, setActiveLink] = useState("/");

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-purple-500/20">
              <Code2 className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xl font-bold">
              MNT<span className="text-purple-400">DEV</span>AI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {[
              { href: "/", icon: Home, label: "Home" },
              { href: "/contract-builder", icon: Code2, label: "Builder" },
              { href: "/test-suite", icon: TestTube, label: "Testing" },
              { href: "/templates", icon: FileCode, label: "Templates" },
              { href: "/security", icon: Shield, label: "Security" },
              { href: "/analytics", icon: Activity, label: "Analytics" },
              { href: "/ai-assistant", icon: Brain, label: "AI Assistant" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 transition-colors ${
                    activeLink === href
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-purple-400"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <WalletConnector />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="p-2 text-gray-400 hover:text-purple-400"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
