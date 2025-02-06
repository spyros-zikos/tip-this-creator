import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { contractABI } from './abi.ts';
import { WalletRecord } from './types.ts';


/*//////////////////////////////////////////////////////////////
                        WALLET MANAGEMENT
//////////////////////////////////////////////////////////////*/

Coinbase.configure({ apiKeyName: process.env.CDP_API_KEY_NAME, privateKey: process.env.CDP_PRIVATE_KEY });

const contractAddress = "0x1235fd2d8e417db68c2ea4179fe53d328ffd5238";
const networkId = Coinbase.networks.BaseMainnet;

export const generateWallet = async () => {
    const wallet = await Wallet.create({networkId: networkId});
    const defaultAddress = await wallet.getDefaultAddress();
    const address = defaultAddress.toString().split("'")[1];
    const walletId = wallet.getId();
    const seed = wallet.export().seed;
    return [address, walletId, seed];
}

export const getBalance = async (walletRecord: WalletRecord) => {
    const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
    const balance = await wallet.getBalance(Coinbase.assets.Eth);
    const balanceAdjustedForGas = parseFloat(balance.toString()) - 0.00005; // ~ $0.15 for gas
    if (balanceAdjustedForGas > 0) {
        return balanceAdjustedForGas;
    }
    return 0;
}

export async function tip(wallet: Wallet, creatorAddress: string, amount: number) {
    const contractInvocation = await wallet.invokeContract({
        contractAddress: contractAddress,
        method: "tip",
        args: {
            creator: creatorAddress,
        },
        amount: amount,
        assetId: Coinbase.assets.Eth,
        abi: contractABI,
    });
        
    const tx = await contractInvocation.wait();
    console.log(tx.getTransactionHash());
    return tx.getTransactionHash();
};

/*//////////////////////////////////////////////////////////////
                            TWITTER API
//////////////////////////////////////////////////////////////*/

export function getUsernameFromTwitterId(id: string) {
    fetch(`https://api.socialdata.tools/twitter/user/${id}`, {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${process.env.SOCIALDATA_BEARER_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => console.log(data.screen_name))
    .catch(error => console.error('Error:', error));
}

export function getTwitterIdFromUsername(username: string) {
    fetch(`https://api.socialdata.tools/twitter/user/${username}`, {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${process.env.SOCIALDATA_BEARER_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => console.log(data.id_str))
    .catch(error => console.error('Error:', error));
}

