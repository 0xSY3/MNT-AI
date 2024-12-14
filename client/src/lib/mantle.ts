import { ethers } from 'ethers';
import { MANTLE_TESTNET_CONFIG } from '../config/mantle';

export interface GasEstimation {
  estimated: string;
  breakdown: {
    deployment: string;
    execution: string;
  };
}

export interface DeploymentResult {
  address: string;
  transactionHash: string;
  blockNumber: number;
}

export interface CompilationResult {
  abi: any[];
  bytecode: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    // Add Mantle testnet to MetaMask if not already added
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MANTLE_TESTNET_CONFIG],
      });
    } catch (error: any) {
      // Chain might already be added
      console.log("Chain addition error (might be already added):", error.message);
    }

    // Switch to Mantle testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MANTLE_TESTNET_CONFIG.chainId }],
      });
    } catch (error: any) {
      throw new Error(`Failed to switch to Mantle Testnet: ${error.message}`);
    }

    return accounts[0];
  } catch (error: any) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

export async function compileContract(code: string): Promise<CompilationResult> {
  const response = await fetch("/api/compile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Compilation failed: ${error}`);
  }

  return response.json();
}

export async function estimateGas(params: { 
  code: string,
  abi: any[],
  bytecode: string 
}): Promise<GasEstimation> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const factory = new ethers.ContractFactory(params.abi, params.bytecode, await provider.getSigner());

  try {
    const deployTx = await factory.getDeployTransaction();
    const estimatedGas = await provider.estimateGas(deployTx);
    
    return {
      estimated: estimatedGas.toString(),
      breakdown: {
        deployment: Math.floor(Number(estimatedGas) * 0.7).toString(), // Approximate deployment cost
        execution: Math.floor(Number(estimatedGas) * 0.3).toString()   // Approximate execution cost
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to estimate gas: ${error.message}`);
  }
}

export async function deployContract(params: {
  abi: any[];
  bytecode: string;
  constructorArgs?: any[];
}): Promise<DeploymentResult> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const factory = new ethers.ContractFactory(
      params.abi,
      params.bytecode,
      signer
    );

    const contract = await factory.deploy(...(params.constructorArgs || []));
    const receipt = await contract.deploymentTransaction()?.wait();

    if (!receipt) {
      throw new Error("No deployment receipt received");
    }

    return {
      address: await contract.getAddress(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    throw new Error(`Contract deployment failed: ${error.message}`);
  }
}

export async function getNetworkStats(): Promise<{
  blockTime: number;
  gasPrice: string;
  tps: number;
  validators: number;
}> {
  const response = await fetch("/api/network/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch network stats");
  }
  return response.json();
}

export async function verifyContract(params: {
  address: string;
  code: string;
  constructorArgs?: any[];
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to verify contract");
  }

  return response.json();
}
