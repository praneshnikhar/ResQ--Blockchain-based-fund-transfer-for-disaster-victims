# ResQ DApp

This is a Next.js frontend for a simple decentralized donation application (DApp) that interacts with a smart contract on an Ethereum-based network.

## Core Features

- **Connect Wallet**: Connect to a Web3 wallet like MetaMask.
- **Donate**: Send MATIC/ETH to the smart contract.
- **View Balance**: See the total amount of funds held by the contract.
- **Admin Panel**:
  - Verify recipient addresses.
  - Release funds to verified recipients.

## Getting Started


First, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Smart Contract

This frontend is designed to work with a pre-deployed smart contract. To connect to your own contract, you need to:

1.  **Update the Contract Address**: Open `src/lib/constants.ts` and replace the placeholder `CONTRACT_ADDRESS` with your own deployed contract address.
2.  **Update the ABI**: If your contract's functions are different, update the ABI in `src/lib/abi.json`.

The application is configured to connect to the Polygon Mumbai testnet, but you can change the network in your MetaMask wallet.

<img width="756" alt="Image" src="https://github.com/user-attachments/assets/b78d76c1-6db6-472c-94c5-b2d579109685" />

<img width="1452" alt="Image" src="https://github.com/user-attachments/assets/c3e96b03-4328-4f6b-b4c4-e872bf0ac9ed" />
