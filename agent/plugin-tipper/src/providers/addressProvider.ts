import { generateText, IAgentRuntime, Memory, ModelClass, Provider, State, stringToUuid } from "@elizaos/core";
import Database from "better-sqlite3";
import {
    generateWallet,
    getBalance,
    tip, 
    agentUsername, 
    getCreatorUsername, 
    getTwitterIdFromUsername,
    searchWalletRecord,
    insertUser,
    getUserState,
    networkId
} from "../helpers.ts";
import { getUserWantsToTip, getWithdrawOrAddressOrGiveawayOrChat, getWithdrawAddress} from "./prompts.ts";
import { WalletRecord, UserState } from "../types.ts";
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';


export async function sth(_runtime: IAgentRuntime, message: string, agentUsername: string, creatorUsername: string) {
    const contextTipOrNot = `Say hello`;

    const response = await generateText({
        runtime: _runtime,
        context: contextTipOrNot,
        modelClass: ModelClass.LARGE,
        stop: ["\n"],
    });

    return response;
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
        Coinbase.configure({ apiKeyName: process.env.CDP_API_KEY_NAME, privateKey: process.env.CDP_PRIVATE_KEY });
        
        const userId = _message.userId;
        const message = _message.content.text;
        console.log("userId: ", userId, ", message: ", message);


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

        const noActions = "\n CALL THE NONE ACTION WHICH MEANS DON'T DO ANY ACTION.";
        const noContinue = "\n NEVER CALL THE CONTINUE ACTION.";
        const state: UserState = await getUserState(db, _message.userId);
        // const sss = await sth(_runtime, message, agentUsername, 'sdfsdf');
        // console.log("sss: ", sss);

        // If address is null, create address and print 'address' message
        if (state == UserState.hasNothing) {
            console.log("wallet will be created!!!!!!!!!!!!!!!!!!");
            const [address, walletId, seed] = await generateWallet();
            console.log("wallet created!!!!!!!!!!!!!!!!!!");
            const username = '-NONE-';
            insertUser(db, _message.userId, username, address, walletId, seed);
            // db.close();
            return `# IMPORTANT INSTRUCTIONS: 
Tell the user that their address is ${address} and to fund it with ETH.
${noActions}
${noContinue}`;
        } else if (state == UserState.hasAddress) {
            const wallet = searchWalletRecord(db, userId);
            console.log('User found:', wallet);
            return `# IMPORTANT INSTRUCTIONS: 
Tell the user that their address is ${(wallet as WalletRecord).address} 
Tell the user that their balance is 0 and to fund their it with ETH.
${noActions}
${noContinue}`;
        } else { // choose action to call. user has an address with balance > 0
            let response = "";
            const numberOfMentions = message.split('@').length - 1;


            /*//////////////////////////////////////////////////////////////
                                        TIP
            //////////////////////////////////////////////////////////////*/
            if (numberOfMentions === 2) {
                // Check if they want to tip
                const creatorUsername = getCreatorUsername(message);
                console.log("creatorUsername: ", creatorUsername);
                const userWantsToTip = await getUserWantsToTip(_runtime, message, agentUsername, creatorUsername);
                console.log("userWantsToTip: ", userWantsToTip);
                
                if (userWantsToTip === "yes") {
                    return `# IMPORTANT INSTRUCTIONS:
Call the FREQUENT_ACTION_123 action now!!!`;
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
                    const walletRecord = searchWalletRecord(db, userId) as WalletRecord;
                    const address = walletRecord.address;
                    const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
                    const balance = await getBalance(wallet);
                    return `# IMPORTANT INSTRUCTIONS:
Tell the user that their address is ${address} and their balance is ${balance} ETH."`;
                } else if (withdrawOrAddressOrGiveawayOrChat === "giveaway") {
                /*//////////////////////////////////////////////////////////////
                                        GIVEAWAY
                //////////////////////////////////////////////////////////////*/
                    return `# IMPORTANT INSTRUCTIONS:
Call the BIG_ACTION_123 action now!!!`;
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
