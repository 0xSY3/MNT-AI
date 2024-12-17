export const MANTLE_TESTNET_CONFIG = {
  chainId: "0x138B", // 5003 in decimal
  chainName: "Mantle Sepolia Testnet",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18
  },
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"]
};

export const CONTRACT_COMPILER_VERSION = "0.8.28";
export const COMPILER_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 200
  },
  evmVersion: "paris"
};
 