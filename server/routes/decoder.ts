import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

// Initialize ethers provider
const MANTLE_RPC = 'https://rpc.mantle.xyz';
const provider = new ethers.JsonRpcProvider(MANTLE_RPC);

// Function to truncate code if it's too long
function truncateCode(code: string, maxLength: number = 6000): string {
  if (code.length <= maxLength) return code;
  
  // Keep the first part and last part of the code
  const firstPart = code.slice(0, maxLength / 2);
  const lastPart = code.slice(-maxLength / 2);
  
  return `${firstPart}\n\n// ... Code truncated for analysis ...\n\n${lastPart}`;
}

router.post('/analyze', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }

    // First verify if it's a contract address
    const code = await provider.getCode(address);
    if (code === '0x') {
      return res.status(404).json({ error: 'No contract found at this address' });
    }

    // Fetch contract source code
    try {
      const sourceResponse = await fetch(`/api/source/${address}`);
      if (!sourceResponse.ok) {
        throw new Error('Failed to fetch source code');
      }

      const sourceData = await sourceResponse.json();
      
      // Truncate code for analysis to stay within token limits
      const truncatedCode = truncateCode(sourceData.sourceCode);

      // Send the truncated contract data to AI for analysis
      const aiResponse = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: truncatedCode,
          model: 'gpt-3.5-turbo' // Explicitly specify the model
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to analyze contract');
      }

      const aiAnalysis = await aiResponse.json();

      // Extract key features from the analysis
      const features = aiAnalysis.issues.map((issue: any) => {
        if (issue.severity === 'low') {
          return `✓ ${issue.description}`;
        } else {
          return `! ${issue.description}`;
        }
      });

      // Prepare the response
      res.json({
        contractCode: sourceData.sourceCode, // Send full code for display
        summary: `Contract analysis complete. Overall risk level: ${aiAnalysis.overallRisk}. ${
          aiAnalysis.issues.length
        } issues found. ${
          aiAnalysis.issues.filter((i: any) => i.severity === 'high').length
        } high severity, ${
          aiAnalysis.issues.filter((i: any) => i.severity === 'medium').length
        } medium severity, ${
          aiAnalysis.issues.filter((i: any) => i.severity === 'low').length
        } low severity.`,
        features: features,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze contract' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
