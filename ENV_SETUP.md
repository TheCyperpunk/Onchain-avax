# Environment Setup Guide for OnchainSIP

This guide will help you set up the required environment variables for both the Hardhat backend and Next.js frontend.

## 📋 Prerequisites

Before setting up environment variables, make sure you have:

1. **MetaMask Wallet** installed with some test AVAX
2. **WalletConnect Project ID** (optional - a default one is already configured)
3. **Avalanche Fuji Testnet** added to your wallet

## 🔧 Backend Setup (Hardhat)

### Step 1: Create `.env` file in the root directory

Navigate to the project root and create a `.env` file:

```bash
cd "c:\Users\sangeeth karunakaran\Documents\GitHub\Onchain-avax\Onchain-SIP-main"
New-Item -Path .env -ItemType File
```

### Step 2: Add the following content to `.env`:

```env
# Avalanche Fuji Testnet RPC URL
AVAX_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Your wallet's private key (NEVER share this!)
# Export from MetaMask: Account Details > Export Private Key
# IMPORTANT: Remove the '0x' prefix
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Optional: Snowtrace API Key for contract verification
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
```

### How to get your Private Key:

1. Open MetaMask
2. Click on the three dots menu
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. **Copy the private key WITHOUT the '0x' prefix**
7. **NEVER share this key or commit it to git!**

### Alternative RPC URLs (if public RPC is slow):

- **Alchemy**: https://www.alchemy.com/ (recommended)
- **Infura**: https://www.infura.io/
- **Public**: https://api.avax-test.network/ext/bc/C/rpc (default)

## 🎨 Frontend Setup (Next.js)

### Step 1: Create `.env.local` file in the frontend directory

```bash
cd frontend
New-Item -Path .env.local -ItemType File
```

### Step 2: Add the following content to `.env.local`:

```env
# WalletConnect Project ID (Optional - already configured in code)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=e64f9452181aabc5712f9288d93d41cd

# Smart Contract Address (Already deployed on Fuji)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b

# Avalanche Fuji Testnet RPC URL (Optional)
NEXT_PUBLIC_AVAX_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Chain ID for Avalanche Fuji Testnet
NEXT_PUBLIC_CHAIN_ID=43113
```

### Notes:

- The **WalletConnect Project ID** is already hardcoded in `providers.tsx` (line 16)
- The **Contract Address** is already hardcoded in `page.tsx` (line 378)
- These environment variables are **optional** for the frontend to run
- If you want your own WalletConnect Project ID, get it from: https://cloud.walletconnect.com/

## 🚀 Quick Start (No Environment Setup Required!)

**Good news!** The frontend will work immediately without any `.env.local` file because:

1. ✅ WalletConnect Project ID is already configured in the code
2. ✅ Contract address is already deployed and hardcoded
3. ✅ Network configuration uses default public RPC

You only need the backend `.env` file if you want to:
- Deploy new smart contracts
- Run Hardhat tests
- Interact with contracts via Hardhat scripts

## 🎯 Running the Project

### Frontend Only (Recommended for testing):

```bash
cd frontend
npm run dev
```

Then open http://localhost:3000

### Full Stack (if deploying contracts):

1. Set up backend `.env` with your private key
2. Compile contracts: `npx hardhat compile`
3. Deploy contracts: `npx hardhat run scripts/deploy.js --network avaxFuji`
4. Update contract address in frontend code
5. Run frontend: `cd frontend && npm run dev`

## 🔐 Security Reminders

- ⚠️ **NEVER** commit `.env` or `.env.local` files to git
- ⚠️ **NEVER** share your private key
- ⚠️ Only use testnet wallets with test funds
- ⚠️ The `.gitignore` file already protects these files

## 📝 Get Test AVAX

To use the application, you'll need test AVAX on Fuji testnet:

1. Visit: https://faucet.avax.network/
2. Select "Fuji (C-Chain)"
3. Enter your wallet address
4. Request test tokens

## 🌐 Useful Links

- **Avalanche Fuji Testnet Explorer**: https://testnet.snowtrace.io
- **Contract Address**: https://testnet.snowtrace.io/address/0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **Avalanche Faucet**: https://faucet.avax.network/
