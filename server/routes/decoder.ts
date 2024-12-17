import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import aiRouter from './ai';

const router = Router();

// Initialize ethers providers for both mainnet and testnet
const MANTLE_TESTNET_RPC = 'https://rpc.sepolia.mantle.xyz';
const MANTLE_MAINNET_RPC = 'https://rpc.mantle.xyz';
const MANTLE_TESTNET_EXPLORER_API = 'https://explorer.sepolia.mantle.xyz/api';
const MANTLE_MAINNET_EXPLORER_API = 'https://explorer.mantle.xyz/api';

// Configure timeouts and retries
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const testnetProvider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
const mainnetProvider = new ethers.JsonRpcProvider(MANTLE_MAINNET_RPC);

interface ContractSummary {
  overview: string;
  purpose: string;
  features: Array<{
    name: string;
    description: string;
  }>;
  functions: Array<{
    name: string;
    purpose: string;
    access: string;
  }>;
  specialNotes: string[];
}

interface SecurityAnalysis {
  overallRisk: string;
  issues: Array<{
    severity: string;
    description: string;
    impact?: string;
    recommendation?: string;
  }>;
}

// Function to truncate code if it's too long
function truncateCode(code: string, maxLength: number = 12000): string { // Increased for GPT-4
  if (code.length <= maxLength) return code;
  
  // Keep the first part and last part of the code
  const firstPart = code.slice(0, maxLength / 2);
  const lastPart = code.slice(-maxLength / 2);
  
  return `${firstPart}\n\n// ... Code truncated for analysis ...\n\n${lastPart}`;
}

// Function to parse source code from various response formats
function parseSourceCode(data: any): { sourceCode: string; contractName: string; compilerVersion: string } | null {
  // Handle etherscan-style response
  if (data.result && Array.isArray(data.result) && data.result[0]) {
    const result = data.result[0];
    if (result.SourceCode || result.sourceCode) {
      return {
        sourceCode: result.SourceCode || result.sourceCode,
        contractName: result.ContractName || result.contractName || 'Unknown',
        compilerVersion: result.CompilerVersion || result.compilerVersion || 'Unknown'
      };
    }
  }

  // Handle direct API response
  if (data.sourceCode) {
    return {
      sourceCode: data.sourceCode,
      contractName: data.contractName || 'Unknown',
      compilerVersion: data.compilerVersion || 'Unknown'
    };
  }

  // Handle potential JSON-encoded source code
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed.sourceCode || parsed.SourceCode) {
        return {
          sourceCode: parsed.sourceCode || parsed.SourceCode,
          contractName: parsed.contractName || parsed.ContractName || 'Unknown',
          compilerVersion: parsed.compilerVersion || parsed.CompilerVersion || 'Unknown'
        };
      }
    } catch (e) {
      // If it's not JSON, treat the string itself as source code
      if (data.length > 0) {
        return {
          sourceCode: data,
          contractName: 'Unknown',
          compilerVersion: 'Unknown'
        };
      }
    }
  }

  return null;
}

// Helper function to execute route handler
async function executeRouteHandler<T>(path: string, req: Partial<Request>): Promise<T> {
  const route = aiRouter.stack.find(layer => layer.route?.path === path)?.route;
  if (!route) {
    throw new Error(`Route ${path} not found`);
  }

  const handler = route.stack[0].handle;
  if (!handler) {
    throw new Error(`Handler for route ${path} not found`);
  }

  return new Promise((resolve, reject) => {
    const res = {
      json: resolve,
      status: (code: number) => ({ json: reject }),
    } as Partial<Response>;

    // Add next function to satisfy Express handler signature
    const next = (error?: any) => {
      if (error) reject(error);
    };

    handler(req as Request, res as Response, next);
  });
}

