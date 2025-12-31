// ==================== SMART CONTRACT ====================

async function retrieveValue() {
    try {
        elements.storedValue.textContent = '...';
        
        // Function selector: keccak256("retrieve()") = 0x2e64cec1
        const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ 
                to: CONFIG.CONTRACT_ADDRESS, 
                data: '0x2e64cec1' 
            }, 'latest']
        });
        
        elements.storedValue.textContent = parseInt(result, 16);
    } catch (error) {
        console.error('Retrieve error:', error);
        elements.storedValue.textContent = 'Error';
    }
}

async function storeValue() {
    const input = elements.numberInput.value;
    
    if (!input) {
        return showMessage('Enter a number', 'error');
    }

    const number = parseInt(input);
    
    if (isNaN(number) || number < 0) {
        return showMessage('Invalid number', 'error');
    }

    try {
        // Update button state
        elements.storeBtn.disabled = true;
        elements.storeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        showMessage('Confirm in MetaMask...', 'info');

        // Function selector: keccak256("store(uint256)") = 0x6057361d
        const data = '0x6057361d' + number.toString(16).padStart(64, '0');

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ 
                from: currentAddress, 
                to: CONFIG.CONTRACT_ADDRESS, 
                data 
            }]
        });

        showMessage('Waiting for confirmation...', 'info');
        await waitForTransaction(txHash);
        
        showMessage('Stored successfully!', 'success');
        elements.numberInput.value = '';

        // Refresh data
        await retrieveValue();
        await updateBalance();
        await loadHistory();

    } catch (error) {
        console.error('Store error:', error);
        showMessage(error.code === 4001 ? 'Rejected' : 'Failed', 'error');
    } finally {
        elements.storeBtn.disabled = false;
        elements.storeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Store';
    }
}

async function waitForTransaction(txHash) {
    while (true) {
        const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
        });
        
        if (receipt) {
            if (receipt.status === '0x1') return receipt;
            throw new Error('Transaction failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
