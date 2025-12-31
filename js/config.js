// ==================== CONFIG ====================
const CONFIG = {
    CONTRACT_ADDRESS: '0x56A831B5936072CF0290C1029EbdA1F9eFDfDc2e',
    // Etherscan API V2 - unified endpoint for all chains
    ETHERSCAN_API: 'https://api.etherscan.io/v2/api',
    ETHERSCAN_API_KEY: 'UE8EEJJAM5NFTM6E3WZ9QQENX3J1JNRZQ7',
    NETWORK: 'Sepolia',
    // Default chain ID for Sepolia
    CHAIN_ID: 11155111
};

// ==================== NETWORK LIST ====================
const NETWORKS = {
    // Mainnet
    ethereum: {
        chainId: '0x1',
        chainIdDecimal: 1,
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io']
    },
    // Testnet
    sepolia: {
        chainId: '0xaa36a7',
        chainIdDecimal: 11155111,
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    }
};

// ==================== STATE ====================
let currentAddress = null;
let isConnected = false;
let currentNetwork = null;
let elements = {};
