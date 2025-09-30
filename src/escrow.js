import { ethers } from 'ethers';

export async function deployEscrow(artifacts, tokenAddress, recipientAddress, transferAmount, rewardAmount, signer) {
  const { ESCROW_ABI, ESCROW_BYTECODE } = artifacts;

  const factory = new ethers.ContractFactory(ESCROW_ABI, ESCROW_BYTECODE, signer);
  const escrowContract = await factory.deploy(
    tokenAddress,
    recipientAddress,
    transferAmount,
    rewardAmount,
    transferAmount
  );

  await escrowContract.waitForDeployment();
  return escrowContract.target;
}

export async function checkEscrowFunded(escrowAddress, artifacts, signer) {
  const { ESCROW_ABI } = artifacts;
  const escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
  return await escrowContract.funded();
}
