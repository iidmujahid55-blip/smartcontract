// ==================== TRANSACTION HISTORY ====================

// History state
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentFilter = 'all'; // 'all', 'mine', 'success', 'failed'

async function loadHistory() {
    try {
        // Show loading state
        elements.txLoading.style.display = 'block';
        elements.txList.style.display = 'none';
        elements.txEmpty.style.display = 'none';
        elements.txPagination.style.display = 'none';
        elements.txFilters.style.display = 'none';

        // Get chain ID and explorer URL based on current network
        const chainId = currentNetwork ? currentNetwork.chainIdDecimal : CONFIG.CHAIN_ID;
        const explorerUrl = currentNetwork ? currentNetwork.blockExplorerUrls[0] : 'https://sepolia.etherscan.io';

        // Fetch transactions using Etherscan API V2 (unified endpoint with chainid)
        const url = `${CONFIG.ETHERSCAN_API}?chainid=${chainId}&module=account&action=txlist&address=${CONFIG.CONTRACT_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${CONFIG.ETHERSCAN_API_KEY}`;
        
        console.log('Fetching history from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        elements.txLoading.style.display = 'none';

        // Check for API error messages
        if (data.message === 'NOTOK' || data.status === '0') {
            console.warn('API Error:', data.result || data.message);
            
            // If no transactions found, show empty state
            if (data.message === 'No transactions found' || data.result === 'No transactions found') {
                elements.txEmpty.style.display = 'block';
                elements.txEmpty.innerHTML = `
                    <i class="fas fa-inbox text-gray-600 text-2xl mb-2"></i>
                    <p>No transactions found for this contract</p>
                `;
                return;
            }
            
            // For other API errors (rate limit, invalid API key, etc.)
            elements.txEmpty.style.display = 'block';
            elements.txEmpty.innerHTML = `
                <i class="fas fa-exclamation-triangle text-yellow-500 text-xl mb-2"></i>
                <p class="text-sm">${data.result || 'API Error'}</p>
            `;
            return;
        }

        if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
            console.log('Total transactions found:', data.result.length);
            
            // Filter only store() function calls (method ID: 0x6057361d)
            allTransactions = data.result.filter(tx => {
                const isStoreFunction = tx.input && tx.input.toLowerCase().startsWith('0x6057361d');
                return isStoreFunction;
            });
            
            console.log('Store transactions found:', allTransactions.length);

            // Sort: user's transactions first if connected
            if (currentAddress) {
                allTransactions.sort((a, b) => {
                    const aIsMine = a.from.toLowerCase() === currentAddress.toLowerCase();
                    const bIsMine = b.from.toLowerCase() === currentAddress.toLowerCase();
                    if (aIsMine && !bIsMine) return -1;
                    if (!aIsMine && bIsMine) return 1;
                    return 0;
                });
            }

            if (allTransactions.length > 0) {
                // Show filters
                elements.txFilters.style.display = 'flex';
                
                // Apply filter and render
                currentPage = 1;
                applyFilter(currentFilter);
            } else {
                elements.txEmpty.style.display = 'block';
                elements.txEmpty.innerHTML = `
                    <i class="fas fa-inbox text-gray-600 text-2xl mb-2"></i>
                    <p>No store() transactions found</p>
                `;
            }
        } else {
            elements.txEmpty.style.display = 'block';
            elements.txEmpty.innerHTML = `
                <i class="fas fa-inbox text-gray-600 text-2xl mb-2"></i>
                <p>No transactions found</p>
            `;
        }
    } catch (error) {
        console.error('History error:', error);
        elements.txLoading.style.display = 'none';
        elements.txEmpty.style.display = 'block';
        elements.txEmpty.innerHTML = `
            <i class="fas fa-exclamation-circle text-red-500 text-xl mb-2"></i>
            <p>Failed to load history</p>
            <p class="text-xs text-gray-500 mt-1">${error.message}</p>
        `;
    }
}

