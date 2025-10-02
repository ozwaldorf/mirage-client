import { ethers } from "ethers";
import {
  checkFormValidity,
  elements,
  showStatus,
  updateNetworkKeyDisplay,
} from "./ui.js";
import {
  connectWallet as walletConnect,
  ESCROW_ABI,
  ESCROW_BYTECODE,
  loadArtifacts,
  predictNextContractAddress,
} from "./wallet.js";
import {
  approveTokens as tokenApprove,
  getAllowance,
  getTokenBalance,
  getTokenDecimals,
  parseTokenAmount,
  resetTokenDecimals,
} from "./token.js";
import { checkEscrowFunded, deployEscrow } from "./escrow.js";
import {
  encryptAndSubmitSignal as submitSignal,
  fetchNetworkKey as fetchKey,
} from "./signal.js";

let provider, signer, account, escrowAddress, tokensApproved, walletChainId;
let networkKeyStatus;
let cachedDecimals = null;
let cachedTokenAddress = null;
let cachedGasPriceWei = null;
let cachedGasPriceGwei = null;

async function fetchGasPrice() {
  try {
    // Fetch gas price from Etherscan
    const response = await fetch(
      "https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle",
    );
    const data = await response.json();
    cachedGasPriceGwei = parseFloat(data.result.ProposeGasPrice);

    // Convert to wei (1 gwei = 1e9 wei) using float math, then round and convert to BigInt
    const gasPriceWeiFloat = cachedGasPriceGwei * 1e9;
    cachedGasPriceWei = BigInt(Math.round(gasPriceWeiFloat));

    // Recalculate reward with new gas price
    calculateReward();
  } catch (error) {
    console.error("Failed to fetch gas price:", error);
    // Default to 1.6 gwei on failure
    cachedGasPriceGwei = 1.6;
    cachedGasPriceWei = BigInt(Math.round(cachedGasPriceGwei * 1e9));
    calculateReward();
  }
}

function calculateReward() {
  try {
    const tokenAmount = parseFloat(elements.tokenAmountInput.value) || 0;

    // ETH to USD rate: 1/4500 ETH per USD, so 4500 USD per ETH
    // TODO: fetch this rate from uniswap contract
    const ethToUsdRate = 4500;

    // Calculate gas cost in ETH: gasPriceWei * 1056000 / 1e18
    const gasCostEth = Number(cachedGasPriceWei * BigInt(1056000)) / 1e18;

    // Convert to USD
    const rewardUsd = (gasCostEth * ethToUsdRate) + (tokenAmount * 0.05);

    // Display gas price in label (rounded to 3 decimals)
    elements.rewardAmountLabel.textContent = `Reward = 5% fee + (${
      cachedGasPriceGwei.toFixed(3)
    } gwei * gas / 4500 usd per eth)`;

    elements.rewardAmountInput.value = rewardUsd.toFixed(
      Number(cachedDecimals),
    );
    elements.rewardAmountInput.disabled = true;
  } catch (error) {
    console.error("Failed to calculate reward:", error);
  }
}

async function fetchNetworkKey() {
  try {
    const nodeApiUrl = elements.nodeApiUrlInput.value;
    if (!nodeApiUrl) return;

    networkKeyStatus = await fetchKey(nodeApiUrl);
    updateNetworkKeyDisplay(networkKeyStatus, walletChainId);
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
    });
  } catch (error) {
    console.error("Failed to fetch network key:", error);
    networkKeyStatus.prefix = "Error";
    updateNetworkKeyDisplay(networkKeyStatus);
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
    });
  }
}

