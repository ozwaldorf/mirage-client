# Mirage Escrow Client

Simple HTML client for interacting with Mirage escrow contracts on Sepolia testnet.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build (downloads artifacts and bundles):

```bash
npm run build
```

3. Serve the built files:

```bash
npx serve dist
```

Or use dev server:

```bash
npm run dev
```

4. Open `http://localhost:8000` in a browser with MetaMask installed

## Usage

1. **Connect Wallet** - Connect MetaMask to Sepolia testnet
2. **Fill Signal Options** - Enter token contract, amounts, recipient, and URLs
3. **Approve Tokens** - Approve ERC20 tokens for deposit
4. **Deploy & Bond Escrow** - Deploy new escrow contract and bond to it
5. **Encrypt & Submit Signal** - Encrypt signal with node's public key and submit to API

## Requirements

- Node.js
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH
- ERC20 tokens on Sepolia
- Node API endpoint (default: `http://localhost:3000`)
