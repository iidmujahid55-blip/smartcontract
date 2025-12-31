// ==================== UTILITIES ====================

function showMessage(msg, type) {
    const colors = { 
        success: 'text-green-400', 
        error: 'text-red-400', 
        info: 'text-blue-400' 
    };
    
    elements.statusMessage.innerHTML = msg 
        ? `<p class="${colors[type]} text-sm">${msg}</p>` 
        : '';
    
    if (msg && type !== 'info') {
        setTimeout(() => { 
            elements.statusMessage.innerHTML = ''; 
        }, 4000);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function shortAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
