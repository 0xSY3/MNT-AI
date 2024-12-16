import { Router } from 'express';
import solc from 'solc';
import { ethers } from 'ethers';
import { CONTRACT_COMPILER_VERSION } from '../../client/src/config/mantle';

const router = Router();

// Mantle Explorer API endpoint
const MANTLE_EXPLORER_API = 'https://explorer.mantle.xyz/api';
const MANTLE_RPC = 'https://rpc.mantle.xyz';

// Initialize ethers provider
const provider = new ethers.JsonRpcProvider(MANTLE_RPC);

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

// New route to fetch contract source code by address
router.get('/source/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }

    // First verify if it's a contract address
    const code = await provider.getCode(address);
    if (code === '0x') {
      return res.status(404).json({ error: 'No contract found at this address' });
    }

    try {
      // Fetch verified contract source code from Mantle Explorer API
      const response = await fetch(`${MANTLE_EXPLORER_API}/v2/contracts/${address}/source-code`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch source code');
      }

      const data = await response.json();
      
      // Check if contract is verified
      if (!data.sourceCode) {
        return res.status(404).json({ error: 'Contract source code not verified' });
      }

      res.json({
        sourceCode: data.sourceCode,
        contractName: data.contractName,
        compilerVersion: data.compilerVersion
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
