import { generateText, IAgentRuntime, Memory, messageCompletionFooter, ModelClass, Provider, State, stringToUuid } from "@elizaos/core";
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
    networkId,
    getDB
} from "../helpers.ts";
import { getUserWantsToTip, getWithdrawOrAddressOrGiveawayOrChat, getWithdrawAddress} from "./prompts.ts";
import { WalletRecord, UserState } from "../types.ts";
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';


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
        // const creatorUserId = stringToUuid(await getTwitterIdFromUsername('testthechar'));
        // console.log('testthechar ' + creatorUserId);

        Coinbase.configure({ apiKeyName: process.env.CDP_API_KEY_NAME, privateKey: process.env.CDP_PRIVATE_KEY });
        const db = getDB();
        const message = _message.content.text;
        let response = `# IMPORTANT INSTRUCTIONS:
ALWAYS RESPOND TO EVERY MESSAGE.
`;

        const noActionsAndNoContinue = `
CALL THE NONE ACTION WHICH MEANS DON'T DO ANY ACTION.
NEVER CALL THE CONTINUE ACTION.
`;
        const respondToMessage = `IMPORTANT: RESPOND TO THE FOLLOWING MESSAGE AND TALK TO THE USER.`;
        const state: UserState = await getUserState(db, _message.userId);

        // If address is null, create address and print 'address' message
        if (state == UserState.hasNothing) {
            console.log("wallet will be created!!!!!!!!!!!!!!!!!!");
            const [address, walletId, seed] = await generateWallet();
            console.log("wallet created!!!!!!!!!!!!!!!!!!");
            const username = '-NONE-';
            insertUser(db, _message.userId, username, address, walletId, seed);
            // db.close();
            response += `Tell the user that their address is ${address} and to fund it with ETH.`;
            response += noActionsAndNoContinue;
            response += respondToMessage;
            return response;
        } else if (state == UserState.hasAddress) {
            const wallet = searchWalletRecord(db, _message.userId);
            console.log('User found:', wallet);
            response += `Tell the user that their address is ${(wallet as WalletRecord).address}.
Tell the user that their balance is 0 and to fund their it with ETH.`;
            response += noActionsAndNoContinue;
            response += respondToMessage;
            return response;
        } else { // choose action to call. user has an address with balance > 0
            console.log("message: ", message);
            // const numberOfMentions = message.split('@').length - 1;
            const usernames = message.split("@").map(e=>e.split(" ")[0]).filter((e,i)=>(e!==agentUsername&&i!=0))
            const numOfUsernames = usernames.length;
            console.log("numOfUsernames: ", numOfUsernames);
            console.log("usernames: ", usernames);

            /*//////////////////////////////////////////////////////////////
                                        TIP
            //////////////////////////////////////////////////////////////*/
            if (numOfUsernames === 1) {
                // Check if they want to tip
                const creatorUsername = getCreatorUsername(message);
                console.log("creatorUsername: ", creatorUsername);
                const userWantsToTip = await getUserWantsToTip(_runtime, message, agentUsername, creatorUsername);
                console.log("userWantsToTip: ", userWantsToTip);
                
                if (userWantsToTip === "yes") {
                    response += `Call the FREQUENT_ACTION_123 action now!!!`;
                    response += respondToMessage;
                    return response;
                } else {
                    response += noActionsAndNoContinue;
                    response += respondToMessage;
                    return response;
                }

            } else if (numOfUsernames === 0) {
                const withdrawOrAddressOrGiveawayOrChat = await getWithdrawOrAddressOrGiveawayOrChat(_runtime, message, agentUsername);
                console.log("user want to:", withdrawOrAddressOrGiveawayOrChat);
                
                if (withdrawOrAddressOrGiveawayOrChat === "withdraw") {
                /*//////////////////////////////////////////////////////////////
                                        WITHDRAW
                //////////////////////////////////////////////////////////////*/
                    // get address
                    const withdrawAddress = await getWithdrawAddress(_runtime, message, agentUsername);
                    if (withdrawAddress === "null") {
                        response += "Tell the user to provide their withdraw address.";
                        response += noActionsAndNoContinue;
                        response += respondToMessage;
                        return response;
                    }
                    response += "Call the GO_OUT_ACTION_123 action now!!!";
                    response += respondToMessage;
                    return response;
                
                } else if (withdrawOrAddressOrGiveawayOrChat === "address") {
                /*//////////////////////////////////////////////////////////////
                                        GET ADDRESS
                //////////////////////////////////////////////////////////////*/
                    const walletRecord = searchWalletRecord(db, _message.userId) as WalletRecord;
                    const address = walletRecord.address;
                    const wallet = await Wallet.import({walletId: walletRecord.walletId, seed: walletRecord.seed, networkId: networkId});
                    const balance = await getBalance(wallet);
                    response += `Tell the user that their address is ${address} and their balance is ${balance} ETH."`;
                    response += noActionsAndNoContinue;
                    response += respondToMessage;
                    return response;
                } else if (withdrawOrAddressOrGiveawayOrChat === "giveaway") {
                /*//////////////////////////////////////////////////////////////
                                        GIVEAWAY
                //////////////////////////////////////////////////////////////*/
                    response += `Call the BIG_ACTION_123 action now!!!`;
                    response += respondToMessage;
                    return response;
                } else {
                    response += noActionsAndNoContinue;
                    response += respondToMessage;
                    return response;
                }

            }
            //  else { // numberOfMentions > 2
            //     response += noActionsAndNoContinue;
            //     return response;
            // }
        }
    },
};
export { addressProvider };
