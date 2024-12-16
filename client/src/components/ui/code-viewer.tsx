import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeViewerProps {
  code: string;
  className?: string;
  language?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, className, language = 'solidity' }) => {
  return (
    <div className={className}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
};

// Add both named and default export
export default CodeViewer;
