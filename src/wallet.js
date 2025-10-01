import { ethers } from "ethers";
import escrowAbiFile from "../artifacts/Escrow.json";
import bytecodeFile from "../artifacts/bytecode.hex";

const SEPOLIA_CHAIN_ID = 11155111;

export let ESCROW_ABI, ESCROW_BYTECODE;

export async function loadArtifacts() {
  const abiResponse = await fetch(escrowAbiFile);
  const abiJson = await abiResponse.json();
  ESCROW_ABI = abiJson.abi;

  const bytecodeResponse = await fetch(bytecodeFile);
  ESCROW_BYTECODE = (await bytecodeResponse.text()).trim();
}

export async function connectWallet() {
  if (typeof globalThis.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(globalThis.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    try {
      await globalThis.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + SEPOLIA_CHAIN_ID.toString(16) }],
      });
    } catch (_error) {
      throw new Error("Please switch to Sepolia testnet");
    }
  }

  return { provider, signer, account };
}

export function predictNextContractAddress(deployerAddress, nonce) {
  const rlpEncoded = ethers.encodeRlp([
    deployerAddress,
    ethers.toBeHex(nonce),
  ]);
  const hash = ethers.keccak256(rlpEncoded);
  return ethers.getAddress("0x" + hash.slice(26));
}
