export const elements = {
  connectWalletBtn: document.getElementById("connectWallet"),
  approveBtn: document.getElementById("approveBtn"),
  deployBondBtn: document.getElementById("deployBondBtn"),
  submitSignalBtn: document.getElementById("submitSignalBtn"),
  networkKeyDisplay: document.getElementById("networkKeyDisplay"),
  tokenContractInput: document.getElementById("tokenContract"),
  tokenAmountInput: document.getElementById("tokenAmount"),
  rewardAmountInput: document.getElementById("rewardAmount"),
  recipientAddressInput: document.getElementById("recipientAddress"),
  ackUrlInput: document.getElementById("ackUrl"),
  nodeApiUrlInput: document.getElementById("nodeApiUrl"),
};

export function showStatus(message, type) {
  console.log(`[${type}] ${message}`);
}

export function updateNetworkKeyDisplay(
  networkKeyStatus,
  walletChainId = null,
) {
  if (!elements.networkKeyDisplay) return;

  const { prefix, attested, debug, chainId } = networkKeyStatus;

  if (prefix === "Error") {
    elements.networkKeyDisplay.textContent = "Offline";
    elements.networkKeyDisplay.style.color = "#ff6b6b";
  } else if (prefix) {
    const attestedText = attested ? "yes" : "no";
    const debugText = debug ? "yes" : "no";
    const chainName = getChainName(chainId);

    const chainMismatch = walletChainId && chainId !== walletChainId;
    const [chainColor, tooltip] = chainMismatch
      ? ["#ff6b6b", ' title="Chain does not match wallet"']
      : ["#999", ""];

    elements.networkKeyDisplay.innerHTML =
      `Chain: <span style="color: ${chainColor}"${tooltip}>${chainName}</span> | Key: ${prefix} | Attested: ${attestedText} | Debug: ${debugText}`;
    elements.networkKeyDisplay.style.color = "#999";
  } else {
    elements.networkKeyDisplay.textContent = "Key: Loading...";
    elements.networkKeyDisplay.style.color = "#999";
  }
}

export function getChainName(chainId) {
  const chainNames = {
    1: "Mainnet",
    11155111: "Sepolia",
    5: "Goerli",
    17000: "Holesky",
    137: "Polygon",
    10: "Optimism",
    42161: "Arbitrum",
    8453: "Base",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

export function checkFormValidity(state) {
  const baseFieldsFilled = elements.tokenContractInput.value &&
    elements.tokenAmountInput.value &&
    elements.rewardAmountInput.value &&
    elements.recipientAddressInput.value;

  const signalFieldsFilled = baseFieldsFilled &&
    elements.ackUrlInput.value &&
    elements.nodeApiUrlInput.value;

  const networkOnline = state.networkKeyStatus &&
    state.networkKeyStatus.prefix !== "Error";

  if (state.account) {
    elements.approveBtn.disabled = !baseFieldsFilled || state.escrowAddress;

    const deployDisabled = !baseFieldsFilled ||
      !state.tokensApproved || state.escrowAddress;
    elements.deployBondBtn.disabled = deployDisabled;

    // Update deploy button tooltip based on reason for being disabled
    if (deployDisabled && state.account && !state.escrowAddress) {
      if (!state.tokensApproved) {
        elements.deployBondBtn.title = "Tokens Not Approved Yet";
      } else {
        elements.deployBondBtn.title = "";
      }
    } else {
      elements.deployBondBtn.title = "";
    }

    if (!elements.deployBondBtn.classList.contains("success") &&
        !elements.deployBondBtn.classList.contains("waiting")) {
      elements.deployBondBtn.textContent = "Deploy Escrow";
    }

    const submitDisabled = !signalFieldsFilled || !state.escrowAddress ||
      !networkOnline;
    elements.submitSignalBtn.disabled = submitDisabled;

    // Update submit signal button tooltip based on reason for being disabled
    if (submitDisabled && state.account) {
      if (!state.escrowAddress) {
        elements.submitSignalBtn.title = "Contract Not Deployed";
      } else if (!networkOnline) {
        elements.submitSignalBtn.title = "Network Offline";
      } else {
        elements.submitSignalBtn.title = "";
      }
    } else {
      elements.submitSignalBtn.title = "";
    }

    if (!elements.submitSignalBtn.classList.contains("success") &&
        !elements.submitSignalBtn.classList.contains("waiting")) {
      elements.submitSignalBtn.textContent = "Submit Signal";
    }
  }
}
