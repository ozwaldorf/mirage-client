import { ethers } from "ethers";
import {
  checkFormValidity,
  elements,
  showStatus,
  showTransferStatus,
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
  getTokenSymbol,
  parseTokenAmount,
  resetTokenDecimals,
} from "./token.js";
import { checkEscrowFunded, deployEscrow } from "./escrow.js";
import {
  encryptAndSubmitSignal as submitSignal,
  fetchNetworkKey as fetchKey,
} from "./protocol.js";
import { transferMonitor } from "./monitor.js";

let provider, signer, account, escrowAddress, tokensApproved, walletChainId;
let networkKeyStatus;
let cachedDecimals = null;
let cachedTokenAddress = null;
let cachedGasPriceWei = null;
let cachedGasPriceGwei = null;
let etherscanBaseUrl = "https://etherscan.io";
let approveClicked = false;
let deployClicked = false;
let submitClicked = false;

function setupGasPriceListener() {
  if (!provider) return;

  // Listen for new blocks and update gas price
  provider.on("block", async () => {
    // Stop updating if approve has been clicked
    if (approveClicked) return;

    try {
      const gasPriceHex = await provider.send("eth_gasPrice", []);
      cachedGasPriceWei = BigInt(gasPriceHex);
      cachedGasPriceGwei = Number(cachedGasPriceWei) / 1e9;
      calculateReward();
    } catch (error) {
      console.error("Failed to fetch gas price:", error);
    }
  });
}

async function fetchGasPrice() {
  try {
    if (!provider) {
      // Default to 1.6 gwei if no provider
      cachedGasPriceGwei = 1.6;
      cachedGasPriceWei = BigInt(Math.round(cachedGasPriceGwei * 1e9));
      calculateReward();
      return;
    }

    // Fetch gas price using eth_gasPrice RPC call (returns hex string)
    const gasPriceHex = await provider.send("eth_gasPrice", []);
    cachedGasPriceWei = BigInt(gasPriceHex);

    // Convert to gwei for display
    cachedGasPriceGwei = Number(cachedGasPriceWei) / 1e9;

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

    // Update reward label with full formula, using mwei if gwei is < 0.01
    let gasPriceDisplay;
    if (cachedGasPriceGwei < 0.01) {
      const gasPriceMwei = cachedGasPriceGwei * 1000;
      gasPriceDisplay = `${gasPriceMwei.toFixed(2)} mwei`;
    } else {
      gasPriceDisplay = `${cachedGasPriceGwei.toFixed(1)} gwei`;
    }

    elements.rewardAmountLabel.textContent =
      `5% + (${gasPriceDisplay} × gas / ${ethToUsdRate} USD/ETH)`;

    elements.rewardAmountInput.value = rewardUsd.toFixed(
      Number(cachedDecimals),
    );
    elements.rewardAmountInput.disabled = true;

    // Calculate and display total
    const amount = parseFloat(elements.tokenAmountInput.value) || 0;
    const total = amount + rewardUsd;

    // Update total label with calculation
    elements.totalAmountLabel.textContent = `Total = ${amount.toFixed(2)} + ${
      rewardUsd.toFixed(2)
    }`;

    elements.totalAmountInput.value = total.toFixed(Number(cachedDecimals));
    elements.totalAmountInput.disabled = true;

    // Update approve title with total
    updateApproveTitle();
  } catch (error) {
    console.error("Failed to calculate reward:", error);
  }
}

function updateApproveTitle(symbol = null) {
  const tokenSymbol = symbol || elements.tokenSymbolInput.value;
  const tokenAmount = elements.tokenAmountInput.value;
  const rewardAmount = elements.rewardAmountInput.value;

  if (!tokenSymbol) {
    elements.approveTitle.textContent = "Approve Tokens";
  } else if (!tokenAmount || !rewardAmount) {
    elements.approveTitle.textContent = `Approve ${tokenSymbol}`;
  } else {
    const total = parseFloat(tokenAmount) + parseFloat(rewardAmount);
    const decimals = cachedDecimals !== null ? Number(cachedDecimals) : 2;
    elements.approveTitle.textContent = `Approve ${
      total.toFixed(decimals)
    } ${tokenSymbol}`;
  }
}

