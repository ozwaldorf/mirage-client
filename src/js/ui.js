export const elements = {
  connectWalletBtn: document.getElementById("connectWallet"),
  approveBtn: document.getElementById("approveBtn"),
  deployBondBtn: document.getElementById("deployBondBtn"),
  submitSignalBtn: document.getElementById("submitSignalBtn"),
  networkKeyDisplay: document.getElementById("networkKeyDisplay"),
  tokenContractInput: document.getElementById("tokenContract"),
  tokenAmountInput: document.getElementById("tokenAmount"),
  rewardAmountInput: document.getElementById("rewardAmount"),
  rewardAmountLabel: document.getElementById("rewardAmountLabel"),
  recipientAddressInput: document.getElementById("recipientAddress"),
  nodeApiUrlInput: document.getElementById("nodeApiUrl"),
  transferStatus: document.getElementById("transferStatus"),
  transferStatusTitle: document.getElementById("transferStatusTitle"),
  transferStatusMessage: document.getElementById("transferStatusMessage"),
};

export function showStatus(message, type) {
  console.log(`[${type}] ${message}`);
}

export function updateNetworkKeyDisplay(
  networkKeyStatus,
  walletChainId = null,
) {
  if (!elements.networkKeyDisplay) return;

  if (!networkKeyStatus) {
    elements.networkKeyDisplay.textContent = "Offline";
    elements.networkKeyDisplay.style.color = "#ff6b6b";
  } else {
    const attestedText = networkKeyStatus.attested ? "yes" : "no";
    const debugText = networkKeyStatus.debug ? "yes" : "no";
    const chainName = getChainName(networkKeyStatus.chainId);

    const chainMismatch = walletChainId &&
      networkKeyStatus.chainId !== walletChainId;
    const [chainColor, tooltip] = chainMismatch
      ? ["#ff6b6b", ' title="Chain does not match wallet"']
      : ["#999", ""];

    elements.networkKeyDisplay.innerHTML =
      `Chain: <span style="color: ${chainColor}"${tooltip}>${chainName}</span> | Key: ${networkKeyStatus.prefix} | Attested: ${attestedText} | Debug: ${debugText}`;
    elements.networkKeyDisplay.style.color = "#999";
  }
}

export function getChainName(chainId) {
  const chainNames = {
    1: "Mainnet",
    11155111: "Sepolia",
    17000: "Holesky",
    137: "Polygon",
    10: "Optimism",
    42161: "Arbitrum",
    8453: "Base",
  };
  return chainNames[chainId] || `unknown`;
}

export function showTransferStatus(status, title, message) {
  elements.transferStatus.className = `transfer-status visible ${status}`;
  elements.transferStatusTitle.textContent = title;
  elements.transferStatusMessage.innerHTML = message;
}

export function checkFormValidity(state) {
  const baseFieldsFilled = elements.tokenContractInput.value &&
    elements.tokenAmountInput.value &&
    elements.rewardAmountInput.value &&
    elements.recipientAddressInput.value;

  const signalFieldsFilled = baseFieldsFilled &&
    elements.nodeApiUrlInput.value;

  const networkOnline = state.networkKeyStatus &&
    state.networkKeyStatus.prefix !== "Error";

  const chainMatch = !state.walletChainId || !state.networkKeyStatus ||
    !state.networkKeyStatus.chainId ||
    state.walletChainId === state.networkKeyStatus.chainId;

  if (state.account) {
    const approveDisabled = !baseFieldsFilled || state.escrowAddress;
    elements.approveBtn.disabled = approveDisabled;

    // Update approve button tooltip based on reason for being disabled
    if (approveDisabled && state.account && !state.escrowAddress) {
      if (!baseFieldsFilled) {
        elements.approveBtn.title = "Incomplete fields";
      } else {
        elements.approveBtn.title = "";
      }
    } else {
      elements.approveBtn.title = "";
    }

    if (
      !elements.approveBtn.classList.contains("success") &&
      !elements.approveBtn.classList.contains("waiting")
    ) {
      elements.approveBtn.textContent = "Approve Tokens";
    }

    const deployDisabled = !baseFieldsFilled ||
      !state.tokensApproved || state.escrowAddress;
    elements.deployBondBtn.disabled = deployDisabled;

    // Update deploy button tooltip based on reason for being disabled
    if (deployDisabled && state.account && !state.escrowAddress) {
      if (!state.tokensApproved) {
        elements.deployBondBtn.title = "Tokens not approved yet";
      } else {
        elements.deployBondBtn.title = "";
      }
    } else {
      elements.deployBondBtn.title = "";
    }

    if (
      !elements.deployBondBtn.classList.contains("success") &&
      !elements.deployBondBtn.classList.contains("waiting")
    ) {
      elements.deployBondBtn.textContent = "Deploy Escrow";
    }

    const submitDisabled = !signalFieldsFilled || !state.escrowAddress ||
      !networkOnline || !chainMatch;
    elements.submitSignalBtn.disabled = submitDisabled;

    // Update submit signal button tooltip based on reason for being disabled
    if (submitDisabled && state.account) {
      if (!state.escrowAddress) {
        elements.submitSignalBtn.title = "Contract not deployed";
      } else if (!networkOnline) {
        elements.submitSignalBtn.title = "Network offline";
      } else if (!chainMatch) {
        elements.submitSignalBtn.title = "Chain mismatch";
      } else {
        elements.submitSignalBtn.title = "";
      }
    } else {
      elements.submitSignalBtn.title = "";
    }

    if (
      !elements.submitSignalBtn.classList.contains("success") &&
      !elements.submitSignalBtn.classList.contains("waiting")
    ) {
      elements.submitSignalBtn.textContent = "Submit Signal";
    }
  }
}
