import { ethers } from "ethers";

export async function deployEscrow(
  artifacts,
  tokenAddress,
  recipientAddress,
  transferAmount,
  rewardAmount,
  signer,
) {
  const { ESCROW_ABI, ESCROW_BYTECODE } = artifacts;

  const factory = new ethers.ContractFactory(
    ESCROW_ABI,
    ESCROW_BYTECODE,
    signer,
  );
  const escrowContract = await factory.deploy(
    tokenAddress,
    recipientAddress,
    transferAmount,
    rewardAmount,
    transferAmount,
  );

  // Return contract and hash immediately, caller can wait for deployment
  return {
    contract: escrowContract,
    deploymentHash: escrowContract.deploymentTransaction()?.hash,
  };
}

export async function checkEscrowFunded(escrowAddress, escrow_abi, signer) {
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
