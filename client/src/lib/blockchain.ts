import { ethers } from 'ethers';

// Initialize provider for Mantle network
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');

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
      const response = await fetch(`https://explorer.mantle.xyz/api/v2/smart-contracts/${address}/source-code`);

      if (!response.ok) {
        throw new Error('Failed to fetch from explorer');
      }

      const data = await response.json();
      if (data.status === "1" && data.result?.[0]?.SourceCode) {
        // Process verified source code
        const sourceCode = data.result[0].SourceCode;
        return `// Verified Contract Source from Mantle Explorer\n// Address: ${address}\n\n${sourceCode}`;
      }
    } catch (error) {
      console.warn('Failed to get verified source code:', error);
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
