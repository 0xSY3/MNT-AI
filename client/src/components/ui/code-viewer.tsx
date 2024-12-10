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
    <div className={`relative rounded-md bg-black ${className}`}>
      <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <code className={`language-${language} text-sm`} 
          style={{
            textShadow: '0 0 2px rgba(255,255,255,0.1)',
            color: '#e4e4e7'
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
