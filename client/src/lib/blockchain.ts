import { ethers } from 'ethers';

// Initialize provider for Mantle network
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
async function decompileBytecode(bytecode: string): Promise<string> {
  // TODO: Implement actual decompilation logic
  // For now, return formatted bytecode with function signatures
  const cleanBytecode = bytecode.replace('0x', '');
  const chunks = cleanBytecode.match(/.{1,64}/g) || [];
  
  // Extract function signatures (first 4 bytes of each function)
  const functionSignatures = chunks
    .filter(chunk => chunk.length >= 8)
    .map(chunk => chunk.substring(0, 8))
    .join('\n');

  return `// Bytecode Analysis
// Contract deployed at: ${new Date().toISOString()}
// Size: ${Math.floor(cleanBytecode.length / 2)} bytes

/* Function Signatures */
${functionSignatures}

/* Full Bytecode */
${chunks.join('\n')}`;
}

export async function getContractCode(address: string): Promise<string> {
  try {
    // Validate address format
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    // For transaction hash, get the transaction details
    if (address.length === 66) { // Transaction hash length
      const tx = await provider.getTransaction(address);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      
      // Get the contract address from transaction receipt
      const receipt = await provider.getTransactionReceipt(address);
      if (receipt?.contractAddress) {
        return await getContractCode(receipt.contractAddress);
      }
      throw new Error('Transaction did not create a contract');
    }

    // First check if contract exists
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error('No contract found at this address');
    }

    // Try to get verified source code from Mantle Explorer
    try {
      // First try the standard API endpoint
      const response = await fetch(`https://explorer.mantle.xyz/api/v2/smart-contracts/${address}/verify`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result?.[0]?.SourceCode) {
          return {
            code: data.result[0].SourceCode,
            verified: true,
            message: "Verified Contract Source from Mantle Explorer"
          };
        }
      }
      
      // If standard API fails, try the alternative endpoint
      const alternativeResponse = await fetch(`https://explorer.mantle.xyz/api?module=contract&action=getsourcecode&address=${address}`);
      
      if (alternativeResponse.ok) {
        const data = await alternativeResponse.json();
        if (data.result?.[0]?.SourceCode) {
          return {
            code: data.result[0].SourceCode,
            verified: true,
            message: "Verified Contract Source from Mantle Explorer"
          };
        }
      }

      // If contract is not verified, return bytecode with formatted message
      const bytecode = await provider.getCode(address);
      return {
        code: bytecode,
        verified: false,
        message: "Contract Not Verified - Displaying Bytecode",
        decompiled: await decompileBytecode(bytecode)
      };
    } catch (error) {
      console.warn('Failed to get contract code:', error);
      throw new Error(`Failed to fetch contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // If we couldn't get verified source, provide a more informative message
    return `// Contract Source Not Verified\n// Address: ${address}\n\n` +
           `/*\nThis contract's source code has not been verified on Mantle Explorer.\n` +
           `To view the contract's source code, please verify it on Mantle Explorer:\n` +
           `https://explorer.mantle.xyz/address/${address}\n*/\n\n` +
           `// Contract Bytecode:\n${code}`;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch contract: ${errorMessage}`);
  }
}

export async function getContractABI(address: string): Promise<any> {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    // Create contract instance
    const contract = new ethers.Contract(address, [], provider);
    
    // Get contract interface
    return contract.interface.format();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Failed to get ABI:', errorMessage);
    return null;
  }
}
