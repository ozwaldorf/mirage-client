export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = 'wss://ethereum-sepolia-rpc.publicnode.com';

export const ERC20_ABI = [
	'function approve(address spender, uint256 amount) returns (bool)',
	'function decimals() view returns (uint8)',
	'function balanceOf(address owner) view returns (uint256)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'function symbol() view returns (string)',
	'function name() view returns (string)'
];

export const CHAIN_NAMES: Record<number, string> = {
	1: 'Mainnet',
	11155111: 'Sepolia',
	17000: 'Holesky',
	137: 'Polygon',
	10: 'Optimism',
	42161: 'Arbitrum',
	8453: 'Base'
};

export function getEtherscanUrl(chainId: number): string {
	return chainId === 11155111 ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';
}