// Helper function to fetch with timeout and retries
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<globalThis.Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Helper function to check contract existence
async function checkContractExistence(address: string): Promise<{ 
  exists: boolean; 
  isTestnet: boolean; 
  provider: ethers.JsonRpcProvider;
  explorerApi: string;
  explorerBaseUrl: string;
}> {
  // Try testnet first
  try {
    const testnetCode = await testnetProvider.getCode(address);
    if (testnetCode !== '0x') {
      return {
        exists: true,
        isTestnet: true,
        provider: testnetProvider,
        explorerApi: MANTLE_TESTNET_EXPLORER_API,
        explorerBaseUrl: 'https://explorer.sepolia.mantle.xyz'
      };
    }
  } catch (error) {
    console.error('Error checking testnet:', error);
  }

  // Try mainnet
  try {
    const mainnetCode = await mainnetProvider.getCode(address);
    if (mainnetCode !== '0x') {
      return {
        exists: true,
        isTestnet: false,
        provider: mainnetProvider,
        explorerApi: MANTLE_MAINNET_EXPLORER_API,
        explorerBaseUrl: 'https://explorer.mantle.xyz'
      };
    }
  } catch (error) {
    console.error('Error checking mainnet:', error);
  }

  return {
    exists: false,
    isTestnet: true,
    provider: testnetProvider,
    explorerApi: MANTLE_TESTNET_EXPLORER_API,
    explorerBaseUrl: 'https://explorer.sepolia.mantle.xyz'
  };
}

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }

    // Check contract existence on both networks
    const { exists, isTestnet, provider, explorerApi, explorerBaseUrl } = 
      await checkContractExistence(address);

    if (!exists) {
      return res.status(404).json({ 
        error: 'Contract not found on either testnet or mainnet'
      });
    }

    console.log(`Contract found on ${isTestnet ? 'testnet' : 'mainnet'}`);

    // Fetch contract source code with parallel API calls
    try {
      console.log(`Fetching source code from ${isTestnet ? 'testnet' : 'mainnet'} explorer...`);
      
      // Try different API endpoint patterns in parallel
      const apiEndpoints = [
        `/api?module=contract&action=getsourcecode&address=${address}`,
        `/v2/smart-contracts/${address}/source-code`,
        `/v1/contracts/${address}/source-code`,
        `/contracts/${address}/source-code`
      ];

      const responses = await Promise.allSettled(
        apiEndpoints.map(endpoint => 
          fetchWithRetry(`${explorerApi}${endpoint}`)
          .then(async (response) => {
            if (!response.ok) return null;
            const data = await response.json();
            return { endpoint, data };
          })
          .catch(() => null)
        )
      );

      // Find first successful response
      const successfulResponse = responses
        .filter((result): result is PromiseFulfilledResult<{endpoint: string; data: any}> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
        .find(response => {
          const parsedData = parseSourceCode(response.data);
          if (parsedData) {
            console.log(`Successfully fetched source code using endpoint: ${response.endpoint}`);
            return true;
          }
          return false;
        });

      if (!successfulResponse) {
        return res.status(404).json({ 
          error: `Contract source code not verified on ${isTestnet ? 'testnet' : 'mainnet'}`,
          explorerUrl: `${explorerBaseUrl}/address/${address}`
        });
      }

      const sourceData = parseSourceCode(successfulResponse.data)!;
      
      // Truncate code for analysis to stay within token limits
      const truncatedCode = truncateCode(sourceData.sourceCode);

      // Get contract summary and security analysis in parallel
      const [summaryResponse, securityResponse] = await Promise.all([
        executeRouteHandler<ContractSummary>('/summarize', { body: { code: truncatedCode } }),
        executeRouteHandler<SecurityAnalysis>('/analyze', { body: { code: truncatedCode } })
      ]);

      // Format features from summary and security analysis
      const features = [
        // Network info
        `🌐 Network: Mantle ${isTestnet ? 'Sepolia Testnet' : 'Mainnet'}`,
        // Contract info
        `📄 Contract Name: ${sourceData.contractName}`,
        `⚙️ Compiler: ${sourceData.compilerVersion}`,
        // Contract features
        ...(summaryResponse.features || []).map(f => `✨ ${f.name}: ${f.description}`),
        // Important functions
        ...(summaryResponse.functions || []).map(f => `🔧 ${f.name}: ${f.purpose} (Access: ${f.access})`),
        // Special notes
        ...(summaryResponse.specialNotes || []).map(note => `📝 ${note}`),
        // Security notes
        `🛡️ Security Risk Level: ${securityResponse.overallRisk?.toUpperCase() || 'UNKNOWN'}`,
        ...(securityResponse.issues || []).map(issue => {
          const icon = issue.severity === 'high' ? '⚠️' : issue.severity === 'medium' ? '⚡' : 'ℹ️';
          return `${icon} ${issue.description}`;
        })
      ];

      // Prepare the response
      res.json({
        contractCode: sourceData.sourceCode,
        summary: `${summaryResponse.overview || ''}\n\n${summaryResponse.purpose || ''}`,
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
