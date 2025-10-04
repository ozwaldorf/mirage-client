import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID } from '../../constants';

export let ESCROW_ABI: any;
export let ESCROW_BYTECODE: string;

export async function loadArtifacts() {
	// Fetch ABI from static folder
	const abiResponse = await fetch('/artifacts/Escrow.json');
	const abiJson = await abiResponse.json();
	ESCROW_ABI = abiJson.abi;

	// Fetch bytecode from static folder
	const bytecodeResponse = await fetch('/artifacts/bytecode.hex');
	ESCROW_BYTECODE = (await bytecodeResponse.text()).trim();
}

export async function connectWallet() {
	if (typeof globalThis.ethereum === 'undefined') {
		throw new Error('MetaMask not installed');
	}

	const provider = new ethers.BrowserProvider(globalThis.ethereum);
	await provider.send('eth_requestAccounts', []);
	const signer = await provider.getSigner();
	const account = await signer.getAddress();

	const network = await provider.getNetwork();
	if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
		try {
			await globalThis.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x' + SEPOLIA_CHAIN_ID.toString(16) }]
			});
		} catch (_error) {
			throw new Error('Please switch to Sepolia testnet');
		}
	}

	return { provider, signer, account };
}

export function predictNextContractAddress(deployerAddress: string, nonce: number): string {
	const rlpEncoded = ethers.encodeRlp([deployerAddress, ethers.toBeHex(nonce)]);
	const hash = ethers.keccak256(rlpEncoded);
	return ethers.getAddress('0x' + hash.slice(26));
}