async function connectWallet() {
  try {
    await loadArtifacts();

    const walletData = await walletConnect();
    provider = walletData.provider;
    signer = walletData.signer;
    account = walletData.account;

    // Get wallet chain ID
    const network = await provider.getNetwork();
    walletChainId = Number(network.chainId);
    updateNetworkKeyDisplay(networkKeyStatus, walletChainId);

    elements.connectWalletBtn.textContent = `${account.slice(0, 6)}...${
      account.slice(-4)
    }`;
    elements.connectWalletBtn.title = account;
    elements.connectWalletBtn.disabled = false;

    elements.recipientAddressInput.placeholder = account;

    // Set token amount placeholder to wallet balance
    if (elements.tokenContractInput.value) {
      try {
        if (cachedTokenAddress !== elements.tokenContractInput.value) {
          cachedTokenAddress = elements.tokenContractInput.value;
          resetTokenDecimals();
          cachedDecimals = await getTokenDecimals(cachedTokenAddress, signer);
        }
        const balance = await getTokenBalance(
          cachedTokenAddress,
          account,
          signer,
        );
        const balanceFormatted = ethers.formatUnits(balance, cachedDecimals);
        elements.tokenAmountInput.placeholder = balanceFormatted;
        elements.rewardAmountInput.placeholder =
          (parseFloat(balanceFormatted) * 0.05).toString();

        // Check if already approved and deployed
        if (
          elements.tokenAmountInput.value && elements.rewardAmountInput.value
        ) {
          const nonce = await provider.getTransactionCount(account);
          const tokenAmount = parseTokenAmount(
            elements.tokenAmountInput.value,
            cachedDecimals,
          );
          const rewardAmount = parseTokenAmount(
            elements.rewardAmountInput.value,
            cachedDecimals,
          );
          const totalAmount = BigInt(tokenAmount) + BigInt(rewardAmount);

          // Check last 2 nonces for deployed contract
          let foundContract = false;
          for (let i = 0; i < 2; i++) {
            const checkNonce = nonce - i;
            if (checkNonce < 0) break;

            const checkAddress = predictNextContractAddress(
              account,
              checkNonce,
            );
            const code = await provider.getCode(checkAddress);

            if (code !== "0x") {
              // Check if funded by calling funded() method
              const isFunded = await checkEscrowFunded(checkAddress, {
                ESCROW_ABI,
                ESCROW_BYTECODE,
              }, signer);

              if (isFunded) {
                escrowAddress = checkAddress;
                elements.approveBtn.classList.add("success");
                elements.approveBtn.textContent = "Approved";
                elements.deployBondBtn.classList.add("success");
                elements.deployBondBtn.textContent = "Deployed";
                showStatus(
                  `Contract already deployed and funded at ${checkAddress}`,
                  "success",
                );
                foundContract = true;
                break;
              } else {
                showStatus(
                  `Contract at ${checkAddress} exists but not funded`,
                  "info",
                );
              }
            }
          }

          if (!foundContract) {
            // Check if approved for next deployment (nonce + 1)
            const nextNonceAddress = predictNextContractAddress(
              account,
              nonce + 1,
            );
            const allowance = await getAllowance(
              elements.tokenContractInput.value,
              account,
              nextNonceAddress,
              signer,
            );

            if (allowance >= totalAmount) {
              tokensApproved = true;
              elements.approveBtn.classList.add("success");
              elements.approveBtn.textContent = "Approved";
              showStatus(`Already approved for ${nextNonceAddress}`, "success");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch token balance:", error);
      }
    }

    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

async function approveTokens() {
  const originalText = elements.approveBtn.textContent;
  try {
    elements.approveBtn.classList.remove("error", "success");
    elements.approveBtn.classList.add("waiting");
    elements.approveBtn.textContent = "Confirming...";
    showStatus("Approving tokens...", "info");

    const tokenAddress = elements.tokenContractInput.value;
    const tokenAmount = elements.tokenAmountInput.value;
    const rewardAmount = elements.rewardAmountInput.value;

    if (!tokenAddress || !tokenAmount || !rewardAmount) {
      throw new Error("Please fill in all fields");
    }

    if (cachedTokenAddress !== tokenAddress) {
      cachedTokenAddress = tokenAddress;
      resetTokenDecimals();
      cachedDecimals = await getTokenDecimals(tokenAddress, signer);
    }
    const totalAmount = parseTokenAmount(tokenAmount, cachedDecimals) +
      parseTokenAmount(rewardAmount, cachedDecimals);

    // Get current nonce and predict next contract address
    const nonce = await provider.getTransactionCount(account);
    const predictedEscrowAddress = predictNextContractAddress(
      account,
      nonce + 1,
    );

    showStatus(`Predicted escrow address: ${predictedEscrowAddress}`, "info");

    // Approve for predicted escrow contract address
    const tx = await tokenApprove(
      tokenAddress,
      predictedEscrowAddress,
      totalAmount,
      signer,
    );
    showStatus(`Waiting for approval transaction: ${tx.hash}`, "info");

    await tx.wait(1);
    tokensApproved = true;
    elements.approveBtn.classList.remove("waiting");
    elements.approveBtn.classList.add("success");
    elements.approveBtn.textContent = "Approved";
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
    });
    showStatus(
      `Tokens approved for ${predictedEscrowAddress}! Tx: ${tx.hash}`,
      "success",
    );
  } catch (error) {
    elements.approveBtn.classList.remove("waiting");
    elements.approveBtn.classList.add("error");
    elements.approveBtn.textContent = originalText;
    showStatus(`Error: ${error.message}`, "error");
  }
}

async function deployAndBondEscrow() {
  const originalText = elements.deployBondBtn.textContent;
  try {
    elements.deployBondBtn.classList.remove("error", "success");
    elements.deployBondBtn.classList.add("waiting");
    elements.deployBondBtn.textContent = "Confirming...";
    showStatus("Fetching bytecode...", "info");

    const tokenAddress = elements.tokenContractInput.value;
    const tokenAmount = elements.tokenAmountInput.value;
    const rewardAmount = elements.rewardAmountInput.value;
    const recipientAddress = elements.recipientAddressInput.value;

    if (!tokenAddress || !tokenAmount || !rewardAmount || !recipientAddress) {
      throw new Error("Please fill in all fields");
    }

    if (cachedTokenAddress !== tokenAddress) {
      cachedTokenAddress = tokenAddress;
      resetTokenDecimals();
      cachedDecimals = await getTokenDecimals(tokenAddress, signer);
    }
    const transferAmount = parseTokenAmount(tokenAmount, cachedDecimals);
    const rewardAmountParsed = parseTokenAmount(rewardAmount, cachedDecimals);

    showStatus("Deploying escrow contract...", "info");

    escrowAddress = await deployEscrow(
      { ESCROW_ABI, ESCROW_BYTECODE },
      tokenAddress,
      recipientAddress,
      transferAmount,
      rewardAmountParsed,
      signer,
    );

    elements.deployBondBtn.classList.remove("waiting");
    elements.deployBondBtn.classList.add("success");
    elements.deployBondBtn.textContent = "Deployed";
    showStatus(`Escrow deployed at: ${escrowAddress}`, "success");
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
    });
  } catch (error) {
    elements.deployBondBtn.classList.remove("waiting");
    elements.deployBondBtn.classList.add("error");
    elements.deployBondBtn.textContent = originalText;
    showStatus(`Error: ${error.message}`, "error");
    console.error(error);
  }
}

async function encryptAndSubmitSignal() {
  const originalText = elements.submitSignalBtn.textContent;
  try {
    elements.submitSignalBtn.classList.remove("error", "success");
    elements.submitSignalBtn.classList.add("waiting");
    elements.submitSignalBtn.textContent = "Confirming...";
    if (!escrowAddress) {
      throw new Error("Please deploy and bond escrow first");
    }

    showStatus("Fetching global key from node...", "info");

    const nodeApiUrl = elements.nodeApiUrlInput.value;
    const tokenAddress = elements.tokenContractInput.value;
    const tokenAmount = elements.tokenAmountInput.value;
    const rewardAmount = elements.rewardAmountInput.value;
    const recipientAddress = elements.recipientAddressInput.value;

    showStatus("Encrypting signal...", "info");

    if (cachedTokenAddress !== tokenAddress) {
      cachedTokenAddress = tokenAddress;
      resetTokenDecimals();
      cachedDecimals = await getTokenDecimals(tokenAddress, signer);
    }
    const transferAmount = parseTokenAmount(tokenAmount, cachedDecimals);
    const rewardAmountParsed = parseTokenAmount(rewardAmount, cachedDecimals);

    showStatus("Submitting signal to node...", "info");

    const result = await submitSignal(
      nodeApiUrl,
      escrowAddress,
      tokenAddress,
      recipientAddress,
      transferAmount,
      rewardAmountParsed,
    );

    elements.submitSignalBtn.classList.remove("waiting");
    elements.submitSignalBtn.classList.add("success");
    elements.submitSignalBtn.textContent = "Submitted";
    showStatus(`Signal submitted successfully! ${result}`, "success");
  } catch (error) {
    elements.submitSignalBtn.classList.remove("waiting");
    elements.submitSignalBtn.classList.add("error");
    elements.submitSignalBtn.textContent = originalText;
    showStatus(`Error: ${error.message}`, "error");
    console.error(error);
  }
}

// Attempt to reconnect on load
async function tryReconnect() {
  if (globalThis.ethereum) {
    try {
      const accounts = await globalThis.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
    }
  }
}

// Handle account changes
if (globalThis.ethereum) {
  globalThis.ethereum.on("accountsChanged", async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      elements.connectWalletBtn.textContent = "Connect Wallet";
      elements.connectWalletBtn.disabled = false;
      elements.approveBtn.disabled = true;
      elements.deployBondBtn.disabled = true;
      elements.submitSignalBtn.disabled = true;
      provider = null;
      signer = null;
      account = null;
    } else {
      // User switched accounts
      await connectWallet();
    }
  });

  globalThis.ethereum.on("chainChanged", () => {
    // Reload page on chain change
    globalThis.location.reload();
  });
}

