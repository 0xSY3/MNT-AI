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
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { WalletConnector } from "./WalletConnector";

export default function Navbar() {
  const [activeLink, setActiveLink] = useState("/");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleRouteChange = () => {
      setActiveLink(window.location.pathname);
      setIsMobileMenuOpen(false);
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/contract-builder", icon: Code2, label: "Builder" },
    { href: "/test-suite", icon: TestTube, label: "Testing" },
    { href: "/templates", icon: FileCode, label: "Templates" },
    { href: "/security", icon: Shield, label: "Security" },
    { href: "/analytics", icon: Activity, label: "Analytics" },
    { href: "/ai-assistant", icon: Brain, label: "AI Assistant" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 bg-black/95 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400" />
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold">
              MNT<span className="text-purple-400">DEV</span>AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-2.5 py-1.5 transition-all duration-200 text-sm ${
                    activeLink === href
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-gray-300 hover:text-purple-400 hover:bg-purple-500/5"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Wallet */}
            <div className="hidden lg:block">
              <WalletConnector />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 sm:p-1.5 text-gray-400 hover:text-purple-400 focus:ring-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Toggle menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out transform ${
            isMobileMenuOpen 
              ? "max-h-[32rem] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          } overflow-hidden`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-purple-500/20">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start transition-colors text-sm ${
                    activeLink === href
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-gray-300 hover:text-purple-400 hover:bg-purple-500/5"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
            <div className="pt-2 pb-1">
              <WalletConnector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
