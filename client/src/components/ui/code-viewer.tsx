import { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-solidity";

interface CodeViewerProps {
  code: string;
  language?: string;
  className?: string;
  typing?: boolean;
  typingSpeed?: number;
}

export function CodeViewer({ 
  code, 
  language = "solidity", 
  className = "",
  typing = false,
  typingSpeed = 10 
}: CodeViewerProps) {
  const [displayedCode, setDisplayedCode] = useState("");

  useEffect(() => {
    if (!typing) {
      setDisplayedCode(code);
      return;
    }

    setDisplayedCode("");
    let index = 0;
    const timer = setInterval(() => {
      if (index < code.length) {
        setDisplayedCode(prev => prev + code.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [code, typing, typingSpeed]);

  useEffect(() => {
    Prism.highlightAll();
  }, [displayedCode]);

  return (
    <div className={`relative rounded-md bg-black/80 backdrop-blur-sm w-full h-full ${className}`}>
      <pre className="p-2 sm:p-4 overflow-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent h-full">
        <code 
          className={`language-${language} text-xs sm:text-sm font-mono whitespace-pre-wrap break-words`} 
          style={{
            textShadow: '0 0 2px rgba(255,255,255,0.1)',
            color: '#e4e4e7',
            lineHeight: '1.6',
            maxWidth: '100%'
          }}
        >
          {typing ? displayedCode : code}
        </code>
      </pre>
    </div>
  );
}
