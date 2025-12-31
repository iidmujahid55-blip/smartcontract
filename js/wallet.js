// ==================== MAIN APP ====================
// This is the main entry point that initializes all modules

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    elements = {
        // Buttons
        connectBtn: document.getElementById('connectButton'),
        disconnectBtn: document.getElementById('disconnectButton'),
        storeBtn: document.getElementById('storeBtn'),
        retrieveBtn: document.getElementById('retrieveBtn'),
        
        // Sections
        walletInfo: document.getElementById('wallet-info'),
        contractSection: document.getElementById('contract-section'),
        disconnectedState: document.getElementById('disconnected-state'),
        
        // Displays
        statusMessage: document.getElementById('status-message'),
        globalStatus: document.getElementById('global-status'),
        addressDisplay: document.getElementById('address-display'),
        networkDisplay: document.getElementById('network-display'),
        balanceDisplay: document.getElementById('balance-display'),
        storedValue: document.getElementById('stored-value'),
        
        // Inputs
        numberInput: document.getElementById('numberInput'),
        networkSelector: document.getElementById('network-selector'),
        
        // History
        txLoading: document.getElementById('tx-loading'),
        txList: document.getElementById('tx-list'),
        txEmpty: document.getElementById('tx-empty'),
        txPagination: document.getElementById('tx-pagination'),
        txFilters: document.getElementById('tx-filters')
    };

    checkMetaMask();
    setupEventListeners();
    
    console.log('Simple Storage DApp initialized');
}

function checkMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        elements.connectBtn.disabled = true;
        elements.connectBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> MetaMask Not Found';
        showMessage('Please install MetaMask first!', 'error');
    }
}

function setupEventListeners() {
    elements.connectBtn.addEventListener('click', connectWallet);
    elements.disconnectBtn.addEventListener('click', disconnectWallet);
    elements.storeBtn.addEventListener('click', storeValue);
    elements.retrieveBtn.addEventListener('click', retrieveValue);
    elements.numberInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') storeValue();
    });
}
