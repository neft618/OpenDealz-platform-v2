import { BrowserProvider, Contract, formatEther, id, parseEther } from 'ethers'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

const escrowAbi = [
  'function fund(bytes32 dealId, address executor) payable',
  'function release(bytes32 dealId)',
  'function releasePartial(bytes32 dealId, uint256 amount)',
  'function refund(bytes32 dealId)',
  'function deals(bytes32 dealId) view returns (address customer, address executor, uint256 amount, uint256 releasedAmount, uint8 status)',
] as const

export const escrowConfig = {
  chainId: Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 11155111),
  chainName: import.meta.env.VITE_ESCROW_CHAIN_NAME || 'Sepolia',
  nativeSymbol: import.meta.env.VITE_ESCROW_NATIVE_SYMBOL || 'ETH',
  contractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '',
  rubPerNative: Number(import.meta.env.VITE_ESCROW_RUB_PER_NATIVE || 500000),
}

export function isEscrowReady() {
  return /^0x[a-fA-F0-9]{40}$/.test(escrowConfig.contractAddress) && !/^0x0{40}$/.test(escrowConfig.contractAddress)
}

export function dealId(contractId: string) {
  return id(contractId)
}

export function rubToNative(rub: number) {
  return Math.max(rub / escrowConfig.rubPerNative, 0.000001).toFixed(6)
}

export async function connectWallet() {
  const provider = getProvider()
  try {
    const accounts = (await provider.send('eth_requestAccounts', [])) as string[]
    if (!accounts.length) {
      throw new Error('В MetaMask нет доступных аккаунтов. Создайте или импортируйте аккаунт и разблокируйте кошелек.')
    }
    await ensureNetwork(provider)
    const signer = await provider.getSigner()
    return signer.getAddress()
  } catch (error) {
    throw normalizeWalletError(error)
  }
}

export async function fund(contractId: string, executorAddress: string, nativeAmount: string) {
  const contract = await getContract(true)
  const tx = await contract.fund(dealId(contractId), executorAddress, { value: parseEther(nativeAmount) })
  const receipt = await tx.wait()
  return receipt.hash as string
}

export async function release(contractId: string) {
  const contract = await getContract(true)
  const tx = await contract.release(dealId(contractId))
  const receipt = await tx.wait()
  return receipt.hash as string
}

export async function releasePartial(contractId: string, nativeAmount: string) {
  const contract = await getContract(true)
  const tx = await contract.releasePartial(dealId(contractId), parseEther(nativeAmount))
  const receipt = await tx.wait()
  return receipt.hash as string
}

export async function refund(contractId: string) {
  const contract = await getContract(true)
  const tx = await contract.refund(dealId(contractId))
  const receipt = await tx.wait()
  return receipt.hash as string
}

export async function readDeal(contractId: string) {
  const contract = await getContract(false)
  const item = await contract.deals(dealId(contractId))
  const status = Number(item.status)
  return {
    customer: item.customer as string,
    executor: item.executor as string,
    amount: formatEther(item.amount),
    releasedAmount: formatEther(item.releasedAmount),
    status: status === 1 ? 'funded' : status === 2 ? 'released' : status === 3 ? 'refunded' : 'empty',
  }
}

function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask не найден')
  return new BrowserProvider(window.ethereum)
}

async function getContract(withSigner: boolean) {
  if (!isEscrowReady()) throw new Error('Не задан адрес escrow-смарт-контракта')
  const provider = getProvider()
  await ensureNetwork(provider)
  const code = await provider.getCode(escrowConfig.contractAddress)
  if (code === '0x') {
    throw new Error(
      `В сети ${escrowConfig.chainName} по адресу ${escrowConfig.contractAddress} нет смарт-контракта. Проверьте адрес деплоя и VITE_ESCROW_CHAIN_ID.`,
    )
  }
  if (withSigner) return new Contract(escrowConfig.contractAddress, escrowAbi, await provider.getSigner())
  return new Contract(escrowConfig.contractAddress, escrowAbi, provider)
}

async function ensureNetwork(provider: BrowserProvider) {
  const current = await provider.getNetwork()
  if (Number(current.chainId) === escrowConfig.chainId) return
  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId: `0x${escrowConfig.chainId.toString(16)}` }])
  } catch (error) {
    throw normalizeWalletError(error)
  }
}

function normalizeWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''

  if (code === 'ACTION_REJECTED' || message.includes('4001') || message.includes('user rejected')) {
    if (message.includes('wallet must has at least one account')) {
      return new Error('MetaMask не вернул аккаунт: создайте или импортируйте аккаунт в MetaMask, разблокируйте кошелек и повторите подключение.')
    }
    return new Error('Подключение кошелька отменено в MetaMask. Откройте расширение и нажмите Connect/Подключить.')
  }

  if (message.includes('MetaMask не найден')) return new Error(message)
  if (message.includes('wallet_switchEthereumChain')) {
    return new Error(`Переключите MetaMask на сеть ${escrowConfig.chainName} и повторите действие.`)
  }

  return error instanceof Error ? error : new Error('Не удалось подключить MetaMask')
}
