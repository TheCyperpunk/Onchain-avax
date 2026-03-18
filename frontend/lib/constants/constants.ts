export const CONTRACT_ADDRESS = "0x094bf41C9aD82016972F3Ae0F3aE5Ab217174a95"; // your deployed address

export const AVAX_FUJI_CHAIN = {
  id: 43113,
  name: "Avalanche Fuji Testnet",
  network: "avaxFuji",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: { name: "SnowTrace", url: "https://testnet.snowtrace.io" },
    etherscan: { name: "SnowTrace", url: "https://testnet.snowtrace.io" },
  },
  testnet: true,
};
