import { ethers, type JsonRpcSigner } from 'ethers';

export async function deployEscrow(
	artifacts: { ESCROW_ABI: any; ESCROW_BYTECODE: string },
	tokenAddress: string,
	recipientAddress: string,
	transferAmount: bigint,
	rewardAmount: bigint,
	signer: JsonRpcSigner
) {
	const { ESCROW_ABI, ESCROW_BYTECODE } = artifacts;

	const factory = new ethers.ContractFactory(ESCROW_ABI, ESCROW_BYTECODE, signer);
	const escrowContract = await factory.deploy(
		tokenAddress,
		recipientAddress,
		transferAmount,
		rewardAmount,
		transferAmount
	);

	// Return contract and hash immediately, caller can wait for deployment
	return {
		contract: escrowContract,
		deploymentHash: escrowContract.deploymentTransaction()?.hash
	};
}

export async function checkEscrowFunded(
	escrowAddress: string,
	escrow_abi: any,
	signer: JsonRpcSigner
): Promise<boolean> {
	try {
		const escrowContract = new ethers.Contract(escrowAddress, escrow_abi, signer);
		const funded = await escrowContract.funded();
		console.log(`Escrow ${escrowAddress} funded status:`, funded);
		return funded;
	} catch (error) {
		console.error(`Error checking funded status for ${escrowAddress}:`, error);
		return false;
	}
}
