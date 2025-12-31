// ==================== WALLET CONNECTION ====================

async function connectWallet() {
    try {
        showMessage('Opening MetaMask...', 'info');

        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
            throw new Error('No account selected');
        }

        currentAddress = accounts[0];
        isConnected = true;

        // Get current network
        await detectCurrentNetwork();

        // Update UI
        elements.walletInfo.style.display = 'block';
        elements.contractSection.style.display = 'block';
        elements.disconnectedState.style.display = 'none';
        elements.connectBtn.style.display = 'none';
        elements.disconnectBtn.style.display = 'inline-flex';
        
        elements.addressDisplay.textContent = currentAddress;
        elements.networkDisplay.textContent = currentNetwork ? currentNetwork.chainName : CONFIG.NETWORK;
        
        updateGlobalStatus(true);
        showMessage('', 'info');

        // Load data
        await updateBalance();
        await retrieveValue();
        await loadHistory();

        // Listen for account/network changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', handleNetworkChange);

    } catch (error) {
        console.error('Connect error:', error);
        showMessage(error.code === 4001 ? 'Connection rejected' : 'Failed to connect', 'error');
    }
}

function disconnectWallet() {
    currentAddress = null;
    isConnected = false;

    elements.walletInfo.style.display = 'none';
    elements.contractSection.style.display = 'none';
    elements.disconnectedState.style.display = 'block';
    elements.connectBtn.style.display = 'inline-flex';
    elements.disconnectBtn.style.display = 'none';
    
    updateGlobalStatus(false);
    showMessage('', 'info');
}

function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        currentAddress = accounts[0];
        elements.addressDisplay.textContent = currentAddress;
        updateBalance();
    }
}

// ==================== NETWORK SWITCHING ====================

async function detectCurrentNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        currentNetwork = getNetworkByChainId(chainId);
        
        if (currentNetwork) {
            elements.networkDisplay.textContent = currentNetwork.chainName;
            updateNetworkSelector(currentNetwork.key);
            console.log('Current network:', currentNetwork.chainName);
        } else {
            elements.networkDisplay.textContent = `Unknown (${chainId})`;
            console.log('Unknown network with chainId:', chainId);
        }
        
        return currentNetwork;
    } catch (error) {
        console.error('Error detecting network:', error);
        return null;
    }
}

function getNetworkByChainId(chainId) {
    for (const [key, network] of Object.entries(NETWORKS)) {
        if (network.chainId.toLowerCase() === chainId.toLowerCase()) {
            return { ...network, key };
        }
    }
    return null;
}

function updateNetworkSelector(networkKey) {
    if (elements.networkSelector) {
        elements.networkSelector.value = networkKey;
    }
}

async function handleNetworkChange(chainId) {
    console.log('Network changed to:', chainId);
    currentNetwork = getNetworkByChainId(chainId);
    
    if (currentNetwork) {
        elements.networkDisplay.textContent = currentNetwork.chainName;
        updateNetworkSelector(currentNetwork.key);
        showMessage(`Switched to ${currentNetwork.chainName}`, 'info');
    } else {
        elements.networkDisplay.textContent = `Unknown (${chainId})`;
        showMessage('Switched to unknown network', 'info');
    }
    
    // Refresh balance and data for new network
    if (isConnected) {
        await updateBalance();
    }
}

async function switchNetwork(networkKey) {
    const network = NETWORKS[networkKey];
    
    if (!network) {
        showMessage('Network not found', 'error');
        return false;
    }
    
    try {
        showMessage(`Switching to ${network.chainName}...`, 'info');
        
        // Try to switch to the network
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }]
        });
        
        showMessage(`Switched to ${network.chainName}`, 'info');
        return true;
        
    } catch (switchError) {
        // Error code 4902 means the chain is not added to MetaMask
        if (switchError.code === 4902) {
            try {
                showMessage(`Adding ${network.chainName} to MetaMask...`, 'info');
                
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: network.chainId,
                        chainName: network.chainName,
                        nativeCurrency: network.nativeCurrency,
                        rpcUrls: network.rpcUrls,
                        blockExplorerUrls: network.blockExplorerUrls
                    }]
                });
                
                showMessage(`Added and switched to ${network.chainName}`, 'info');
                return true;
                
            } catch (addError) {
                console.error('Error adding network:', addError);
                showMessage(`Failed to add ${network.chainName}`, 'error');
                return false;
            }
        } else if (switchError.code === 4001) {
            showMessage('Network switch rejected by user', 'error');
            return false;
        } else {
            console.error('Error switching network:', switchError);
            showMessage('Failed to switch network', 'error');
            return false;
        }
    }
}

// Quick switch functions
async function switchToMainnet() {
    return await switchNetwork('ethereum');
}

async function switchToSepolia() {
    return await switchNetwork('sepolia');
}

// Get list of available networks for UI dropdown
function getAvailableNetworks() {
    return Object.entries(NETWORKS).map(([key, network]) => ({
        key,
        name: network.chainName,
        chainId: network.chainId,
        symbol: network.nativeCurrency.symbol
    }));
}

async function updateBalance() {
    try {
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [currentAddress, 'latest']
        });
        
        const eth = parseInt(balance, 16) / 1e18;
        const symbol = currentNetwork ? currentNetwork.nativeCurrency.symbol : 'ETH';
        elements.balanceDisplay.textContent = `${eth.toFixed(4)} ${symbol}`;
    } catch (error) {
        elements.balanceDisplay.textContent = 'Error';
    }
}

function updateGlobalStatus(connected) {
    elements.globalStatus.textContent = connected ? 'Connected' : 'Disconnected';
    elements.globalStatus.className = `my-2 inline-block px-3 py-1 rounded-full text-sm ${
        connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'
    }`;
}
