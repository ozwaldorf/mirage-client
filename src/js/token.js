import { ethers } from "ethers";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

let tokenDecimals;

export async function getTokenDecimals(tokenAddress, signer) {
  if (tokenDecimals !== undefined) return tokenDecimals;
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  tokenDecimals = await tokenContract.decimals();
  return tokenDecimals;
}

export function parseTokenAmount(amount, decimals) {
  return ethers.parseUnits(amount, decimals);
}

export async function approveTokens(
  tokenAddress,
  spenderAddress,
  amount,
  signer,
) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.approve(spenderAddress, amount);
}

export async function getTokenBalance(tokenAddress, owner, signer) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.balanceOf(owner);
}

export async function getAllowance(tokenAddress, owner, spender, signer) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.allowance(owner, spender);
}

export function resetTokenDecimals() {
  tokenDecimals = undefined;
}

export async function getTokenSymbol(tokenAddress, signer) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.symbol();
}

export async function getTokenName(tokenAddress, signer) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.name();
}
