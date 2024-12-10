interface AnalysisResult {
  suggestions: Array<{
    type: "warning" | "error" | "info";
    message: string;
    line?: number;
    code?: string;
  }>;
  securityIssues: Array<{
    severity: "high" | "medium" | "low";
    description: string;
    recommendation: string;
    impact: string;
    references?: string[];
  }>;
  optimizations: Array<{
    type: "gas" | "performance" | "mantle-specific";
    description: string;
    estimate: string;
    suggestion: string;
    beforeCode?: string;
    afterCode?: string;
  }>;
  mantleOptimizations: Array<{
    category: "rollup" | "calldata" | "storage" | "computation";
    description: string;
    potentialSavings: string;
    implementation: string;
  }>;
}

export async function analyzeCode(params: { code: string }): Promise<AnalysisResult> {
  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze code");
  }

  return response.json();
}

export async function generateContract(params: {
  description: string;
  features: string[];
}): Promise<{ code: string; explanation: string }> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to generate contract");
  }

  return response.json();
}

export async function optimizeCode(params: { code: string }): Promise<{
  optimizedCode: string;
  improvements: string[];
  gasReduction: string;
}> {
  const response = await fetch("/api/ai/optimize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to optimize code");
  }

  return response.json();
}
