import { Router } from 'express';
import solc from 'solc';
import { ethers } from 'ethers';
import { CONTRACT_COMPILER_VERSION } from '../../client/src/config/mantle';

const router = Router();

// Initialize providers for both networks
const MANTLE_TESTNET_RPC = 'https://rpc.sepolia.mantle.xyz';
const MANTLE_MAINNET_RPC = 'https://rpc.mantle.xyz';
const MANTLE_TESTNET_EXPLORER_API = 'https://explorer.sepolia.mantle.xyz/api';
const MANTLE_MAINNET_EXPLORER_API = 'https://explorer.mantle.xyz/api';

const testnetProvider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
const mainnetProvider = new ethers.JsonRpcProvider(MANTLE_MAINNET_RPC);

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

router.post('/compile', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Contract code is required' });
    }

    // Create input object for solc
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: code
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    // Find solc version that matches CONTRACT_COMPILER_VERSION
    const solcVersion = CONTRACT_COMPILER_VERSION || '0.8.19';
    
    try {
      // Compile the contract
      const output = JSON.parse(
        solc.compile(JSON.stringify(input))
      );

      // Check for compilation errors
      if (output.errors) {
        const errors = output.errors.filter((error: any) => error.severity === 'error');
        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Compilation failed',
            details: errors.map((error: any) => error.message)
          });
        }
      }

      // Get the contract
      const contractFile = Object.keys(output.contracts['contract.sol'])[0];
      const contract = output.contracts['contract.sol'][contractFile];

      // Return the ABI and bytecode
      res.json({
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      });
    } catch (error) {
      console.error('Compilation error:', error);
      res.status(500).json({ error: 'Failed to compile contract' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch contract source code by address
router.get('/source/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }

    // Check both networks for the contract
    let isTestnet = true;
    let provider = testnetProvider;
    let explorerApi = MANTLE_TESTNET_EXPLORER_API;
    let explorerBaseUrl = 'https://explorer.sepolia.mantle.xyz';

    try {
      console.log('Checking testnet for contract...');
      const testnetCode = await testnetProvider.getCode(address);
      if (testnetCode === '0x') {
        console.log('Contract not found on testnet, checking mainnet...');
        const mainnetCode = await mainnetProvider.getCode(address);
        if (mainnetCode === '0x') {
          return res.status(404).json({ error: 'Contract not found on either testnet or mainnet' });
        }
        isTestnet = false;
        provider = mainnetProvider;
        explorerApi = MANTLE_MAINNET_EXPLORER_API;
        explorerBaseUrl = 'https://explorer.mantle.xyz';
        console.log('Contract found on mainnet');
      } else {
        console.log('Contract found on testnet');
      }
    } catch (error) {
      console.error('Error checking contract existence:', error);
      return res.status(500).json({ error: 'Failed to verify contract existence' });
    }

    try {
      console.log(`Fetching source code from ${isTestnet ? 'testnet' : 'mainnet'} explorer...`);
      
      // Try different API endpoint patterns
      const apiEndpoints = [
        `/api?module=contract&action=getsourcecode&address=${address}`, // Try etherscan-style first
        `/v2/smart-contracts/${address}/source-code`,
        `/v1/contracts/${address}/source-code`,
        `/contracts/${address}/source-code`
      ];

      let sourceData = null;
      let successfulEndpoint = '';

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying endpoint: ${explorerApi}${endpoint}`);
          const response = await fetch(`${explorerApi}${endpoint}`);
          
          if (response.ok) {
            const data = await response.json();
            const parsedData = parseSourceCode(data);
            if (parsedData) {
              sourceData = parsedData;
              successfulEndpoint = endpoint;
              break;
            }
          }
          console.log(`Response status for ${endpoint}:`, response.status);
        } catch (e) {
          console.log(`Endpoint ${endpoint} failed:`, e);
        }
      }

      if (!sourceData) {
        return res.status(404).json({ 
          error: `Contract source code not verified on ${isTestnet ? 'testnet' : 'mainnet'}`,
          explorerUrl: `${explorerBaseUrl}/address/${address}`
        });
      }

      console.log(`Successfully fetched source code using endpoint: ${successfulEndpoint}`);
      res.json({
        sourceCode: sourceData.sourceCode,
        contractName: sourceData.contractName,
        compilerVersion: sourceData.compilerVersion,
        network: isTestnet ? 'testnet' : 'mainnet'
      });
    } catch (error) {
      console.error('Explorer API error:', error);
      return res.status(500).json({ error: 'Failed to fetch contract source code' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
