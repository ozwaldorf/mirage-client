import { encrypt } from 'eciesjs';
import type { NetworkKeyStatus } from './stores/network';

export async function fetchNetworkKey(nodeApiUrl: string): Promise<NetworkKeyStatus> {
	const attestResponse = await fetch(`${nodeApiUrl}/attest`);
	const attestData = await attestResponse.json();
	const fullKey = attestData.publicKey;
	return {
		prefix: `${fullKey.slice(0, 6)}...${fullKey.slice(-4)}`,
		attested: attestData.attestation !== null || false,
		debug: attestData.isDebug || false,
		chainId: attestData.chainId
	};
}

export async function encryptAndSubmitSignal(
	nodeApiUrl: string,
	escrowAddress: string,
	tokenAddress: string,
	recipientAddress: string,
	transferAmount: bigint,
	rewardAmount: bigint
): Promise<string> {
	// Get global key from /attest endpoint
	const attestResponse = await fetch(`${nodeApiUrl}/attest`);
	const attestData = await attestResponse.json();
	const globalKeyHex = attestData.publicKey;

	// Build signal object
	const signal = {
		escrowContract: escrowAddress,
		tokenContract: tokenAddress,
		recipient: recipientAddress,
		transferAmount: transferAmount.toString(),
		rewardAmount: rewardAmount.toString(),
		selectorMapping: null
	};

	// Encrypt signal data using ECIES (matches Rust ecies crate format)
	const signalJson = JSON.stringify(signal);
	const signalBytes = new TextEncoder().encode(signalJson);

	// Convert hex public key to Uint8Array
	const publicKeyHex = globalKeyHex.replace('0x', '');
	const publicKeyBuffer = new Uint8Array(publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

	// Encrypt using eciesjs
	const encrypted = encrypt(publicKeyBuffer, signalBytes);

	// Convert encrypted Uint8Array to hex string
	const encryptedHex = '0x' + Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');

	// Submit to node
	const response = await fetch(`${nodeApiUrl}/signal`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(encryptedHex)
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Signal submission failed: ${error}`);
	}

	return await response.text();
}
