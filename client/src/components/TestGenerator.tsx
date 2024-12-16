import React from 'react';

interface TestGeneratorProps {
  contractCode: string;
}

const TestGenerator: React.FC<TestGeneratorProps> = ({ contractCode }) => {
  // Placeholder for test generation implementation
  return (
    <div className="space-y-4">
      <div className="text-sm text-white/60">
        Generated tests will be displayed here
      </div>
    </div>
  );
};

export default TestGenerator;
