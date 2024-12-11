import { Link } from "wouter";
import { Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { WalletConnector } from "../WalletConnector";

interface NavbarProps {
  isScrolled?: boolean;
}

export function Navbar({ isScrolled = false }: NavbarProps) {
  const [internalScrolled, setInternalScrolled] = useState(isScrolled);

  useEffect(() => {
    if (isScrolled === undefined) {
      const handleScroll = () => {
        setInternalScrolled(window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isScrolled]);

  const scrollState = isScrolled ?? internalScrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 w-full border-b border-purple-500/10 backdrop-blur-md z-50 
      transition-all duration-300 ${scrollState ? 'bg-black/80 py-3' : 'bg-transparent py-4'}`}>
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
            {['Contract Builder', 'Explorer', 'Templates', 'Community'].map((item) => (
              <Link 
                key={item}
                href={`/${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-white/80 hover:text-purple-400 
                  hover:-translate-y-0.5 transition-all duration-200"
              >
                {item}
              </Link>
            ))}
            <WalletConnector />
          </div>
        </div>
      </div>
    </nav>
  );
}
