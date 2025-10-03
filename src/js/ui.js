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
  networkChainInput: document.getElementById("networkChain"),
  networkKeyInput: document.getElementById("networkKey"),
  networkAttestedInput: document.getElementById("networkAttested"),
  networkDebugInput: document.getElementById("networkDebug"),
  tokenContractInput: document.getElementById("tokenContract"),
  tokenSymbolInput: document.getElementById("tokenSymbol"),
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
  startOverBtn: document.getElementById("startOver"),
  startOverStatus: document.getElementById("startOverStatus"),
};

export function showStatus(message, type) {
  console.log(`[${type}] ${message}`);
}

export function updateNetworkKeyDisplay(
  networkKeyStatus,
  walletChainId = null,
) {
  if (!networkKeyStatus) {
    elements.networkChainInput.value = "Offline";
    elements.networkChainInput.classList.add("network-offline");
    elements.networkKeyInput.value = "";
    elements.networkAttestedInput.value = "";
    elements.networkDebugInput.value = "";
  } else {
    elements.networkChainInput.classList.remove("network-offline");
    const attestedText = networkKeyStatus.attested ? "yes" : "no";
    const debugText = networkKeyStatus.debug ? "yes" : "no";
    const chainName = getChainName(networkKeyStatus.chainId);

    const chainMismatch = walletChainId &&
      networkKeyStatus.chainId !== walletChainId;

    elements.networkChainInput.value = chainName;
    elements.networkChainInput.title = chainMismatch ? "Chain does not match wallet" : "";
    elements.networkKeyInput.value = networkKeyStatus.prefix;
    elements.networkAttestedInput.value = attestedText;
    elements.networkDebugInput.value = debugText;

    // Mark attested field as warning if not attested
    if (!networkKeyStatus.attested) {
      elements.networkAttestedInput.classList.add("network-warning");
    } else {
      elements.networkAttestedInput.classList.remove("network-warning");
    }

    // Mark debug field as warning if debug mode is enabled
    if (networkKeyStatus.debug) {
      elements.networkDebugInput.classList.add("network-warning");
    } else {
      elements.networkDebugInput.classList.remove("network-warning");
    }
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

  // Disable form inputs if approve is clicked or tokens are approved
  const formDisabled = state.approveClicked || state.tokensApproved;
  elements.tokenContractInput.disabled = formDisabled;
  elements.tokenAmountInput.disabled = formDisabled;

  // Only disable recipient address after escrow is deployed
  elements.recipientAddressInput.disabled = state.escrowAddress;

  // Enable start over button only if approve was clicked or tokens already approved
  if (state.approveClicked || state.tokensApproved || state.escrowAddress) {
    elements.startOverBtn.disabled = false;
    elements.startOverStatus.className = "action-status available reload";
  } else {
    elements.startOverBtn.disabled = true;
    elements.startOverStatus.className = "action-status disabled";
  }

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
      elements.submitSignalBtn.textContent = "Execute";
    } else if (elements.submitSignalBtn.classList.contains("verified")) {
      elements.submitSignalBtn.textContent = "Verified";
    }
  }
}