function applyFilter(filter) {
    currentFilter = filter;
    
    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-purple-500', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-700', 'text-gray-300');
        activeBtn.classList.add('bg-purple-500', 'text-white');
    }
    
    // Apply filter
    switch (filter) {
        case 'mine':
            filteredTransactions = allTransactions.filter(tx => 
                currentAddress && tx.from.toLowerCase() === currentAddress.toLowerCase()
            );
            break;
        case 'success':
            filteredTransactions = allTransactions.filter(tx => tx.isError === '0');
            break;
        case 'failed':
            filteredTransactions = allTransactions.filter(tx => tx.isError === '1');
            break;
        default:
            filteredTransactions = [...allTransactions];
    }
    
    // Reset to page 1 when filter changes
    currentPage = 1;
    renderCurrentPage();
}

function renderCurrentPage() {
    const explorerUrl = currentNetwork ? currentNetwork.blockExplorerUrls[0] : 'https://sepolia.etherscan.io';
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    if (pageTransactions.length > 0) {
        elements.txList.style.display = 'block';
        elements.txEmpty.style.display = 'none';
        renderHistory(pageTransactions, explorerUrl);
        
        // Update pagination
        if (totalPages > 1) {
            elements.txPagination.style.display = 'flex';
            updatePagination(totalPages);
        } else {
            elements.txPagination.style.display = 'none';
        }
    } else {
        elements.txList.style.display = 'none';
        elements.txPagination.style.display = 'none';
        elements.txEmpty.style.display = 'block';
        elements.txEmpty.innerHTML = `
            <i class="fas fa-filter text-gray-600 text-2xl mb-2"></i>
            <p>No transactions match this filter</p>
        `;
    }
}

function updatePagination(totalPages) {
    elements.txPagination.innerHTML = `
        <button onclick="goToPage(${currentPage - 1})" 
                class="px-3 py-1.5 rounded-lg text-sm ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
        <div class="flex items-center gap-1">
            ${generatePageNumbers(totalPages)}
        </div>
        <button onclick="goToPage(${currentPage + 1})" 
                class="px-3 py-1.5 rounded-lg text-sm ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

function generatePageNumbers(totalPages) {
    let pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, '...', totalPages];
        } else if (currentPage >= totalPages - 2) {
            pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }
    
    return pages.map(page => {
        if (page === '...') {
            return `<span class="px-2 text-gray-500">...</span>`;
        }
        const isActive = page === currentPage;
        return `
            <button onclick="goToPage(${page})" 
                    class="w-8 h-8 rounded-lg text-sm ${isActive ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
                ${page}
            </button>
        `;
    }).join('');
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCurrentPage();
    
    // Scroll to top of transaction list
    elements.txList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderHistory(transactions, explorerUrl = 'https://sepolia.etherscan.io') {
    elements.txList.innerHTML = transactions.map(tx => {
        const isSuccess = tx.isError === '0';
        const isMyTransaction = currentAddress && tx.from.toLowerCase() === currentAddress.toLowerCase();
        
        // Decode the stored value from input data (remove method ID and parse hex)
        let value = null;
        if (tx.input && tx.input.toLowerCase().startsWith('0x6057361d')) {
            try {
                value = parseInt(tx.input.slice(10), 16);
            } catch (e) {
                console.warn('Failed to parse value from input:', tx.input);
            }
        }
        
        const address = shortAddress(tx.from);
        const time = getTimeAgo(new Date(tx.timeStamp * 1000));

        return `
            <a href="${explorerUrl}/tx/${tx.hash}" 
               target="_blank"
               class="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-all ${isMyTransaction ? 'border border-purple-500/30' : ''}">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center 
                                ${isSuccess ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        <i class="fas fa-${isSuccess ? 'check' : 'times'} text-xs"></i>
                    </div>
                    <div>
                        <div class="text-white text-sm font-medium flex items-center gap-2">
                            Store${value !== null ? `: ${value}` : ''}
                            ${isMyTransaction ? '<span class="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">You</span>' : ''}
                        </div>
                        <div class="text-gray-500 text-xs">${address} • ${time}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs ${isSuccess ? 'text-green-400' : 'text-red-400'}">${isSuccess ? 'Success' : 'Failed'}</span>
                    <i class="fas fa-external-link-alt text-gray-500 text-xs"></i>
                </div>
            </a>
        `;
    }).join('');
}
