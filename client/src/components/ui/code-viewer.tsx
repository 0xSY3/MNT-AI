import { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-solidity";

interface CodeViewerProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeViewer({ code, language = "solidity", className = "" }: CodeViewerProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <div className={`relative rounded-md bg-black/80 backdrop-blur-sm w-full ${className}`}>
      <pre className="p-2 sm:p-4 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        <code 
          className={`language-${language} text-xs sm:text-sm font-mono whitespace-pre-wrap break-words`} 
          style={{
            textShadow: '0 0 2px rgba(255,255,255,0.1)',
            color: '#e4e4e7',
            lineHeight: '1.6',
            maxWidth: '100%'
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
