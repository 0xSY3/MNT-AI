import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SecurityAnalyzerProps {
  code: string;
}

interface SecurityIssue {
  severity: 'high' | 'medium' | 'low';
  description: string;
  line?: number;
  snippet?: string;
  recommendation?: string;
  impact?: string;
}

const SecurityAnalyzer: React.FC<SecurityAnalyzerProps> = ({ code }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<SecurityIssue[]>([]);
  const [overallRisk, setOverallRisk] = useState<string>('');

  const analyzeContract = async () => {
    if (!code.trim()) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data.issues || []);
      setOverallRisk(data.overallRisk || calculateOverallRisk(data.issues));
    } catch (error) {
      console.error('Security analysis error:', error);
      setAnalysisResults([{
        severity: 'medium',
        description: 'Failed to perform security analysis. Please try again.',
      }]);
      setOverallRisk('medium');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateOverallRisk = (issues: SecurityIssue[]) => {
    if (issues.some(i => i.severity === 'high')) return 'high';
    if (issues.some(i => i.severity === 'medium')) return 'medium';
    if (issues.some(i => i.severity === 'low')) return 'low';
    return 'safe';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-white" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 border-green-500/30 bg-green-500/10';
      default:
        return 'text-white border-purple-500/30 bg-purple-500/10';
    }
  };

  const getOverallRiskBadge = () => {
    const color = getSeverityColor(overallRisk);
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {getSeverityIcon(overallRisk)}
        <span className="ml-2 capitalize">{overallRisk} Risk</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={analyzeContract}
        disabled={isAnalyzing || !code}
        className="w-full bg-purple-600/90 text-white hover:bg-purple-500 
          border border-purple-500/30 shadow-lg shadow-purple-500/20 
          transition-all duration-200 hover:scale-[1.02] h-10"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Analyze Contract
          </>
        )}
      </Button>

      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Security Analysis Results</h3>
            {getOverallRiskBadge()}
          </div>
          
          <div className="space-y-4">
            {analysisResults.map((issue, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium capitalize">
                        {issue.severity} Risk
                      </span>
                      {issue.line && (
                        <span className="text-sm opacity-60">Line {issue.line}</span>
                      )}
                    </div>
                    
                    <p className="text-sm opacity-90 mb-3">{issue.description}</p>
                    
                    {issue.snippet && (
                      <div className="my-3 p-3 rounded bg-black/50 font-mono text-sm overflow-x-auto">
                        <pre>{issue.snippet}</pre>
                      </div>
                    )}
                    
                    {issue.impact && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Impact:</span>
                        <p className="text-sm opacity-90 mt-1">{issue.impact}</p>
                      </div>
                    )}
                    
                    {issue.recommendation && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Recommendation:</span>
                        <p className="text-sm opacity-90 mt-1">{issue.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisResults.length === 0 && !isAnalyzing && (
        <div className="text-sm text-white/60 text-center py-4">
          {code ? "Click analyze to check contract security" : "Enter contract code to analyze"}
        </div>
      )}
    </div>
  );
};

export default SecurityAnalyzer;
