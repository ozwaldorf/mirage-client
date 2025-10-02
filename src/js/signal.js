import { encrypt } from "eciesjs";

export async function fetchNetworkKey(nodeApiUrl) {
  const attestResponse = await fetch(`${nodeApiUrl}/attest`);
  const attestData = await attestResponse.json();
  console.log(attestData);

  const fullKey = attestData.publicKey;
  return {
    prefix: `${fullKey.slice(0, 6)}...${fullKey.slice(-4)}`,
    attested: attestData.attestation !== null || false,
    debug: attestData.isDebug || false,
    chainId: attestData.chainId,
    fullKey,
  };
}

export async function encryptAndSubmitSignal(
  nodeApiUrl,
  escrowAddress,
  tokenAddress,
  recipientAddress,
  transferAmount,
  rewardAmount,
) {
  // Get global key from /attest endpoint
  const { fullKey: globalKeyHex } = await fetchNetworkKey(nodeApiUrl);

  // Build signal object
  const signal = {
    escrow_contract: escrowAddress,
    token_contract: tokenAddress,
    recipient: recipientAddress,
    transfer_amount: transferAmount.toString(),
    reward_amount: rewardAmount.toString(),
    selector_mapping: null,
  };

  // Encrypt signal data using ECIES (matches Rust ecies crate format)
  const signalJson = JSON.stringify(signal);
  const signalBytes = new TextEncoder().encode(signalJson);

  // Convert hex public key to Buffer
  const publicKeyBuffer = Buffer.from(globalKeyHex.replace("0x", ""), "hex");

  // Encrypt using eciesjs (compatible with Rust ecies crate)
  const encrypted = encrypt(publicKeyBuffer, signalBytes);
  const encryptedSignal = "0x" + Buffer.from(encrypted).toString("hex");

  // Submit to node
  const response = await fetch(`${nodeApiUrl}/signal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(encryptedSignal),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Signal submission failed: ${error}`);
  }

  return await response.text();
}