// Try to reconnect on page load
tryReconnect();

// Prefetch network key on page load
fetchNetworkKey();

// Refresh network key status every 5 seconds
setInterval(fetchNetworkKey, 5000);

// Prefetch gas price and calculate reward on page load
fetchGasPrice();

// Refresh gas price every 12 seconds
setInterval(fetchGasPrice, 12000);

// Event listeners
elements.connectWalletBtn.addEventListener("click", async () => {
  if (account) {
    // Copy address to clipboard
    try {
      await navigator.clipboard.writeText(account);
      const originalText = elements.connectWalletBtn.textContent;
      elements.connectWalletBtn.textContent = "Copied!";
      setTimeout(() => {
        elements.connectWalletBtn.textContent = originalText;
      }, 1000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  } else {
    await connectWallet();
  }
});
elements.approveBtn.addEventListener("click", approveTokens);
elements.deployBondBtn.addEventListener("click", deployAndBondEscrow);
elements.submitSignalBtn.addEventListener("click", encryptAndSubmitSignal);

// Add input listeners to check form validity
[
  elements.tokenContractInput,
  elements.tokenAmountInput,
  elements.rewardAmountInput,
  elements.recipientAddressInput,
  elements.nodeApiUrlInput,
].forEach((input) => {
  input.addEventListener(
    "input",
    () =>
      checkFormValidity({
        account,
        escrowAddress,
        tokensApproved,
        networkKeyStatus,
        walletChainId,
      }),
  );
});

// Refresh network key status when node API URL changes
elements.nodeApiUrlInput.addEventListener("input", fetchNetworkKey);

// Validate and format token amount input
function validateTokenInput(inputElement) {
  let value = inputElement.value;

  // Allow only digits, one decimal point, and remove other characters
  value = value.replace(/[^\d.]/g, "");

  // Ensure only one decimal point
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts.slice(1).join("");
  }

  // Limit decimal places based on token decimals
  if (cachedDecimals !== null && parts.length === 2 && parts[1].length > 0) {
    const decimals = Number(cachedDecimals);
    const decimalPart = parts[1].slice(0, decimals);
    value = parts[0] + "." + decimalPart;
  }

  inputElement.value = value;
}

// Auto-calculate reward amount based on token amount and gas price
elements.tokenAmountInput.addEventListener("input", () => {
  validateTokenInput(elements.tokenAmountInput);
  calculateReward();
});