async function fetchTokenInfo() {
  try {
    const tokenAddress = elements.tokenContractInput.value;
    if (!tokenAddress || !signer) {
      elements.tokenSymbolInput.value = "";
      elements.approveTitle.textContent = "Approve Tokens";
      return;
    }

    const symbol = await getTokenSymbol(tokenAddress, signer);

    elements.tokenSymbolInput.value = symbol;

    // Update approve title with token symbol
    updateApproveTitle(symbol);
  } catch (error) {
    console.error("Failed to fetch token info:", error);
    elements.tokenSymbolInput.value = "";
    elements.approveTitle.textContent = "Approve Tokens";
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
      approveClicked,
    });
  } catch (error) {
    console.error("Failed to fetch network key:", error);
    updateNetworkKeyDisplay(networkKeyStatus);
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
      approveClicked,
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

    // Update etherscan URL based on chain
    etherscanBaseUrl = walletChainId === 11155111
      ? "https://sepolia.etherscan.io"
      : "https://etherscan.io";

    updateNetworkKeyDisplay(networkKeyStatus, walletChainId);

    elements.connectWalletBtn.textContent = `${account.slice(0, 6)}...${
      account.slice(-4)
    }`;
    elements.connectWalletBtn.title = account;
    elements.connectWalletBtn.disabled = false;

    elements.recipientAddressInput.placeholder = account;

    // Fetch initial gas price and setup WebSocket listener for updates
    await fetchGasPrice();
    setupGasPriceListener();

    // Fetch token info
    await fetchTokenInfo();

    // Set token amount placeholder to wallet balance
    if (elements.tokenContractInput.value) {
      try {
        if (cachedTokenAddress !== elements.tokenContractInput.value) {
          cachedTokenAddress = elements.tokenContractInput.value;
          resetTokenDecimals();
          cachedDecimals = await getTokenDecimals(cachedTokenAddress, signer);
          // Recalculate reward with correct decimals if token amount is already filled
          calculateReward();
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

        // Only check if already approved and deployed if form has values
        const hasFormValues = elements.tokenAmountInput.value &&
          elements.recipientAddressInput.value;

        let foundContract = false;
        let nonce;
        if (hasFormValues) {
          // Check if already approved and deployed
          nonce = await provider.getTransactionCount(account);

          // Check last 2 nonces for deployed contract
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
              const isFunded = await checkEscrowFunded(
                checkAddress,
                ESCROW_ABI,
                signer,
              );

              if (isFunded) {
                escrowAddress = checkAddress;
                tokensApproved = true;
                elements.approveBtn.classList.add("verified");
                elements.approveBtn.textContent = "Verified";
                elements.deployBondBtn.classList.add("verified");
                elements.deployBondBtn.textContent = "Verified";
                elements.deployHash.innerHTML =
                  `<a href="${etherscanBaseUrl}/address/${escrowAddress}" target="_blank" rel="noopener noreferrer">${
                    escrowAddress.substring(0, 10)
                  }</a>`;
                showStatus(
                  `Found existing escrow at ${escrowAddress}`,
                  "success",
                );
                foundContract = true;
                break;
              }
            }
          }
        }

        // If we have token amount and reward, check approvals
        if (
          !foundContract && elements.tokenAmountInput.value &&
          elements.rewardAmountInput.value
        ) {
          if (nonce === undefined) {
            nonce = await provider.getTransactionCount(account);
          }

          const tokenAmount = parseTokenAmount(
            elements.tokenAmountInput.value,
            cachedDecimals,
          );
          const rewardAmount = parseTokenAmount(
            elements.rewardAmountInput.value,
            cachedDecimals,
          );
          const totalAmount = BigInt(tokenAmount) + BigInt(rewardAmount);

          {
            // Check if approved for next deployment nonce
            const nextNonceAddress = predictNextContractAddress(
              account,
              nonce,
            );
            const allowance = await getAllowance(
              elements.tokenContractInput.value,
              account,
              nextNonceAddress,
              signer,
            );

            if (allowance >= totalAmount) {
              tokensApproved = true;
              elements.approveBtn.classList.add("verified");
              elements.approveBtn.textContent = "Verified";
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
      approveClicked,
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

async function approveTokens() {
  approveClicked = true;
  checkFormValidity({
    account,
    escrowAddress,
    tokensApproved,
    networkKeyStatus,
    walletChainId,
    approveClicked,
  });
  const originalText = elements.approveBtn.textContent;
  try {
    elements.approveBtn.classList.remove("error", "success", "verified");
    elements.approveBtn.classList.add("waiting");
    elements.approveBtn.textContent = "Confirming...";
    elements.approveStatus.className = "action-status pending";
    showStatus("Approving tokens...", "info");

    const tokenAddress = elements.tokenContractInput.value;
    const tokenAmount = elements.tokenAmountInput.value;
    const rewardAmount = elements.rewardAmountInput.value;

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

    // Display transaction hash immediately
    elements.approveHash.innerHTML =
      `<a href="${etherscanBaseUrl}/tx/${tx.hash}" target="_blank" rel="noopener noreferrer">${
        tx.hash.substring(0, 10)
      }</a>`;

    await tx.wait(1);
    tokensApproved = true;

    elements.approveBtn.classList.remove("waiting");
    elements.approveBtn.classList.add("verified");
    elements.approveBtn.textContent = "Verified";
    elements.approveStatus.className = "action-status success";

    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
      approveClicked,
    });
    showStatus(
      `Tokens approved for ${predictedEscrowAddress}! Tx: ${tx.hash}`,
      "success",
    );
  } catch (error) {
    elements.approveBtn.classList.remove("waiting");
    elements.approveBtn.classList.add("error");
    elements.approveBtn.textContent = originalText;
    elements.approveStatus.className = "action-status error";
    showStatus(`Error: ${error.message}`, "error");
  }
}

async function deployAndBondEscrow() {
  deployClicked = true;
  const originalText = elements.deployBondBtn.textContent;
  try {
    elements.deployBondBtn.classList.remove("error", "success", "verified");
    elements.deployBondBtn.classList.add("waiting");
    elements.deployBondBtn.textContent = "Confirming...";
    elements.deployStatus.className = "action-status pending";
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

    const deployResult = await deployEscrow(
      { ESCROW_ABI, ESCROW_BYTECODE },
      tokenAddress,
      recipientAddress,
      transferAmount,
      rewardAmountParsed,
      signer,
    );

    // Display transaction hash immediately
    if (deployResult.deploymentHash) {
      elements.deployHash.innerHTML =
        `<a href="${etherscanBaseUrl}/tx/${deployResult.deploymentHash}" target="_blank" rel="noopener noreferrer">${
          deployResult.deploymentHash.substring(0, 10)
        }</a>`;
      showStatus(
        `Waiting for deployment: ${deployResult.deploymentHash}`,
        "info",
      );
    }

    // Wait for deployment to complete
    await deployResult.contract.waitForDeployment();
    escrowAddress = deployResult.contract.target;

    elements.deployBondBtn.classList.remove("waiting");
    elements.deployBondBtn.classList.add("verified");
    elements.deployBondBtn.textContent = "Verified";
    elements.deployStatus.className = "action-status success";

    showStatus(`Escrow deployed at: ${escrowAddress}`, "success");
    checkFormValidity({
      account,
      escrowAddress,
      tokensApproved,
      networkKeyStatus,
      walletChainId,
      approveClicked,
    });
  } catch (error) {
    elements.deployBondBtn.classList.remove("waiting");
    elements.deployBondBtn.classList.add("error");
    elements.deployBondBtn.textContent = originalText;
    elements.deployStatus.className = "action-status error";
    showStatus(`Error: ${error.message}`, "error");
    console.error(error);
  }
}

async function encryptAndSubmitSignal() {
  submitClicked = true;
  const originalText = elements.submitSignalBtn.textContent;
  try {
    elements.submitSignalBtn.classList.remove("error", "success", "verified");
    elements.submitSignalBtn.classList.add("waiting");
    elements.submitSignalBtn.textContent = "Confirming...";
    elements.submitStatus.className = "action-status pending";
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

    showStatus(`Signal submitted successfully! ${result}`, "success");
    showStatus("Monitoring for transfer...", "info");

    // Set 2 minute timeout
    const timeoutId = setTimeout(() => {
      elements.submitSignalBtn.classList.remove("waiting");
      elements.submitSignalBtn.classList.add("error");
      elements.submitSignalBtn.textContent = originalText;
      elements.submitStatus.className = "action-status error";
      showStatus("Transfer monitoring timeout after 2 minutes", "error");
      transferMonitor.stopWatching();
    }, 120000); // 2 minutes

    // Start monitoring for the transfer (button stays in waiting state)
    await transferMonitor.watchTransfer(
      tokenAddress,
      recipientAddress,
      transferAmount,
      (transferData) => {
        // Transfer detected - clear timeout and mark as verified
        clearTimeout(timeoutId);
        elements.submitSignalBtn.classList.remove("waiting");
        elements.submitSignalBtn.classList.add("verified");
        elements.submitSignalBtn.textContent = "Verified";
        elements.submitStatus.className = "action-status success";

        // Display transaction hash
        const etherscanUrl =
          `${etherscanBaseUrl}/tx/${transferData.transactionHash}`;
        elements.submitHash.innerHTML =
          `<a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer">${
            transferData.transactionHash.substring(0, 10)
          }</a>`;

        showStatus(
          `Transfer detected in tx ${transferData.transactionHash}`,
          "success",
        );
      },
      (error) => {
        // Error during monitoring - clear timeout
        clearTimeout(timeoutId);
        elements.submitSignalBtn.classList.remove("waiting");
        elements.submitSignalBtn.classList.add("error");
        elements.submitSignalBtn.textContent = originalText;
        elements.submitStatus.className = "action-status error";

        showStatus(`Monitoring error: ${error.message}`, "error");
      },
    );
  } catch (error) {
    elements.submitSignalBtn.classList.remove("waiting");
    elements.submitSignalBtn.classList.add("error");
    elements.submitSignalBtn.textContent = originalText;
    elements.submitStatus.className = "action-status error";
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
elements.startOverBtn.addEventListener("click", () => {
  // Reset state variables
  escrowAddress = null;
  tokensApproved = false;
  approveClicked = false;
  deployClicked = false;
  submitClicked = false;

  // Reset form inputs
  elements.tokenAmountInput.value = "";
  elements.recipientAddressInput.value = "";
  elements.rewardAmountInput.value = "";
  elements.totalAmountInput.value = "";

  // Reset approve button
  elements.approveBtn.classList.remove("verified", "waiting", "error");
  elements.approveBtn.textContent = "Approve";
  elements.approveBtn.disabled = true;
  elements.approveStatus.className = "action-status disabled";
  elements.approveHash.innerHTML = "";
  elements.approveTitle.textContent = "Approve Tokens";

  // Reset deploy button
  elements.deployBondBtn.classList.remove("verified", "waiting", "error");
  elements.deployBondBtn.textContent = "Deploy";
  elements.deployBondBtn.disabled = true;
  elements.deployStatus.className = "action-status disabled";
  elements.deployHash.innerHTML = "";

  // Reset submit button
  elements.submitSignalBtn.classList.remove("verified", "waiting", "error");
  elements.submitSignalBtn.textContent = "Submit";
  elements.submitSignalBtn.disabled = true;
  elements.submitStatus.className = "action-status disabled";
  elements.submitHash.innerHTML = "";

  // Recalculate reward
  calculateReward();

  // Update form validity
  checkFormValidity({
    account,
    escrowAddress,
    tokensApproved,
    networkKeyStatus,
    walletChainId,
    approveClicked,
  });

  showStatus("Form reset", "info");
});

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
        approveClicked,
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

// Fetch token info when contract address changes
elements.tokenContractInput.addEventListener("input", fetchTokenInfo);

// Auto-calculate reward amount based on token amount and gas price
elements.tokenAmountInput.addEventListener("input", () => {
  validateTokenInput(elements.tokenAmountInput);
  calculateReward();
});
