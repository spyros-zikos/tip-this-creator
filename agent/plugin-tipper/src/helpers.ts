import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { contractABI } from './abi.ts';
import { WalletRecord, UserState } from './types.ts';
import Database from "better-sqlite3";


/*//////////////////////////////////////////////////////////////
                        WALLET MANAGEMENT
//////////////////////////////////////////////////////////////*/

const contractAddress = "0x1235fd2d8e417db68c2ea4179fe53d328ffd5238";
Coinbase.configure({ apiKeyName: process.env.CDP_API_KEY_NAME, privateKey: process.env.CDP_PRIVATE_KEY });
export const networkId = Coinbase.networks.BaseMainnet;

export const generateWallet = async () => {
    const wallet = await Wallet.create({networkId: networkId, intervalSeconds: 2, timeoutSeconds: 20});
    const defaultAddress = await wallet.getDefaultAddress();
    const address = defaultAddress.getId();
    const walletId = wallet.getId();
    const seed = wallet.export().seed;
    return [address, walletId, seed];
}

export const getBalance = async (wallet: Wallet) => {
    const balance = await wallet.getBalance(Coinbase.assets.Eth);
    const balanceAdjustedForGas = parseFloat((parseFloat(balance.toString()) - 0.00002).toString().substring(0, 20)); // ~ $0.05 for gas
    // const balanceAdjustedForGas = parseFloat(''+balance.toString()) - 0.00002; // ~ $0.05 for gas
    if (balanceAdjustedForGas > 0) {
        return balanceAdjustedForGas;
    }
    return 0;
}

export async function transfer(wallet: Wallet, destination: string, amount: number) {
    let transfer = await wallet.createTransfer({ amount: amount, assetId: Coinbase.assets.Eth, destination: destination });
    transfer = await transfer.wait({ intervalSeconds: 2, timeoutSeconds: 30 });
    console.log("Transfer hash: ", transfer.getTransactionHash());
    return transfer.getTransactionHash();
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
    console.log("Transaction hash: ", tx.getTransactionHash());
    return tx.getTransactionHash();
};

/*//////////////////////////////////////////////////////////////
                                DB
//////////////////////////////////////////////////////////////*/

export const getDB = () => {
    // Set up database and table
    const db = new Database('addresses.db');
    db.exec(`
        CREATE TABLE IF NOT EXISTS address (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            address TEXT NOT NULL,
            walletId TEXT NOT NULL,
            seed TEXT NOT NULL
        )
    `);
    return db;
}

export const searchWalletRecord = (db: Database, userId: string) => {
    // Prepare statements for reuse
    const findUser = db.prepare('SELECT * FROM address WHERE userId = ?');
    
    // Search for user by username
    const existingUser = findUser.get(userId) as WalletRecord | undefined;
    
    if (!existingUser) {
        // User doesn't exist, return null
        return "null";
    } else {
        // User exists, return the record
        return existingUser;
    }
}

export const insertUser = (db: Database, userId: string, username: string, address: string, walletId: string, seed: string) => {
    const insertUser = db.prepare('INSERT INTO address (userId, username, address, walletId, seed) VALUES (?, ?, ?, ?, ?)');
    const result = insertUser.run(userId, username, address, walletId, seed);
    console.log('New user created:', {id: result.lastInsertRowid, userId, username, address, walletId, seed});
    console.log(`const walletId = "${walletId}";
const seed = "${seed}";`);
}

export async function getUserState(db: Database, userId: string) {
    const walletRecord = searchWalletRecord(db, userId);
    if (walletRecord === "null") {
        return UserState.hasNothing;
    }
    const wallet = await Wallet.import({networkId: networkId, walletId: walletRecord.walletId, seed: walletRecord.seed});
    const balance = await getBalance(wallet);
    if (balance > 0) {
        return UserState.hasBalance;
    }
    return UserState.hasAddress;
}

/*//////////////////////////////////////////////////////////////
                            TWITTER API
//////////////////////////////////////////////////////////////*/

export async function getTwitterIdFromUsername(username: string): Promise<string> {
    let retries = 5;
    for (let i = 0; i < retries; i++) {
    try {
        console.log("Fetching Twitter ID for username:" + username +".");
        const response = await fetch(`https://api.socialdata.tools/twitter/user/${username}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.SOCIALDATA_BEARER_TOKEN}` }
        });
        
        const data = await response.json();
        console.log("Fetched Twitter ID:", data.id_str);
        return data.id_str;
    } catch (error) {
        console.log('Error:', error);
        // console.error('Error:', error);
        // throw error; // Re-throw the error so calling code can handle it
    }
    }
}

/*//////////////////////////////////////////////////////////////
                            USERNAMES
//////////////////////////////////////////////////////////////*/

export const agentUsername = "tipthiscreator";

export function getCreatorUsername(message: string) {
    const usernames = message.split("@").map(e=>e.split(" ")[0]).filter((e,i)=>(e!==agentUsername&&i!=0));
    const numOfUsernames = usernames.length;
    console.log(message);
    console.log("usernames: ", usernames);
    if (numOfUsernames === 0 || numOfUsernames === 2) {
        return;
    }
    return usernames[0];
}