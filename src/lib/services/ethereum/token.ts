import { ethers, type JsonRpcSigner } from "ethers";
import { ERC20_ABI } from "../../constants";

export interface TokenInfo {
  symbol: string;
  decimals: number;
  name: string;
}

export async function getTokenInfo(
  tokenAddress: string,
  signer: JsonRpcSigner,
): Promise<TokenInfo> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const [name, symbol, decimals] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.decimals().then((n) => Number(n)),
  ]);
  return { name, symbol, decimals };
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  return ethers.parseUnits(amount, decimals);
}

export async function approveTokens(
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
  signer: JsonRpcSigner,
) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.approve(spenderAddress, amount);
}

export async function getTokenBalance(
  tokenAddress: string,
  owner: string,
  signer: JsonRpcSigner,
): Promise<bigint> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.balanceOf(owner);
}

export async function getAllowance(
  tokenAddress: string,
  owner: string,
  spender: string,
  signer: JsonRpcSigner,
): Promise<bigint> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.allowance(owner, spender);
}
