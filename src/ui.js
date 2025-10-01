export const elements = {
  connectWalletBtn: document.getElementById('connectWallet'),
  approveBtn: document.getElementById('approveBtn'),
  deployBondBtn: document.getElementById('deployBondBtn'),
  submitSignalBtn: document.getElementById('submitSignalBtn'),
  consoleLog: document.getElementById('consoleLog'),
  networkKeyDisplay: document.getElementById('networkKeyDisplay'),
  tokenContractInput: document.getElementById('tokenContract'),
  tokenAmountInput: document.getElementById('tokenAmount'),
  rewardAmountInput: document.getElementById('rewardAmount'),
  recipientAddressInput: document.getElementById('recipientAddress'),
  ackUrlInput: document.getElementById('ackUrl'),
  nodeApiUrlInput: document.getElementById('nodeApiUrl')
};

export function showStatus(message, type) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.style.marginBottom = '5px';
  entry.style.color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#7cfc00' : '#5dade2';
  entry.textContent = `[${timestamp}] ${message}`;
  elements.consoleLog.appendChild(entry);
  elements.consoleLog.scrollTop = elements.consoleLog.scrollHeight;
}

export function updateNetworkKeyDisplay(networkKeyStatus, walletChainId = null) {
  if (!elements.networkKeyDisplay) return;

  const { prefix, attested, debug, chainId } = networkKeyStatus;

  if (prefix === 'Error') {
    elements.networkKeyDisplay.textContent = 'Offline';
    elements.networkKeyDisplay.style.color = '#ff6b6b';
  } else if (prefix) {
    const attestedText = attested ? 'yes' : 'no';
    const debugText = debug ? 'yes' : 'no';
    const chainName = getChainName(chainId);

    const chainMismatch = walletChainId && chainId !== walletChainId;
    const [chainColor, tooltip] = chainMismatch ? ['#ff6b6b', ' title="Chain does not match wallet"'] : ['#999', ''];

    elements.networkKeyDisplay.innerHTML = `Chain: <span style="color: ${chainColor}"${tooltip}>${chainName}</span> | Key: ${prefix} | Attested: ${attestedText} | Debug: ${debugText}`;
    elements.networkKeyDisplay.style.color = '#999';
  } else {
    elements.networkKeyDisplay.textContent = 'Key: Loading...';
    elements.networkKeyDisplay.style.color = '#999';
  }
}

export function getChainName(chainId) {
  const chainNames = {
    1: 'Mainnet',
    11155111: 'Sepolia',
    5: 'Goerli',
    17000: 'Holesky',
    137: 'Polygon',
    10: 'Optimism',
    42161: 'Arbitrum',
    8453: 'Base'
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

  if (state.account) {
    elements.approveBtn.disabled = !baseFieldsFilled || state.escrowAddress;
    elements.deployBondBtn.disabled = !baseFieldsFilled || !state.tokensApproved || state.escrowAddress;
    elements.submitSignalBtn.disabled = !signalFieldsFilled || !state.escrowAddress;
  }
}
