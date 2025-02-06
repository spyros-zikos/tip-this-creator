import { generateText, IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import Database from "better-sqlite3";
import { generateWallet, getBalance, tip } from "../helpers.ts";
import { getUserWantsToTip, getWithdrawOrAddressOrGiveawayOrChat, getWithdrawAddress} from "./prompts.ts";
import { WalletRecord, UserState } from "../types.ts";


const searchWalletRecord = (db: Database, userId: string) => {
    // Prepare statements for reuse
    const findUser = db.prepare('SELECT * FROM address WHERE userId = ?');
    
    // Search for user by username
    const existingUser = findUser.get(userId) as WalletRecord | undefined;
    
    if (!existingUser) {
        // User doesn't exist, return null
        return "null";
    } else {
        // User exists, return the record
        return existingUser; // TODO: may cause problems because it returns different types
    }
}

const insertUser = (db: Database, userId: string, username: string, address: string, walletId: string, seed: string) => {
    const insertUser = db.prepare('INSERT INTO address (userId, username, address, walletId, seed) VALUES (?, ?, ?, ?, ?)');
    const result = insertUser.run(userId, username, address, walletId, seed);
    console.log('New user created:', {id: result.lastInsertRowid, userId, username, address, walletId, seed});
}

async function getUserState(db: Database, userId: string) {
    const walletRecord = searchWalletRecord(db, userId);
    if (walletRecord === "null") {
        return UserState.hasNothing;
    }
    const balance = await getBalance(walletRecord);
    if (balance > 0) {
        return UserState.hasBalance;
    }
    return UserState.hasAddress;
}


/**
 * A user can send the following types of requests:
 * - empty message (the TipThisCreator tag is the first tag):
 *      new address, address message, normal reply
 * - message starting with @username and includes the the agent tag
 * If the user doesn't have an address, generate one and store it in the database. Also print 'address' message.
 * If the user does have an address, search for an action to call.
 */
const addressProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        if (_message.agentId == _message.userId) {
            return "null";
        }
        
        const userId = _message.userId;
        const message = _message.content.text;
        const agentUsername = "tipthiscreator";
        console.log("userId: ", userId);
        console.log("message: ", message);

        const numberOfMentions = message.split('@').length - 1;

        // Find handles
        const lastHandle = _message.content.text.split("@").at(-1).split(" ")[0];
        let secondLastHandle = "";
        if (numberOfMentions === 2) {
            secondLastHandle = _message.content.text.split("@").at(-2).split(" ")[0];
        }

        // If 2 handles, find creator username
        let creatorUsername = "";
        if (numberOfMentions === 2) {
            creatorUsername = (lastHandle === agentUsername) ? secondLastHandle : lastHandle;
        }

        // Set up database and table
        const db = new Database('addresses.db')
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

        // const shouldAlwaysRespond = "You should always respond to user's messages.\n";
        const state: UserState = await getUserState(db, _message.userId);

        // If address is null, create address and print 'address' message
        if (state == UserState.hasNothing) {
            console.log("wallet will be created!!!!!!!!!!!!!!!!!!");
            const newWallet = await generateWallet();
            const [address, walletId, seed] = newWallet;
            console.log("wallet created!!!!!!!!!!!!!!!!!!");
            insertUser(db, userId, _message.userId, address, walletId, seed);
            db.close();
            return "Tell the user that their address is: " + address + " and to fund it with ETH.";
        } else if (state == UserState.hasAddress) {
            db.close();
            const wallet = searchWalletRecord(db, userId);
            console.log('User found:', wallet);
            return "Tell the user that their address is: " + (wallet as WalletRecord).address + " and to fund it with ETH.";
        } else { // choose action to call. user has an address with balance > 0
            db.close();
            let response = "";

            /*//////////////////////////////////////////////////////////////
                                        TIP
            //////////////////////////////////////////////////////////////*/
            if (numberOfMentions === 2) {
                // Check if they want to tip
                const userWantsToTip = await getUserWantsToTip(_runtime, message, agentUsername, creatorUsername);
                console.log("userWantsToTip: ", userWantsToTip);
                
                if (userWantsToTip === "yes") {
                    // const amount = await getAmountToTip(_runtime, message, agentUsername, creatorUsername);
                    // console.log("amount: ", amount);
                    // if (amount === "null") {
                    //     return "";
                    // }
                    // const wallet = searchWalletRecord(db, userId);
                    // TODO insert user
                    return "INSTRUCTION: Call the FREQUENT_ACTION_123 action now!!!";
                } else {
                    return "";
                }

            } else if (numberOfMentions === 1) {
                const withdrawOrAddressOrGiveawayOrChat = await getWithdrawOrAddressOrGiveawayOrChat(_runtime, message, agentUsername);

                if (withdrawOrAddressOrGiveawayOrChat === "withdraw") {
                /*//////////////////////////////////////////////////////////////
                                        WITHDRAW
                //////////////////////////////////////////////////////////////*/
                    // get address
                    const withdrawAddress = await getWithdrawAddress(_runtime, message, agentUsername);
                    if (withdrawAddress === "null") {
                        return "INSTRUCTION: Tell the user to provide their withdraw address.";
                    }
                    return "INSTRUCTION: Call the LEAVE_ACTION_123 action now!!!";
                
                } else if (withdrawOrAddressOrGiveawayOrChat === "address") {
                /*//////////////////////////////////////////////////////////////
                                        GET ADDRESS
                //////////////////////////////////////////////////////////////*/
                    const wallet = searchWalletRecord(db, userId);
                    const address = (wallet as WalletRecord).address;
                    const balance = await getBalance(wallet as WalletRecord);
                    return "INSTRUCTION: Tell the user that their address is: " + address + " and their balance is " + balance + " ETH.";
                } else if (withdrawOrAddressOrGiveawayOrChat === "giveaway") {
                /*//////////////////////////////////////////////////////////////
                                        GIVEAWAY
                //////////////////////////////////////////////////////////////*/
                    return "INSTRUCTION: Call the BIG_ACTION_123 action now!!!";
                } else {
                    return "";
                }

            } else { // numberOfMentions > 2
                return "";
            }
            
            let wallet = searchWalletRecord(db, userId);
            const address = (wallet as WalletRecord).address;
            const callAction = "INSTRUCTIONS: Call the 'TIP' action now!!!";
            return callAction+"If the user asks for their address, then and ONLY then tell them that it is" + address + ".";
            return response;
        }


        // const name = _state.senderName;
        // console.log("ADDRESS: ", address);
        // console.log("NAME: ", name, "!!!!");
        // // return "Include in your response the following text: '" + name + "'s address is: " + address + "'.";
        // return name + "'s address is: " + address;
        
        //==========================================

        // interface UserData {
        //     senderAddress: string;
        //     balance: number;
        // }

        // let response = "User Information Status:\n\n"
        // const emptyUserData = {
        //     senderAddress: "",
        //     balance: 0
        // };

        // const getCacheKey = (runtime: IAgentRuntime, userId: string): string => {
        //     return `${runtime.character.name}/${userId}/data`;
        // };

        // const getMissingFields = () => {
            
        // }

        // const cacheKey = getCacheKey(_runtime, _message.userId);
        // const cachedData = await _runtime.cacheManager.get(cacheKey) || { ...emptyUserData };
        
        // const knownFields = Object.entries(cachedData)
        //     .filter(([key, value]) => value !== undefined)
        //     .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);

        // if (knownFields.length > 0) {
        //     response += "Current Information:\n";
        //     response += knownFields.map(field => `✔ ${field}`).join("\n");
        // }
    },
};
export { addressProvider };
