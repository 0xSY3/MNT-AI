interface GasEstimation {
  estimated: string;
  breakdown: {
    deployment: string;
    execution: string;
  };
}

interface DeploymentResult {
  address: string;
  transactionHash: string;
  blockNumber: number;
}

export async function estimateGas(params: { code: string }): Promise<GasEstimation> {
  const response = await fetch("/api/gas/estimate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to estimate gas");
  }

  return response.json();
}

export async function deployContract(params: {
  code: string;
  constructorArgs?: any[];
}): Promise<DeploymentResult> {
  const response = await fetch("/api/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to deploy contract");
  }

  return response.json();
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
