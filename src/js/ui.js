export const elements = {
  connectWalletBtn: document.getElementById("connectWallet"),
  approveBtn: document.getElementById("approveBtn"),
  approveTitle: document.getElementById("approveTitle"),
  deployBondBtn: document.getElementById("deployBondBtn"),
  submitSignalBtn: document.getElementById("submitSignalBtn"),
  approveStatus: document.getElementById("approveStatus"),
  deployStatus: document.getElementById("deployStatus"),
  submitStatus: document.getElementById("submitStatus"),
  approveHash: document.getElementById("approveHash"),
  deployHash: document.getElementById("deployHash"),
  submitHash: document.getElementById("submitHash"),
  monitorItem: document.getElementById("monitorItem"),
  monitorStatus: document.getElementById("monitorStatus"),
  monitorBtn: document.getElementById("monitorBtn"),
  monitorHash: document.getElementById("monitorHash"),
  networkKeyDisplay: document.getElementById("networkKeyDisplay"),
  tokenContractInput: document.getElementById("tokenContract"),
  tokenSymbolInput: document.getElementById("tokenSymbol"),
  tokenNameInput: document.getElementById("tokenName"),
  tokenAmountInput: document.getElementById("tokenAmount"),
  rewardAmountInput: document.getElementById("rewardAmount"),
  rewardAmountLabel: document.getElementById("rewardAmountLabel"),
  totalAmountInput: document.getElementById("totalAmount"),
  totalAmountLabel: document.getElementById("totalAmountLabel"),
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

  // Update monitor item status
  elements.monitorHash.innerHTML = message;

  if (status === "watching") {
    elements.monitorStatus.className = "action-status pending";
    elements.monitorBtn.textContent = "Monitoring...";
    elements.monitorBtn.classList.remove("verified");
    elements.monitorBtn.classList.add("waiting");
  } else if (status === "detected") {
    elements.monitorStatus.className = "action-status success";
    elements.monitorBtn.textContent = "Confirmed";
    elements.monitorBtn.classList.remove("waiting");
    elements.monitorBtn.classList.add("verified");
  } else if (status === "error") {
    elements.monitorStatus.className = "action-status error";
    elements.monitorBtn.textContent = "Error";
    elements.monitorBtn.classList.remove("waiting", "verified");
    elements.monitorBtn.classList.add("error");
  }
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

    // Only update status circle if approve hasn't been clicked yet
    if (
      !state.approveClicked &&
      !elements.approveBtn.classList.contains("waiting")
    ) {
      if (state.tokensApproved) {
        elements.approveStatus.className = "action-status success";
      } else if (!approveDisabled) {
        elements.approveStatus.className = "action-status available";
      } else {
        elements.approveStatus.className = "action-status disabled";
      }
    }

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
      !elements.approveBtn.classList.contains("verified") &&
      !elements.approveBtn.classList.contains("waiting") &&
      !elements.approveBtn.classList.contains("error")
    ) {
      elements.approveBtn.textContent = "Approve";
    } else if (elements.approveBtn.classList.contains("verified")) {
      elements.approveBtn.textContent = "Verified";
    }

    // Update button class for verified state
    if (state.tokensApproved) {
      elements.approveBtn.classList.add("verified");
    } else if (!elements.approveBtn.classList.contains("error")) {
      elements.approveBtn.classList.remove("verified");
    }

    const deployDisabled = !baseFieldsFilled ||
      !state.tokensApproved || state.escrowAddress;
    elements.deployBondBtn.disabled = deployDisabled;

    // Update status circle (don't override pending state)
    if (!elements.deployBondBtn.classList.contains("waiting")) {
      if (state.escrowAddress) {
        elements.deployStatus.className = "action-status success";
      } else if (!deployDisabled) {
        elements.deployStatus.className = "action-status available";
      } else {
        elements.deployStatus.className = "action-status disabled";
      }
    }

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
      !elements.deployBondBtn.classList.contains("verified") &&
      !elements.deployBondBtn.classList.contains("waiting") &&
      !elements.deployBondBtn.classList.contains("error")
    ) {
      elements.deployBondBtn.textContent = "Deploy";
    } else if (elements.deployBondBtn.classList.contains("verified")) {
      elements.deployBondBtn.textContent = "Verified";
    }

    // Update button class for verified state
    if (state.escrowAddress) {
      elements.deployBondBtn.classList.add("verified");
    } else if (!elements.deployBondBtn.classList.contains("error")) {
      elements.deployBondBtn.classList.remove("verified");
    }

    const submitDisabled = !signalFieldsFilled || !state.escrowAddress ||
      !networkOnline || !chainMatch;
    elements.submitSignalBtn.disabled = submitDisabled;

    // Update status circle (don't override pending or success state)
    if (
      !elements.submitSignalBtn.classList.contains("waiting") &&
      !elements.submitSignalBtn.classList.contains("verified")
    ) {
      if (!submitDisabled) {
        elements.submitStatus.className = "action-status available";
      } else {
        elements.submitStatus.className = "action-status disabled";
      }
    }

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
      !elements.submitSignalBtn.classList.contains("verified") &&
      !elements.submitSignalBtn.classList.contains("waiting") &&
      !elements.submitSignalBtn.classList.contains("error")
    ) {
      elements.submitSignalBtn.textContent = "Submit";
    } else if (elements.submitSignalBtn.classList.contains("verified")) {
      elements.submitSignalBtn.textContent = "Verified";
    }
  }
}
