# 🚀 OnchainSIP - Quick Start Guide

## ✅ Project Successfully Set Up!

Your OnchainSIP project is now ready to use. Here's everything you need to know:

---

## 📋 What Was Fixed

1. ✅ **Installed all dependencies** (root and frontend)
2. ✅ **Created environment files** (`.env` and `.env.local`)
3. ✅ **Fixed smart contract syntax** (removed invalid comments)
4. ✅ **Compiled smart contracts** successfully
5. ✅ **Started development server** on http://localhost:3000

---

## 🎯 How to Run the Project

### **Frontend (Next.js Application)**

```bash
# Navigate to frontend directory
cd "c:\Users\sangeeth karunakaran\Documents\GitHub\Onchain-avax\Onchain-SIP-main\frontend"

# Start development server
npm run dev
```

Then open: **http://localhost:3000**

### **Smart Contracts (Hardhat)**

```bash
# Navigate to root directory
cd "c:\Users\sangeeth karunakaran\Documents\GitHub\Onchain-avax\Onchain-SIP-main"

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Avalanche Fuji Testnet (requires real private key)
npx hardhat run scripts/deploy.js --network avaxFuji
```

---

## 🔐 Important: Update Your Private Key

The `.env` file currently has a **placeholder private key**. To deploy contracts or run tests that require signing, you need to:

1. Open `.env` file in the root directory
2. Replace the `PRIVATE_KEY` value with your actual MetaMask private key
3. **NEVER commit this file to git!** (it's already in `.gitignore`)

### How to Get Your Private Key:

1. Open MetaMask
2. Click the three dots → **Account Details**
3. Click **Export Private Key**
4. Enter your password
5. Copy the key **WITHOUT the '0x' prefix**
6. Paste it in `.env` file

⚠️ **Security Warning**: Only use a testnet wallet with test funds!

---

## 🌐 Access the Application

- **Local URL**: http://localhost:3000
- **Network**: Avalanche Fuji Testnet
- **Contract Address**: `0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b`
- **Block Explorer**: https://testnet.snowtrace.io/address/0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b

---

## 💰 Get Test AVAX

To use the application, you need test AVAX:

1. Visit: https://faucet.avax.network/
2. Select **"Fuji (C-Chain)"**
3. Enter your wallet address
4. Click **"Request 2 AVAX"**

---

## 📁 Project Structure

```
Onchain-SIP-main/
├── .env                      ← Backend environment (UPDATE PRIVATE KEY HERE!)
├── contracts/                ← Smart contracts
│   └── OnchainSIP.sol       ← Main SIP contract
├── scripts/                  ← Deployment scripts
├── test/                     ← Contract tests
├── hardhat.config.js         ← Hardhat configuration
│
└── frontend/                 ← Next.js application
    ├── .env.local           ← Frontend environment
    ├── app/                 ← Application pages
    ├── components/          ← React components
    ├── hooks/               ← Custom React hooks
    └── config/              ← Wagmi configuration
```

---

## 🛠️ Common Commands

### Frontend Commands (run in `frontend/` directory):

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run linter
```

### Backend Commands (run in root directory):

```bash
npx hardhat compile              # Compile contracts
npx hardhat test                 # Run tests
npx hardhat node                 # Start local blockchain
npx hardhat clean                # Clean artifacts
npx hardhat run scripts/deploy.js --network avaxFuji  # Deploy to Fuji
```

---

## 🎨 Features

- ✅ **Systematic Investment Plans (SIP)** on Avalanche
- ✅ **Native AVAX** and **ERC20 token** support
- ✅ **Automated execution** with customizable frequencies
- ✅ **Multiple SIP plans** per user
- ✅ **Portfolio tracking** and management
- ✅ **Web3 wallet integration** (MetaMask, WalletConnect, etc.)

---

## 🐛 Troubleshooting

### Issue: "Private key too short" error

**Solution**: Update the `PRIVATE_KEY` in `.env` with your actual 64-character private key

### Issue: "Wrong Network" warning in app

**Solution**: Switch MetaMask to **Avalanche Fuji Testnet**
- Network Name: Avalanche Fuji C-Chain
- RPC URL: https://api.avax-test.network/ext/bc/C/rpc
- Chain ID: 43113
- Symbol: AVAX
- Explorer: https://testnet.snowtrace.io

### Issue: Frontend won't start

**Solution**: Make sure you're in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```

### Issue: Contract compilation fails

**Solution**: Make sure you're in the root directory:
```bash
cd "c:\Users\sangeeth karunakaran\Documents\GitHub\Onchain-avax\Onchain-SIP-main"
npm install
npx hardhat compile
```

---

## 📚 Additional Resources

- **Hardhat Documentation**: https://hardhat.org/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **RainbowKit Documentation**: https://www.rainbowkit.com/docs
- **Avalanche Documentation**: https://docs.avax.network/
- **Wagmi Documentation**: https://wagmi.sh/

---

## 🎉 You're All Set!

Your OnchainSIP application is now running at **http://localhost:3000**

Connect your wallet and start creating SIP plans on Avalanche Fuji Testnet!
