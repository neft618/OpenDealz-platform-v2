# Open Dealz Platform V2
<img width="1537" height="842" alt="image" src="https://github.com/user-attachments/assets/caa5b2ac-4108-47f2-acf5-ffbf44508300" />

Clean React/Vite prototype for the ВКР platform: customers publish IT projects with tags, executors apply with terms, customers create fixed-price or milestone contracts, both sides sign, and the customer can fund/release escrow through MetaMask.

## Stack

- React + TypeScript + Vite
- Supabase Auth, Postgres, RLS
- EVM testnet escrow through MetaMask and `ethers`

## Supabase

Project ref: `xrwsgrulzlwnljsczlbo`

The database schema is normalized around profiles, roles, wallets, projects, applications, contracts, milestones, deliverables, escrow transactions, disputes, messages, reviews, notifications, document templates, and settings.

## Run

```bash
pnpm install
pnpm dev
```

## Escrow

Deploy `contracts/ProjectEscrow.sol` to Sepolia or another EVM testnet and set:

```bash
VITE_ESCROW_CONTRACT_ADDRESS=<deployed_contract_address>
```

The current Solidity contract supports full release, partial `releasePartial` payments for milestone contracts, and admin arbitration through `refund` / `release`. Redeploy it after pulling these changes if you want milestone payouts and dispute resolution to be sent on-chain. The deployer address becomes the escrow arbiter.

Until the contract address is configured, the app still works for projects, applications, contract creation, signing, chat, deliverables, and reviews; on-chain payment buttons remain disabled.
