Decentralized Betting Game + Secure Vault + Demo Wallet dApp
Overview

This project is a multi-feature decentralized application (dApp) combining:

A provably fair betting game

A secure encrypted file vault

A demo crypto wallet

MetaMask integration for real blockchain interaction

It showcases how blockchain, cryptography, and Web3 wallets can work together inside one unified app.

Features
✅ Betting Game

Simple, interactive on-chain betting system

Transparent and fair logic through smart contracts

Uses demo wallet funds for risk-free gameplay

Real-time result updates

✅ Secure File Vault

Upload and store files with client-side encryption

Only the owner can decrypt and access stored files

Demonstrates decentralized and safe storage concepts

✅ Demo Wallet

Built-in simulated wallet for beginners

Provides test balance to explore the dApp

Displays balance, history, and transaction status

✅ MetaMask Connection

Users can connect their actual MetaMask wallet

Supports authentication and sending transactions

Demonstrates real Web3 wallet–dApp interaction

Tech Stack

Frontend: React / Next.js (or your actual framework)

Blockchain: Solidity, Hardhat / Remix

Wallets: MetaMask, demo in-app wallet

Storage: Encryption + decentralized storage layer (IPFS or similar)

How It Works

Connect Wallet (Demo or MetaMask)

Play the Betting Game, placing bets securely using wallet balance

Upload Files to the vault, where they are encrypted before storage

Interact with Smart Contracts for game results, vault actions, or wallet updates

Installation
git clone <repo-link>
cd project-folder
npm install
npm run dev


For blockchain deployment:

npx hardhat compile
npx hardhat deploy

Future Improvements

Add multiple game modes

Two-factor authentication for vault

Support for more wallets (WalletConnect, Coinbase Wallet)

Dark mode UI

License

This project is open-source and free to use under the MIT License.
